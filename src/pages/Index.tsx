import React, { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { ImageViewer } from '@/components/ImageViewer'
import { ReportPanel } from '@/components/ReportPanel'
import { EvaluationMetrics } from '@/components/EvaluationMetrics'
import { addEmptyMetrics, shuffle } from '@/lib/utils'
import { Record } from '@/types'
import useEvalutationStore from '@/stores/evaluation'
import { Button } from '@/components/ui/button'
import { setRecords, getMetrics } from '@/services'
import { useToast } from '@/hooks/use-toast'

interface Props {
  records: Record[]
}

const Index = (props: Props) => {
  const { records } = props
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [metrics, setMetrics] = useState([
    { label: 'Loading...', id: '0' }
  ])

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const initId = useEvalutationStore((state) => state.initAtId)
  const doneForId = useEvalutationStore((state) => state.doneForId)
  const setDoneForId = useEvalutationStore((state) => state.setDoneForId)
  const resetDoneStatus = useEvalutationStore((state) => state.resetDoneStatus)

  useEffect(() => {
    // Reset all evaluation data on initial load to ensure clean state
    console.log("Reset evaluation data on initial load");
    resetDoneStatus();
    
    // Check if we need to force a complete reset
    const urlParams = new URLSearchParams(window.location.search);
    const forceReset = urlParams.get('force') === 'true' || true; // Always force reset for now
    
    if (forceReset) {
      console.log("Forcing complete reset of evaluation store");
      // Clear any evaluation data directly in the store
      useEvalutationStore.setState({
        evaluation: {},
        doneForId: {}
      });
      
      // Remove the force parameter from URL to prevent endless resets
      urlParams.delete('force');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
      window.history.replaceState({}, document.title, newUrl);
      
      // Add a debug message to help track
      console.log("Evaluation store has been completely reset");
    }
  }, [resetDoneStatus]);

  useEffect(() => {
    const fetchMetrics = async () => {
      console.log("Starting metrics fetch");
      try {
        console.log("Calling getMetrics API");
        const metricsData = await getMetrics();
        console.log("Raw metrics data from API:", metricsData);
        
        if (!metricsData || metricsData.length === 0) {
          console.error("No metrics returned from API");
          toast({
            title: "Error",
            description: "No metrics found. Please contact support.",
            variant: "destructive",
          });
          return;
        }
        
        // Transform backend metrics to the format expected by the component
        const formattedMetrics = metricsData.map(metric => ({
          label: metric.name,
          id: metric.id
        }));
        
        console.log("Setting formatted metrics:", formattedMetrics);
        setMetrics(formattedMetrics);
        console.log("Fetched metrics from backend:", formattedMetrics);
      } catch (error) {
        console.error("Error fetching metrics:", error);
        toast({
          title: "Error",
          description: "Failed to load metrics from the backend",
          variant: "destructive",
        });
      }
    };
    
    console.log("Setting up metrics fetch");
    fetchMetrics();
  }, [toast]);

  const handleImageChange = (newIndex: number) => {
    setCurrentImageIndex(newIndex)
  }

  // Ensure records are loaded before trying to access them
  if (!records || records.length === 0) {
    console.log("No records available");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-medical-darkest-gray text-foreground">
        <p>Loading records...</p>
      </div>
    );
  }

  console.log("Records available:", records.length);
  
  const activeRecord = records[currentImageIndex]
  console.log("Active record:", activeRecord ? activeRecord.id : "none");
  
  const modelReports = activeRecord ? shuffle([...activeRecord.modelOutputs]) : []
  console.log("Model reports:", modelReports.length);
  
  console.log("Current metrics state:", metrics);
  console.log("Current active record evaluations:", activeRecord ? activeRecord.evaluations : "none");
  
  const modelScores = activeRecord ? addEmptyMetrics(activeRecord.evaluations, metrics).sort(
    (a, b) => {
      const aIndex = modelReports.findIndex((x) => x.modelId === a.modelId)
      const bIndex = modelReports.findIndex((x) => x.modelId === b.modelId)

      return aIndex - bIndex
    }
  ) : []
  
  console.log("Calculated model scores:", modelScores);

  // Initialize evaluations when metrics are loaded for the current record
  useEffect(() => {
    if (metrics.length > 0 && metrics[0].id !== '0' && activeRecord?.id) {
      console.log("Initializing evaluation data for record:", activeRecord.id);
      
      try {
        // Set a flag in the UI to show initialization is happening
        setIsSubmitting(true);
        
        // Always create default scores regardless of existing data
        const defaultScores = activeRecord.modelOutputs.map(output => {
          // Find any existing evaluations for this model
          const existingModelEval = activeRecord.evaluations.find(
            evaluation => evaluation.modelId === output.modelId
          );
          
          return {
            modelId: output.modelId,
            metrics: metrics.map(metric => {
              // Check if we have an existing value for this metric
              const existingValue = existingModelEval?.metrics.find(
                m => m.id === metric.id
              )?.value || 0;
              
              return {
                id: metric.id,
                label: metric.label,
                value: existingValue
              };
            })
          };
        });
        
        console.log("Created default scores for initialization:", defaultScores);
        
        // Always use default scores to ensure initialization works
        initId(activeRecord.id, defaultScores);
        
        // Don't mark as done automatically to allow editing
        // Only the submit action should mark records as done
        
        // Set initialization complete
        setIsSubmitting(false);
        
        // Debug check if initialization worked
        setTimeout(() => {
          const state = useEvalutationStore.getState();
          console.log("After initialization, store state:", state.evaluation);
          
          // Add more detailed debug information
          console.log("Evaluation store complete state:", state);
          console.log("Evaluation for current record:", state.evaluation[activeRecord.id]);
          
          // If store still doesn't have the evaluation data, try one more time
          if (!state.evaluation[activeRecord.id]) {
            console.warn("Evaluation data not found in store after initialization, retrying with force");
            
            // Try a direct state update approach as backup
            useEvalutationStore.setState(state => {
              const newState = { ...state };
              newState.evaluation[activeRecord.id] = defaultScores;
              // Don't mark as done to allow editing
              return newState;
            });
          }
        }, 200);
      } catch (error) {
        console.error("Error initializing evaluation data:", error);
        setIsSubmitting(false);
      }
    } else {
      console.log("Not initializing evaluation data. Conditions:", {
        "metrics.length > 0": metrics.length > 0,
        "metrics[0].id !== '0'": metrics[0]?.id !== '0',
        "activeRecord?.id": activeRecord?.id
      });
    }
  }, [metrics, activeRecord, initId, setDoneForId]);

  const handleSubmit = async () => {
    if (!activeRecord?.id) return;
    
    setIsSubmitting(true);
    try {
      const result = await setRecords(activeRecord.id);
      
      if (result.partial) {
        // Some evaluations were successful, but some failed
        toast({
          title: "Partial Success",
          description: result.message || "Some evaluations were submitted successfully, but others failed.",
          variant: "default",
        });
        
        // If we have specific errors, display them in a more detailed way
        if (result.errors && result.errors.length > 0) {
          // Show only first 3 errors to avoid UI clutter
          const displayErrors = result.errors.slice(0, 3);
          
          displayErrors.forEach(error => {
            toast({
              title: "Error Details",
              description: error,
              variant: "destructive",
            });
          });
          
          // If there are more errors, show a count
          if (result.errors.length > 3) {
            toast({
              title: "Additional Errors",
              description: `${result.errors.length - 3} more errors occurred. Check console for details.`,
              variant: "destructive",
            });
          }
        }
      } else {
        // All evaluations were successful
        toast({
          title: "Success",
          description: "All evaluations submitted successfully",
        });
        
        // After successful submission, reset the evaluation store to clear data
        resetDoneStatus();
      }
    } catch (error) {
      console.error("Error submitting evaluations:", error);
      
      // Extract error message if available
      let errorMessage = "Failed to submit evaluations. Please try again.";
      let detailedMessage = "";
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
        
        // Check if the error message contains unique constraint violation
        if (errorMessage.includes("unique set") || errorMessage.includes("case_assignment") || errorMessage.includes("model_response")) {
          detailedMessage = "It appears you may have already submitted evaluations for this case. Please try refreshing the page.";
        }
      } else if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check for non-field errors (Django REST Framework format)
        if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
          errorMessage = `API Error: ${errorData.non_field_errors[0]}`;
          
          // Check for unique constraint error
          if (errorData.non_field_errors[0].includes("unique set")) {
            detailedMessage = "It appears you may have already submitted evaluations for this case. Please try refreshing the page.";
          }
        } 
        // Check for field-specific errors
        else if (typeof errorData === 'object') {
          const firstErrorField = Object.keys(errorData)[0];
          if (firstErrorField && errorData[firstErrorField].length > 0) {
            errorMessage = `Error with ${firstErrorField}: ${errorData[firstErrorField][0]}`;
          }
        }
      }
      
      // Show the main error message
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If we have a detailed message, show it as a follow-up toast
      if (detailedMessage) {
        setTimeout(() => {
          toast({
            title: "Recommendation",
            description: detailedMessage,
            variant: "default",
          });
        }, 500);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  console.log({ activeRecord, modelReports, modelScores })

  return (
    <div className="h-screen flex flex-col bg-medical-darkest-gray text-foreground overflow-hidden">
      <header className="bg-medical-darker-gray px-8 py-3 border-b border-medical-dark-gray/30 flex justify-between items-center">
        <h1 className="text-xl font-bold text-medical-blue flex items-center">
          <Settings className="mr-2" size={20} />
          X-Ray AI Insights Hub
        </h1>
        <div className="flex items-center">
          <span className="font-medium text-sm mr-2">
            Current Evaluator:
          </span>
          <span className="font-medium">
            Dr. John Smith
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-auto">
        <div className="flex gap-4 h-[calc(65vh-2rem)]">
          <div className="w-2/5">
            <ImageViewer
              currentImage={activeRecord.imageUrl}
              currentIndex={currentImageIndex}
              onChangeImage={handleImageChange}
              totalImages={records.length}
            />
          </div>

          <div className="w-3/5 grid grid-cols-2 grid-rows-2 gap-4">
            <ReportPanel 
              isGroundTruth
              report={activeRecord.groundTruth}
            />
            {modelReports.map((report, index) => (
              <ReportPanel
                key={index}
                report={report}
                title={`MODEL ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-[calc(35vh-6rem)]">
          <EvaluationMetrics
            activeRecordId={activeRecord.id || ''}
            metrics={metrics}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="flex justify-center flex-col pt-2">
          <p className="text-center text-sm text-gray-400 py-2">
            Note: This submits all records. Please use this once you are done
            with all records.
          </p>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || metrics[0].id === '0' || !activeRecord?.id}
            className="bg-medical-blue hover:bg-medical-blue/90"
          >
            {isSubmitting ? "Submitting..." : 
             metrics[0].id === '0' ? "Loading Metrics..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Index
