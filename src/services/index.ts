import axios from 'axios'
import { Record } from '../types/Record'
import useEvalutationStore from '@/stores/evaluation'

const instance = axios.create({
  baseURL: '/api/', // Use the proxied URL instead of direct backend URL
  timeout: 30000, // Increased timeout to 30 seconds
  // headers: { 'X-Custom-Header': 'foobar' },
})

// Cache for metrics and models data
let metricsCache = null;
let modelsCache = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let lastMetricsFetch = 0;
let lastModelsFetch = 0;

// Function to get metrics with caching
async function getCachedMetrics() {
  const now = Date.now();
  if (metricsCache && (now - lastMetricsFetch) < CACHE_DURATION) {
    console.log('Using cached metrics data');
    return metricsCache;
  }

  console.log('Fetching fresh metrics data');
  const response = await instance.get('metrics/');
  metricsCache = response.data;
  lastMetricsFetch = now;
  return metricsCache;
}

// Function to get models with caching
async function getCachedModels() {
  const now = Date.now();
  if (modelsCache && (now - lastModelsFetch) < CACHE_DURATION) {
    console.log('Using cached models data');
    return modelsCache;
  }

  console.log('Fetching fresh models data');
  const response = await instance.get('models/');
  modelsCache = response.data;
  lastModelsFetch = now;
  return modelsCache;
}

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

// Types for evaluator cases response
interface CaseWithDetails {
  id: string;
  image_id: string;
  image_url: string;
  status: string;
  completed_evaluations: number;
  total_evaluations: number;
  last_updated: string;
}

interface CasesResponse {
  cases: CaseWithDetails[];
  total_cases: number;
  pending_cases: number;
  in_progress_cases: number;
  completed_cases: number;
}

// New optimized function to get all cases assigned to a specific evaluator with full details
async function getEvaluatorCasesWithDetails(evaluatorId: string): Promise<CasesResponse> {
  try {
    console.time('fetchEvaluatorCases');
    // Get cases assigned to this evaluator with all related data
    const response = await instance.get(`users/${evaluatorId}/cases_with_details/`);
    console.timeEnd('fetchEvaluatorCases');
    
    console.log('Evaluator cases data:', response.data);

    // Transform the response to match our interface if needed
    const casesData = response.data;
    
    // If the response is already in the correct format, return it directly
    if (casesData.cases && Array.isArray(casesData.cases)) {
      return casesData as CasesResponse;
    }

    // If we need to transform the data
    return {
      cases: (casesData.cases || []).map((caseItem: any) => ({
        id: caseItem.id,
        image_id: caseItem.image_id,
        image_url: caseItem.image_url,
        status: caseItem.status || 'pending',
        completed_evaluations: caseItem.completed_evaluations || 0,
        total_evaluations: caseItem.total_evaluations || 0,
        last_updated: caseItem.updated_at || caseItem.created_at
      })),
      total_cases: casesData.total_cases || 0,
      pending_cases: casesData.pending_cases || 0,
      in_progress_cases: casesData.in_progress_cases || 0,
      completed_cases: casesData.completed_cases || 0
    };
  } catch (error) {
    console.error('Error fetching evaluator cases:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      if (error.response.status === 504) {
        throw new Error('Request timeout - the server took too long to respond. Please try again.');
      }
    }
    throw error;
  }
}

async function getRecords(id: string): Promise<{ data: Record[] }> {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('doctorId');
    const isCaseId = !doctorId || id !== doctorId;

    console.log('Fetching records:', isCaseId ? `case ${id}` : `doctor ${id}`);
    
    if (isCaseId) {
      console.time('fetchData');
      // Use a single optimized endpoint that returns all necessary data
      const response = await instance.get(`cases/${id}/full_details/`, {
        params: {
          evaluator_id: doctorId // Pass the evaluator ID to get relevant assignments
        }
      });
      console.timeEnd('fetchData');

      const data = response.data;
      console.log('Full case data fetched:', data);

      if (!data || !data.case || !data.case.image_url) {
        console.error('Invalid case data structure:', data);
        throw new Error('Invalid case data structure received from server');
      }

      // Parse ground truth from JSON string
      let groundTruth = { findings: '', impressions: '' };
      try {
        if (data.case.ground_truth) {
          const parsedGroundTruth = JSON.parse(data.case.ground_truth);
          groundTruth = {
            findings: parsedGroundTruth.findings || '',
            impressions: parsedGroundTruth.impression || ''
          };
        }
      } catch (err) {
        console.error('Error parsing ground truth:', err);
      }

      // Transform the case into a Record
      const recordData: Record = {
        id: data.case.id,
        imageUrl: data.case.image_url,
        modelOutputs: (data.model_responses || []).map((response: any) => ({
          responseId: response.id,
          response: response.response_text || response.response || '' // Handle both response_text and response fields
        })),
        metrics: (data.metrics || []).map((metric: any) => ({
          id: metric.id,
          label: metric.name,
        })),
        evaluations: (data.model_responses || []).map((response: any) => ({
          responseId: response.id,
          metric: response.metric || '',
          score: response.score || 0,
        })),
        groundTruth,
        models: []
      };

      console.log('Transformed record data:', recordData);
      return { data: [recordData] };
    } else {
      // Get cases assigned to this evaluator
      const casesResponse = await instance.get(`users/${id}/cases/`);
      const casesData = casesResponse.data;
      console.log('Cases data fetched:', casesData.length, 'cases');
      
      // Transform the cases into Records
      const records: Record[] = casesData.map((caseItem: any) => {
        // Parse the ground truth JSON if it exists
        let groundTruth = { findings: '', impressions: '' };
        try {
          if (caseItem.ground_truth) {
            const parsedGroundTruth = JSON.parse(caseItem.ground_truth);
            groundTruth = {
              findings: parsedGroundTruth.findings || '',
              impressions: parsedGroundTruth.impression || ''
            };
          }
        } catch (err) {
          console.error('Error parsing ground truth:', err);
        }
        
        // Create the record object with safe fallbacks
        const recordData: Record = {
          id: caseItem.id,
          imageUrl: caseItem.image_url,
          modelOutputs: (caseItem.model_responses || []).map((response: any) => ({
            responseId: response.id,
            response: response.response_text || response.response || '' // Handle both response_text and response fields
          })),
          metrics: (caseItem.metrics || []).map((metric: any) => ({
            id: metric.id,
            label: metric.name,
          })),
          evaluations: (caseItem.model_responses || []).map((response: any) => ({
            responseId: response.id,
            metric: response.metric || '',
            score: response.score || 0,
          })),
          groundTruth,
          models: []
        };
        
        return recordData;
      });
      
      return { data: records };
    }
  } catch (error) {
    console.error('Error fetching records:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      if (error.response.status === 504) {
        throw new Error('Request timeout - the server took too long to respond. Please try again.');
      }
    }
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
        const modelId = modelEval.responseId;
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
  getEvaluatorCasesWithDetails,
  testBackendConnection, 
  getAllEvaluators,
  getAllEvaluations,
  getAllCases,
  getUserDetails,
  isSupervisor,
  getMetrics
}
