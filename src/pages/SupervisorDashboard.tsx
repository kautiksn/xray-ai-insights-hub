import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  getAllEvaluators, 
  getAllEvaluations, 
  getAllCases, 
  getMetrics,
  getEvaluatorCases
} from '@/services'
import { Loader2 } from 'lucide-react'

// Type definitions for better type safety
interface Evaluator {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Evaluation {
  id: string;
  case_id: string;
  evaluator_id: string;
  model_id: string;
  model_name: string;
  metric_id: string;
  score: number;
  created_at: string;
}

interface Case {
  id: string;
  image_id: string;
}

interface Metric {
  id: string;
  name: string;
  description?: string;
}

function SupervisorDashboard() {
  const { supervisorId } = useParams()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('evaluators')
  const [evaluators, setEvaluators] = useState<Evaluator[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [evaluatorCases, setEvaluatorCases] = useState<any[]>([])
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [selectedEvaluator, setSelectedEvaluator] = useState<string | null>(null)
  const [loading, setLoading] = useState({
    evaluators: true,
    evaluations: true,
    cases: true,
    metrics: true,
    evaluatorCases: false
  })
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch cases first to have case data available
        setLoading(prev => ({ ...prev, cases: true }))
        const casesData = await getAllCases()
        console.log("Fetched cases:", casesData)
        setCases(casesData)
        setLoading(prev => ({ ...prev, cases: false }))
        
        // Fetch case assignments to get the relationship between cases and evaluators
        const caseAssignmentsResponse = await fetch('/api/case-assignments/');
        const caseAssignments = await caseAssignmentsResponse.json();
        console.log("Fetched case assignments:", caseAssignments);
        
        // Create a map of assignment IDs to case IDs for quick lookup
        const assignmentToCaseMap = {};
        caseAssignments.forEach(assignment => {
          assignmentToCaseMap[assignment.id] = assignment.case;
        });
        console.log("Assignment to case map:", assignmentToCaseMap);
        
        // Fetch evaluators
        setLoading(prev => ({ ...prev, evaluators: true }))
        const evaluatorsData = await getAllEvaluators()
        console.log("Fetched evaluators:", evaluatorsData)
        setEvaluators(evaluatorsData)
        setLoading(prev => ({ ...prev, evaluators: false }))
        
        // Fetch all evaluations
        setLoading(prev => ({ ...prev, evaluations: true }))
        const evaluationsData = await getAllEvaluations()
        console.log("Fetched evaluations:", evaluationsData)
        
        // Get model data for populating model names
        const modelsResponse = await fetch('/api/models/');
        const models = await modelsResponse.json();
        console.log("Fetched models:", models);
        
        // Create a map of model IDs to model names for quick lookup
        const modelMap = {};
        models.forEach(model => {
          modelMap[model.id] = model.name;
        });
        
        // Get model responses data to link model_response IDs to model IDs
        // Since there's no direct API, we'll try to get this from case details
        const modelResponseMap = {};
        for (const caseItem of casesData) {
          try {
            const caseDetailsResponse = await fetch(`/api/cases/${caseItem.id}/details/`);
            const caseDetails = await caseDetailsResponse.json();
            
            if (caseDetails && caseDetails.model_responses) {
              caseDetails.model_responses.forEach(response => {
                modelResponseMap[response.id] = {
                  model: response.model,
                  modelName: modelMap[response.model] || 'Unknown Model'
                };
              });
            }
          } catch (err) {
            console.error(`Error fetching details for case ${caseItem.id}:`, err);
          }
        }
        
        console.log("Model response map:", modelResponseMap);
        
        // Fetch metrics
        setLoading(prev => ({ ...prev, metrics: true }))
        const metricsData = await getMetrics()
        console.log("Fetched metrics:", metricsData)
        setMetrics(metricsData)
        setLoading(prev => ({ ...prev, metrics: false }))
        
        // Map evaluation fields correctly based on actual backend structure
        const mappedEvaluations = evaluationsData.map(evaluation => {
          // Get the case ID from the case assignment
          const caseId = assignmentToCaseMap[evaluation.case_assignment] || "unknown-case";
          
          // Get evaluator ID from case assignment
          const evaluatorId = caseAssignments.find(ca => ca.id === evaluation.case_assignment)?.evaluator || "unknown-evaluator";
          
          // Get model data from model response
          const modelInfo = modelResponseMap[evaluation.model_response] || { model: "unknown-model", modelName: "Unknown Model" };
          
          return {
            id: evaluation.id || `temp-${Math.random()}`,
            case_id: caseId,
            evaluator_id: evaluatorId,
            model_id: modelInfo.model,
            model_name: modelInfo.modelName,
            metric_id: evaluation.metric || "unknown-metric",
            score: evaluation.score || 0,
            created_at: evaluation.created_at || new Date().toISOString()
          };
        });
        
        console.log("Mapped evaluations:", mappedEvaluations)
        setEvaluations(mappedEvaluations)
        setLoading(prev => ({ ...prev, evaluations: false }))
      } catch (err) {
        console.error('Error fetching supervisor data:', err)
        setError('Failed to load data. Please check your connection and try again.')
        setLoading({
          evaluators: false,
          evaluations: false,
          cases: false,
          metrics: false,
          evaluatorCases: false
        })
      }
    }
    
    fetchData()
  }, [])
  
  // Fetch evaluator-specific cases when an evaluator is selected
  useEffect(() => {
    if (selectedEvaluator) {
      async function fetchEvaluatorCases() {
        try {
          setLoading(prev => ({ ...prev, evaluatorCases: true }))
          const casesData = await getEvaluatorCases(selectedEvaluator)
          setEvaluatorCases(casesData)
          setLoading(prev => ({ ...prev, evaluatorCases: false }))
        } catch (err) {
          console.error('Error fetching evaluator cases:', err)
          setLoading(prev => ({ ...prev, evaluatorCases: false }))
          setError('Failed to load evaluator cases.')
        }
      }
      
      fetchEvaluatorCases()
    }
  }, [selectedEvaluator])
  
  // Filter evaluations by selected evaluator
  const filteredEvaluations = selectedEvaluator
    ? evaluations.filter(evaluation => evaluation.evaluator_id === selectedEvaluator)
    : evaluations
  
  // Group evaluations by case
  const evaluationsByCase: Record<string, Evaluation[]> = filteredEvaluations.reduce((acc, evaluation) => {
    const caseId = evaluation.case_id
    if (!acc[caseId]) {
      acc[caseId] = []
    }
    acc[caseId].push(evaluation)
    return acc
  }, {} as Record<string, Evaluation[]>)
  
  // Add a utility method to load case details if needed
  const fetchCaseDetailIfNeeded = async (caseId: string) => {
    // Only fetch if we need to (case not found in our list)
    if (cases.find(c => c.id === caseId)) {
      return;
    }
    
    try {
      console.log(`Fetching details for case ${caseId}`);
      const caseResponse = await fetch(`/api/cases/${caseId}/`);
      
      if (!caseResponse.ok) {
        console.warn(`Failed to fetch case ${caseId}: ${caseResponse.status}`);
        return;
      }
      
      const caseData = await caseResponse.json();
      console.log(`Got case data:`, caseData);
      
      // Add this case to our list
      setCases(prevCases => [...prevCases, caseData]);
    } catch (error) {
      console.error(`Error fetching case ${caseId}:`, error);
    }
  };

  // Get case details by ID
  const getCaseDetails = (caseId: string): Case => {
    const foundCase = cases.find(c => c.id === caseId);
    if (foundCase) {
      return foundCase;
    }
    
    console.warn(`Case not found for ID: ${caseId}`);
    
    // Try to fetch the missing case data (won't update immediately but will be available for next render)
    fetchCaseDetailIfNeeded(caseId);
    
    return { id: caseId, image_id: `Case ${caseId.slice(0, 8)}` };
  }
  
  // Get evaluator name by ID
  const getEvaluatorName = (evaluatorId: string): string => {
    const evaluator = evaluators.find(e => e.id === evaluatorId);
    if (evaluator) {
      return evaluator.name;
    }
    
    console.warn(`Evaluator not found for ID: ${evaluatorId}`);
    return `Evaluator ${evaluatorId.slice(0, 8)}`;
  }

  // Get metric name by ID
  const getMetricName = (metricId: string): string => {
    const metric = metrics.find(m => m.id === metricId);
    if (metric) {
      return metric.name;
    }
    
    console.warn(`Metric not found for ID: ${metricId}`);
    return `Metric ${metricId.slice(0, 8)}`;
  }

  // Get color based on score value
  const getScoreColor = (score: number): string => {
    if (score >= 8) return "text-green-500 font-bold"
    if (score >= 5) return "text-yellow-500 font-bold"
    return "text-red-500 font-bold"
  }

  // Format date string safely
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Invalid Date';
    
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.warn(`Error formatting date: ${dateString}`, error);
      return 'Invalid Date';
    }
  }

  function goBack() {
    navigate('/supervisor')
  }

  const handleSelectEvaluator = (evaluatorId: string) => {
    setSelectedEvaluator(evaluatorId)
    setActiveTab('evaluations')
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Supervisor Dashboard</CardTitle>
              <CardDescription>Review evaluator performance and case evaluations</CardDescription>
            </div>
            <Button variant="outline" onClick={goBack}>Back to Login</Button>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="evaluators">Evaluators</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="evaluators">
          <Card>
            <CardHeader>
              <CardTitle>Evaluators</CardTitle>
              <CardDescription>All doctors who can evaluate cases</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.evaluators ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">No evaluators found</TableCell>
                      </TableRow>
                    ) : (
                      evaluators.map(evaluator => (
                        <TableRow key={evaluator.id}>
                          <TableCell>{evaluator.name}</TableCell>
                          <TableCell>{evaluator.email}</TableCell>
                          <TableCell>{evaluator.role}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSelectEvaluator(evaluator.id)}
                            >
                              View Evaluations
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="evaluations">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Evaluations {selectedEvaluator && `for ${getEvaluatorName(selectedEvaluator)}`}</CardTitle>
                  <CardDescription>Review all evaluation metrics and scores</CardDescription>
                </div>
                {selectedEvaluator && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedEvaluator(null)}
                  >
                    Show All Evaluations
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading.evaluations || loading.metrics || loading.evaluatorCases ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : selectedEvaluator ? (
                // Display evaluations grouped by case for the selected evaluator
                <div className="space-y-6">
                  {Object.keys(evaluationsByCase).length === 0 ? (
                    <div className="text-center py-6">
                      No evaluations found for this evaluator
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {Object.entries(evaluationsByCase).map(([caseId, caseEvaluations]) => {
                        const caseDetails = getCaseDetails(caseId);
                        // Group evaluations by model
                        const modelGroups = caseEvaluations.reduce((acc, evaluation) => {
                          const modelId = evaluation.model_id;
                          if (!acc[modelId]) {
                            acc[modelId] = [];
                          }
                          acc[modelId].push(evaluation);
                          return acc;
                        }, {} as Record<string, Evaluation[]>);
                        
                        return (
                          <AccordionItem key={caseId} value={caseId}>
                            <AccordionTrigger className="hover:bg-gray-50 px-4 rounded">
                              <div className="flex items-center justify-between w-full">
                                <span>Case: {caseDetails.image_id}</span>
                                <span className="text-sm text-gray-500">
                                  {caseEvaluations.length} evaluations
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pt-2 pb-4 px-4">
                                {Object.entries(modelGroups).map(([modelId, modelEvals]) => {
                                  const modelName = modelEvals[0]?.model_name || 'Unknown Model';
                                  
                                  return (
                                    <div key={modelId} className="mb-6 border rounded-lg p-4">
                                      <h4 className="font-medium text-lg mb-3">
                                        Model: {modelName}
                                      </h4>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Metric</TableHead>
                                            <TableHead>Score</TableHead>
                                            <TableHead>Date</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {modelEvals.map(evaluation => (
                                            <TableRow key={evaluation.id}>
                                              <TableCell>{getMetricName(evaluation.metric_id)}</TableCell>
                                              <TableCell className={getScoreColor(evaluation.score)}>
                                                {evaluation.score}
                                              </TableCell>
                                              <TableCell>
                                                {formatDate(evaluation.created_at)}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </div>
              ) : (
                // Display all evaluations when no evaluator is selected
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Evaluator</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvaluations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No evaluations found</TableCell>
                      </TableRow>
                    ) : (
                      filteredEvaluations.map(evaluation => {
                        const caseDetails = getCaseDetails(evaluation.case_id);
                        return (
                          <TableRow key={evaluation.id}>
                            <TableCell>{caseDetails.image_id}</TableCell>
                            <TableCell>{getEvaluatorName(evaluation.evaluator_id)}</TableCell>
                            <TableCell>{evaluation.model_name || 'Unknown'}</TableCell>
                            <TableCell>{getMetricName(evaluation.metric_id)}</TableCell>
                            <TableCell className={getScoreColor(evaluation.score)}>
                              {evaluation.score}
                            </TableCell>
                            <TableCell>{formatDate(evaluation.created_at)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
              <CardDescription>All evaluation metrics used in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.metrics ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">No metrics found</TableCell>
                      </TableRow>
                    ) : (
                      metrics.map(metric => (
                        <TableRow key={metric.id}>
                          <TableCell>{metric.id}</TableCell>
                          <TableCell>{metric.name}</TableCell>
                          <TableCell>{metric.description || 'No description available'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Card className="mt-6 border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SupervisorDashboard 