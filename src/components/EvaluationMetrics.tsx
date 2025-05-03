import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useEvalutationStore from '@/stores/evaluation'

export interface ModelScore {
  responseId: string
  metrics: {
    id: string
    label: string
    value: number
  }[]
}

interface ModelResponse {
  id: string
  model_name: string
  response: any
}

interface EvaluationMetricsProps {
  metrics: { id: string; label: string }[]
  activeRecordId: string
  isSubmitting?: boolean
  onStatusChange?: (status: string) => void
  modelResponses: ModelResponse[]
}

interface EvaluationProgress {
  completed: number
  total: number
  status: string
}

export const EvaluationMetrics: React.FC<EvaluationMetricsProps> = ({
  activeRecordId,
  metrics,
  isSubmitting = false,
  onStatusChange,
  modelResponses
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<EvaluationProgress>({ completed: 0, total: 0, status: 'pending' });
  const evaluation = useEvalutationStore((state) => state.evaluation)
  const setEvaluation = useEvalutationStore((state) => state.setEvaluation)
  const initId = useEvalutationStore((state) => state.initAtId)

  const activeEvaluation = activeRecordId ? evaluation[activeRecordId] : undefined

  // Initialize evaluation store with model responses
  useEffect(() => {
    if (activeRecordId && modelResponses.length > 0) {
      console.log('Initializing evaluation store with model responses:', modelResponses);
      
      // Create default evaluation data structure
      const defaultEvaluations = modelResponses.map(response => ({
        responseId: response.id,
        metrics: metrics.map(metric => ({
          id: metric.id,
          label: metric.label,
          value: 0
        }))
      }));

      // Initialize store with default evaluations
      initId(activeRecordId, defaultEvaluations);
      setIsLoading(false);
    }
  }, [activeRecordId, modelResponses, metrics]);

  // Fetch existing evaluations when component mounts or activeRecordId changes
  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!activeRecordId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/evaluations/${activeRecordId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch evaluations');
        }

        const data = await response.json();
        
        // Transform the data to match our store format
        const formattedData = modelResponses.map(modelResponse => {
          const responseEvaluations = data.model_responses.find(
            (r: any) => r.id === modelResponse.id
          )?.evaluations || [];

          return {
            responseId: modelResponse.id,
            metrics: metrics.map(metric => {
              const evaluation = responseEvaluations.find(
                (e: any) => e.metric_id === metric.id
              );
              return {
                id: metric.id,
                label: metric.label,
                value: evaluation?.score || 0
              };
            })
          };
        });

        // Update progress information
        if (data.progress) {
          setProgress(data.progress);
          onStatusChange?.(data.progress.status);
        }

        // Initialize the store with fetched data
        initId(activeRecordId, formattedData);
      } catch (error) {
        console.error('Error fetching evaluations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [activeRecordId]);

  // Function to update individual evaluation
  const updateEvaluation = async (responseId: string, metricId: string, value: number) => {
    try {
      // Update local state
      setEvaluation(activeRecordId, {
        metricId,
        responseId,
        value,
      });

      // Make API call to update backend
      const response = await fetch('/api/evaluations/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: activeRecordId,
          responseId,
          metricId,
          score: value
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update evaluation');
      }

      const data = await response.json();
      onStatusChange?.(data.status);

    } catch (error) {
      console.error('Error updating evaluation:', error);
      // Optionally revert the local state change on error
    }
  };

  const handleSubmitEvaluations = async () => {
    if (!activeEvaluation || !activeRecordId) return;
    
    setIsSaving(true);
    try {
      const evaluationData = activeEvaluation.map(model => ({
        responseId: model.responseId,
        metrics: model.metrics.map(metric => ({
          metricId: metric.id,
          score: metric.value
        }))
      }));

      const response = await fetch('/api/evaluations/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: activeRecordId,
          evaluations: evaluationData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit evaluations');
      }

      const data = await response.json();

      // Update progress information
      if (data.progress) {
        setProgress(data.progress);
        onStatusChange?.(data.progress.status);
      }

      alert(data.message || 'Evaluations submitted successfully');
    } catch (error) {
      console.error('Error submitting evaluations:', error);
      alert('Failed to submit evaluations. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to get background color based on score
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-medical-dark-gray'

    // Calculate the color using a gradient
    const red = Math.round(255 * (1 - score / 10))
    const green = Math.round(255 * (score / 10))

    return `bg-[rgb(${red},${green},0)]`
  }

  // Check if metrics are still loading
  if (!metrics || metrics.length === 0 || metrics[0].id === '0') {
    return (
      <div className="rounded-lg border border-medical-dark-gray/30 overflow-hidden">
        <div className="bg-medical-dark-gray/50 p-3 border-b border-medical-dark-gray/30">
          <h2 className="text-lg font-medium">EVALUATION METRICS</h2>
        </div>
        <div className="p-8 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading metrics data...
          </div>
        </div>
      </div>
    );
  }

  // If parent component is submitting, show loading state
  if (isSubmitting) {
    return (
      <div className="rounded-lg border border-medical-dark-gray/30 overflow-hidden">
        <div className="bg-medical-dark-gray/50 p-3 border-b border-medical-dark-gray/30">
          <h2 className="text-lg font-medium">EVALUATION METRICS</h2>
        </div>
        <div className="p-8 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Initializing evaluation system...
          </div>
        </div>
      </div>
    );
  }

  // If activeEvaluation is not ready yet, create default evaluation data
  if (!activeEvaluation || activeEvaluation.length === 0) {
    console.log("No active evaluation data available yet, creating default metrics");
    
    // Create default evaluation models with zero scores
    // This assumes we can get modelIds from the parent component via the URL or context
    // We'll use placeholders for now and apply a simplified approach
    const defaultModels: ModelScore[] = [
      {
        responseId: "response1",
        metrics: metrics.map(metric => ({
          id: metric.id,
          label: metric.label,
          value: 0
        }))
      },
      {
        responseId: "response2",
        metrics: metrics.map(metric => ({
          id: metric.id,
          label: metric.label,
          value: 0
        }))
      }
    ];
    
    // Always initialize with default models to ensure the store has data
    if (activeRecordId && !isSubmitting) {
      console.log("Initializing default data in component for:", activeRecordId);
      initId(activeRecordId, defaultModels);
      
      // Force a refresh of the component after initialization
      setTimeout(() => {
        const state = useEvalutationStore.getState();
        if (state.evaluation[activeRecordId]) {
          console.log("Successfully initialized default evaluation data");
        }
      }, 100);
    }
    
    // Render a table with the default models instead of showing a loading message
    return (
      <div className="rounded-lg border border-medical-dark-gray/30 overflow-hidden">
        <div className="bg-medical-dark-gray/50 p-3 border-b border-medical-dark-gray/30">
          <h2 className="text-lg font-medium">EVALUATION METRICS</h2>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-medical-dark-gray/30 border-b border-medical-dark-gray/30">
                <th className="p-3 text-left w-24">MODEL</th>
                {metrics.map((metric) => (
                  <th key={metric.id} className="p-3 text-center">
                    {metric.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {defaultModels.map((model, idx) => (
                <tr
                  key={model.responseId}
                  className="border-b border-medical-dark-gray/20"
                >
                  <td className="p-3 font-medium text-left">{`Model ${
                    idx + 1
                  }`}</td>

                  {metrics.map((metric) => (
                    <td
                      key={`${model.responseId}-${metric.id}`}
                      className="p-3 text-center"
                    >
                      <select
                        defaultValue={0}
                        name="metrics"
                        id="rate-model-output"
                        onChange={(e) => {
                          const newValue = Number(e.target.value);
                          console.log(`Setting initial value for ${model.responseId}, metric ${metric.id} to ${newValue}`);
                          
                          // First, make sure the store has this record
                          if (!useEvalutationStore.getState().evaluation[activeRecordId]) {
                            console.log("Store needs initialization before setting value");
                            initId(activeRecordId, defaultModels);
                          }
                          
                          // Then set the evaluation value
                          setEvaluation(activeRecordId, {
                            metricId: metric.id,
                            responseId: model.responseId,
                            value: newValue,
                          });
                        }}
                      >
                        <option value="0">--</option>
                        {[...Array(5)].map((_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 text-center text-sm text-gray-400">
          <p>
            Please select evaluation scores for each metric from 0-5.
            <button 
              className="ml-2 px-2 py-1 bg-medical-dark-gray/50 rounded hover:bg-medical-dark-gray/70"
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching initial data
  if (isLoading) {
    return (
      <div className="rounded-lg border border-medical-dark-gray/30 overflow-hidden">
        <div className="bg-medical-dark-gray/50 p-3 border-b border-medical-dark-gray/30">
          <h2 className="text-lg font-medium">EVALUATION METRICS</h2>
        </div>
        <div className="p-8 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading evaluations...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-medical-dark-gray/30 overflow-hidden">
      <div className="bg-medical-dark-gray/50 p-3 border-b border-medical-dark-gray/30">
        <h2 className="text-lg font-medium">EVALUATION METRICS</h2>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-medical-dark-gray/30 border-b border-medical-dark-gray/30">
              <th className="p-3 text-left w-24">MODEL</th>
              {metrics.map((metric) => (
                <th key={metric.id} className="p-3 text-center">
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {activeEvaluation?.map((model) => {
              const modelResponse = modelResponses.find(r => r.id === model.responseId);
              if (!modelResponse) return null;

              return (
                <tr
                  key={model.responseId}
                  className="border-b border-medical-dark-gray/20"
                >
                  <td className="p-3 font-medium text-left">
                    {modelResponse.model_name}
                  </td>

                  {metrics.map((metric) => {
                    const score = model.metrics.find(
                      (x) => x.id === metric.id
                    )?.value

                    return (
                      <td
                        key={`${model.responseId}-${metric.id}`}
                        className="p-3 text-center"
                      >
                        <select
                          value={score || 0}
                          name="metrics"
                          id="rate-model-output"
                          disabled={isSubmitting}
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            updateEvaluation(model.responseId, metric.id, newValue);
                          }}
                        >
                          <option value="0">--</option>
                          {[...Array(5)].map((_, i) => (
                            <option key={i} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>
                      </td>
                    )
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
