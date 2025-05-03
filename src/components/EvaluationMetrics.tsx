import React from 'react'
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
  modelId: string
  metrics: {
    id: string
    label: string
    value: number
  }[]
}

interface EvaluationMetricsProps {
  metrics: { id: string; label: string }[]
  // modelScores: ModelScore[]
  activeRecordId: string
  isSubmitting?: boolean
}

export const EvaluationMetrics: React.FC<EvaluationMetricsProps> = ({
  activeRecordId,
  metrics,
  isSubmitting = false
  // modelScores,
}) => {
  const evaluation = useEvalutationStore((state) => state.evaluation)
  const setEvaluation = useEvalutationStore((state) => state.setEvaluation)

  const activeEvaluation = activeRecordId ? evaluation[activeRecordId] : undefined

  // Add more detailed debugging
  console.log("EvaluationMetrics - Current store state:", useEvalutationStore.getState());
  console.log("EvaluationMetrics - activeRecordId:", activeRecordId);
  console.log("EvaluationMetrics - evaluation object:", evaluation);
  console.log("EvaluationMetrics - activeEvaluation:", activeEvaluation);

  console.log({ activeEvaluation, isSubmitting })

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

  // If activeEvaluation is not ready yet, show a loading state
  if (!activeEvaluation || activeEvaluation.length === 0) {
    console.log("No active evaluation data available yet");
    // Show slightly different messages based on different states
    let statusMessage = "Initializing evaluation data...";
    let detailMessage = "If this message persists for more than a few seconds, there might be an issue with loading the metrics or initializing the evaluation data.";
    
    // Try to diagnose the issue
    const state = useEvalutationStore.getState();
    if (Object.keys(state.evaluation).length === 0) {
      detailMessage = "No evaluation data found in store. This may be your first time accessing this case.";
    } else if (!state.evaluation[activeRecordId]) {
      detailMessage = `Evaluation data exists in store but not for this record ID: ${activeRecordId}`;
    } else if (state.evaluation[activeRecordId].length === 0) {
      detailMessage = "Evaluation data exists for this record but it's empty.";
    }
    
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
            {statusMessage}
          </div>
          <div className="text-sm text-gray-400 mb-4">
            {detailMessage}
          </div>
          <button 
            className="mb-2 px-4 py-2 bg-medical-dark-gray/50 rounded hover:bg-medical-dark-gray/70"
            onClick={() => {
              window.location.reload();
            }}
          >
            Reload Page
          </button>
          <div>
            <button
              className="mt-2 px-4 py-2 bg-red-800/50 rounded hover:bg-red-800/70"
              onClick={() => {
                // Get the current URL and manually navigate to it with a force parameter
                const currentUrl = window.location.href;
                const separator = currentUrl.includes('?') ? '&' : '?';
                window.location.href = `${currentUrl}${separator}force=true&t=${Date.now()}`;
              }}
            >
              Force Reload with Reset
            </button>
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
            {activeEvaluation.map((model, idx) => (
              <tr
                key={model.modelId}
                className="border-b border-medical-dark-gray/20"
              >
                <td className="p-3 font-medium text-left">{`Model ${
                  idx + 1
                }`}</td>

                {metrics.map((metric) => {
                  const score = model.metrics.find(
                    (x) => x.id === metric.id
                  )?.value

                  return (
                    <td
                      key={`${model.modelId}-${metric.id}`}
                      className="p-3 text-center"
                    >
                      <select
                        value={score || 0}
                        name="metrics"
                        id="rate-model-output"
                        onChange={(e) => {
                          setEvaluation(activeRecordId, {
                            metricId: metric.id,
                            modelId: model.modelId,
                            value: Number(e.target.value),
                          })
                        }}
                      >
                        <option value="0">--</option>
                        {[...Array(10)].map((_, i) => {
                          return (
                            <option key={i} value={i + 1}>
                              {i + 1}
                            </option>
                          )
                        })}
                      </select>
                      {/* <Select
                        value={score?.toString()}
                        onValueChange={(value) =>
                          // onUpdateScore(
                          //   model.modelId,
                          //   metric.id,
                          //   parseInt(value)
                          // )
                          setEvaluation(activeRecordId, {
                            metricId: metric.id,
                            modelId: model.modelId,
                            value: Number(value),
                          })
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            'mx-auto transition-colors',
                            score !== null && 'text-white',
                            getScoreColor(score)
                          )}
                        >
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(10)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select> */}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
