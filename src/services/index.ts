import axios from 'axios'
import { Record } from '../types/Record'
import useEvalutationStore from '@/stores/evaluation'

const instance = axios.create({
  baseURL: '/api/', // Use the proxied URL instead of direct backend URL
  timeout: 5000,
  // headers: { 'X-Custom-Header': 'foobar' },
})

// Function to test the API connectivity
async function testBackendConnection(): Promise<boolean> {
  try {
    // Try to fetch a simple endpoint to check if the backend is responsive
    await instance.get('models/');
    console.log('✅ Backend connection successful');
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
}

// Get user details and role
async function getUserDetails(userId: string): Promise<{ id: string, name: string, email: string, role: string }> {
  try {
    // Get specific user by ID
    const response = await instance.get(`users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
}

// Check if a user is a supervisor
async function isSupervisor(userId: string): Promise<boolean> {
  try {
    const user = await getUserDetails(userId);
    return user.role === 'supervisor';
  } catch (error) {
    console.error('Error checking if user is supervisor:', error);
    return false;
  }
}

// Get all users/evaluators (for supervisors)
async function getAllEvaluators(): Promise<any[]> {
  try {
    // Only get users with role=evaluator
    const response = await instance.get('users/?role=evaluator');
    return response.data;
  } catch (error) {
    console.error('Error fetching evaluators:', error);
    throw error;
  }
}

// Get all evaluations (for supervisors) with optional filtering
async function getAllEvaluations(evaluatorId?: string, raw: boolean = true): Promise<any[]> {
  try {
    const url = evaluatorId ? `evaluations/?evaluator_id=${evaluatorId}` : 'evaluations/';
    console.log(`Fetching evaluations from URL: ${url}`);
    const response = await instance.get(url);
    
    // Log the raw evaluation data
    console.log('Raw evaluation data from API:', response.data);
    
    // If data is empty, return empty array
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.warn('No evaluations returned from API, returning empty array');
      return [];
    }
    
    // If raw is true, just return the raw data (for SupervisorDashboard to handle directly)
    if (raw) {
      return response.data;
    }
    
    // Map the data to ensure consistent structure, this helps debugging the "Unknown" issue
    const mappedData = response.data.map((evaluation: any) => {
      // Check for missing required fields and log warnings
      if (!evaluation.case_assignment) {
        console.warn('Evaluation missing case_assignment:', evaluation);
      }
      
      if (!evaluation.model_response) {
        console.warn('Evaluation missing model_response:', evaluation);
      }
      
      if (!evaluation.metric) {
        console.warn('Evaluation missing metric:', evaluation);
      }
      
      // Return with proper field mapping
      return {
        ...evaluation,
        case_assignment: evaluation.case_assignment || 'unknown-assignment',
        model_response: evaluation.model_response || 'unknown-model-response',
        metric: evaluation.metric || 'unknown-metric'
      };
    });
    
    console.log('Mapped evaluation data for frontend:', mappedData);
    return mappedData;
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    // Return empty array instead of throwing to make the UI more resilient
    console.warn('Returning empty array due to error fetching evaluations');
    return [];
  }
}

// Get all cases with details (for supervisors)
async function getAllCases(): Promise<any[]> {
  try {
    const response = await instance.get('cases/');
    return response.data;
  } catch (error) {
    console.error('Error fetching cases:', error);
    throw error;
  }
}

// New function to get all cases assigned to a specific evaluator (doctor)
async function getEvaluatorCases(evaluatorId: string): Promise<any[]> {
  try {
    // Get cases assigned to this evaluator
    const response = await instance.get(`users/${evaluatorId}/cases/`);
    
    // Return the list of cases
    return response.data;
  } catch (error) {
    console.error('Error fetching evaluator cases:', error);
    throw error;
  }
}

async function getRecords(radId: string): Promise<{ data: Record[] }> {
  try {
    console.log('Fetching records for radId:', radId);
    
    // Get case details using the case ID (radId)
    const caseResponse = await instance.get(`cases/${radId}/details/`);
    const caseData = caseResponse.data;
    console.log('Case data fetched:', caseData.case.id);
    
    // Ensure model_responses exists and is an array
    if (!caseData.model_responses || !Array.isArray(caseData.model_responses)) {
      console.warn('No model responses found in case data, creating empty structure');
      caseData.model_responses = [];
    }
    
    // Log model responses
    console.log('Model responses count:', caseData.model_responses.length);
    
    // Get available metrics
    const metricsResponse = await instance.get('metrics/');
    const metrics = metricsResponse.data;
    console.log('Metrics count:', metrics.length);
    
    // Get models info
    const modelsResponse = await instance.get('models/');
    const models = modelsResponse.data;
    console.log('Models count:', models.length);
    
    // Ensure there are model responses, create dummy ones if empty
    if (caseData.model_responses.length === 0 && models.length > 0) {
      console.log('Creating dummy model responses for new user');
      // Create dummy model responses based on available models
      caseData.model_responses = models.map(model => ({
        id: `dummy-${model.id}`,
        model: model.id,
        findings: "",
        impression: "",
        evaluations: []
      }));
    }
    
    // Transform Django API response to match our frontend Record type
    const recordData: Record = {
      id: caseData.case.id,
      imageUrl: caseData.case.image_url,
      modelOutputs: caseData.model_responses.map((response: any) => ({
        modelId: response.model,
        findings: response.findings || "",
        impressions: response.impression || "",
      })),
      groundTruth: {
        findings: caseData.case.ground_truth?.findings || "",
        impressions: caseData.case.ground_truth?.impression || "",
      },
      metrics: metrics.map((metric: any) => ({
        id: metric.id,
        label: metric.name,
      })),
      models: models.map((model: any) => ({
        id: model.id,
        label: model.name,
      })),
      evaluations: caseData.model_responses.map((response: any) => {
        // If there are existing evaluations for this model response, include them
        // This assumes the API returns evaluations with the model_responses
        return {
          modelId: response.model,
          metrics: metrics.map((metric: any) => {
            const existingEvaluation = response.evaluations?.find(
              (evaluation: any) => evaluation.metric === metric.id
            );
            
            return {
              id: metric.id,
              label: metric.name,
              value: existingEvaluation ? existingEvaluation.score : 0,
            };
          }),
        };
      }),
    };
    
    // Ensure modelOutputs always has at least one entry for a new user
    if (!recordData.modelOutputs || recordData.modelOutputs.length === 0) {
      console.warn('Model outputs still empty after processing, adding fallback model outputs');
      recordData.modelOutputs = [
        { modelId: "fallback_model1", findings: "", impressions: "" },
        { modelId: "fallback_model2", findings: "", impressions: "" }
      ];
      
      // Also update evaluations to match
      recordData.evaluations = recordData.modelOutputs.map(output => ({
        modelId: output.modelId,
        metrics: metrics.map(metric => ({
          id: metric.id,
          label: metric.name,
          value: 0
        }))
      }));
    }
    
    console.log('Processed record data with model outputs:', recordData.modelOutputs.length);
    
    return { data: [recordData] };
  } catch (error) {
    console.error('Error fetching records:', error);
    throw error;
  }
}

async function setRecords(radId: string) {
  try {
    const state = useEvalutationStore.getState();
    console.log("Evaluation store state:", state.evaluation);
    
    // Get all case assignments for this case
    const assignmentsResponse = await instance.get(`case-assignments/?case=${radId}`);
    console.log("Case assignments response:", assignmentsResponse.data);
    
    // Log all case assignment IDs for debugging
    const assignments = assignmentsResponse.data;
    console.log("Available case assignment IDs:", assignments.map((a: any) => a.id));
    
    if (!assignments || assignments.length === 0) {
      throw new Error('No case assignments found for this case');
    }
    
    // Get case assignment ID - use the first one for now
    // In a real app, you would filter for the current evaluator
    const caseAssignmentId = assignments[0].id;
    console.log("Selected case assignment ID:", caseAssignmentId, "Full assignment:", assignments[0]);
    
    // Get case details including model responses
    const caseResponse = await instance.get(`cases/${radId}/details/`);
    console.log("Case details response:", caseResponse.data);
    
    // Log model responses for debugging
    const modelResponses = caseResponse.data.model_responses;
    console.log("Available model responses:", modelResponses.map((r: any) => ({ id: r.id, model: r.model })));
    
    // Get existing evaluations for this case assignment to determine if we need to create or update
    const existingEvaluationsResponse = await fetch(`/api/evaluations/?case_assignment=${caseAssignmentId}`);
    const existingEvaluations = await existingEvaluationsResponse.json();
    console.log("Existing evaluations for this case assignment:", existingEvaluations);
    
    // Create a lookup map for quick checking if an evaluation already exists
    const existingEvaluationsMap = {};
    existingEvaluations.forEach(evaluation => {
      const key = `${evaluation.case_assignment}-${evaluation.model_response}-${evaluation.metric}`;
      existingEvaluationsMap[key] = evaluation.id;
    });
    
    // Track successful submissions
    let successCount = 0;
    let totalToSubmit = 0;
    let errors = [];
    
    // For each evaluation in the store, submit to the API
    for (const key of Object.keys(state.evaluation)) {
      // Only process evaluations for the current record
      if (key !== radId) {
        console.log(`Skipping evaluations for ${key} - not the current record (${radId})`);
        continue;
      }
      
      const evaluations = state.evaluation[key];
      console.log(`Processing evaluations for key ${key}:`, evaluations);
      
      // For each model's evaluations
      for (const modelEval of evaluations) {
        const modelId = modelEval.modelId;
        const modelResponseObject = modelResponses.find((resp: any) => resp.model === modelId);
        const modelResponseId = modelResponseObject?.id;
        
        console.log(`Model ID: ${modelId}, Model Response:`, modelResponseObject);
        
        if (!modelResponseId) {
          console.error(`Model response not found for model ${modelId}`);
          errors.push(`No model response found for model ${modelId}`);
          continue;
        }
        
        // For each metric evaluation
        for (const metricEval of modelEval.metrics) {
          // Skip metrics with score of 0
          if (metricEval.value === 0) {
            console.log(`Skipping metric ${metricEval.id} with score 0`);
            continue;
          }
          
          totalToSubmit++;
          
          // Create evaluation payload - ensure values match expected types
          const evaluationData = {
            case_assignment: caseAssignmentId,
            model_response: modelResponseId,
            metric: metricEval.id,
            score: parseInt(metricEval.value.toString(), 10) // Ensure it's an integer
          };
          
          // Check if this evaluation already exists
          const evaluationKey = `${caseAssignmentId}-${modelResponseId}-${metricEval.id}`;
          const existingEvaluationId = existingEvaluationsMap[evaluationKey];
          
          let url = '/api/evaluations/';
          let method = 'POST';
          
          // If evaluation exists, use PUT to update it instead of creating a new one
          if (existingEvaluationId) {
            url = `/api/evaluations/${existingEvaluationId}/`;
            method = 'PUT';
            console.log(`Updating existing evaluation (ID: ${existingEvaluationId})`, evaluationData);
          } else {
            console.log("Submitting new evaluation payload:", evaluationData);
          }
          
          try {
            // Submit the evaluation directly to the API
            const response = await fetch(url, {
              method: method,
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(evaluationData)
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw { response: { data: errorData } };
            }
            
            const data = await response.json();
            console.log(`Evaluation ${method === 'PUT' ? 'update' : 'submission'} response:`, data);
            successCount++;
          } catch (error) {
            // Log the full error response with details
            const errorData = error.response?.data || error;
            
            // Log detailed error information
            console.error(
              "Error submitting evaluation:", 
              JSON.stringify(errorData, null, 2), 
              "For payload:", 
              JSON.stringify(evaluationData, null, 2)
            );
            
            // Specifically log non_field_errors if present
            if (errorData.non_field_errors) {
              console.error("Non-field errors:", errorData.non_field_errors);
              errors.push(errorData.non_field_errors[0]);
            } else {
              errors.push("Unknown API error");
            }
            
            // Continue with next evaluation rather than stopping everything
            continue;
          }
        }
      }
    }
    
    console.log(`Successfully submitted ${successCount} out of ${totalToSubmit} evaluations`);
    
    // If we had some errors but also some successes, consider it partially successful
    if (successCount > 0 && successCount < totalToSubmit) {
      console.warn("Partial success - some evaluations were submitted successfully");
      return { 
        success: true, 
        partial: true, 
        message: "Some evaluations were submitted successfully, but others failed.",
        errors 
      };
    }
    
    // If everything failed, throw an error
    if (successCount === 0 && totalToSubmit > 0) {
      throw new Error(errors.join(", "));
    }
    
    return { success: true, partial: false };
  } catch (error) {
    // Enhanced error logging
    if (error.response?.data) {
      console.error('Error setting records. Response data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data.non_field_errors) {
        console.error('Non-field errors:', error.response.data.non_field_errors);
      }
    } else {
      console.error('Error setting records:', error);
    }
    
    throw error;
  }
}

// Get all metrics defined in the system
async function getMetrics(): Promise<any[]> {
  try {
    console.log('Calling metrics API endpoint');
    const response = await instance.get('metrics/');
    console.log('Metrics API response:', response.status, response.data);
    
    // Check if response data is valid
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.warn('Metrics API returned empty or invalid data, providing fallback metrics');
      // Provide fallback metrics to ensure UI doesn't get stuck
      return [
        { id: '1', name: 'Accuracy' },
        { id: '2', name: 'Completeness' },
        { id: '3', name: 'Relevance' }
      ];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    // Provide fallback metrics to ensure UI doesn't get stuck
    console.warn('Using fallback metrics due to API error');
    return [
      { id: '1', name: 'Accuracy' },
      { id: '2', name: 'Completeness' },
      { id: '3', name: 'Relevance' }
    ];
  }
}

export { 
  getRecords, 
  setRecords, 
  getEvaluatorCases, 
  testBackendConnection, 
  getAllEvaluators,
  getAllEvaluations,
  getAllCases,
  getUserDetails,
  isSupervisor,
  getMetrics
}
