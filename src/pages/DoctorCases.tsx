import { getEvaluatorCasesWithDetails, getUserDetails } from '@/services'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, User, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface CaseWithDetails {
  id: string
  image_id: string
  image_url: string
  status: string
  completed_evaluations: number
  total_evaluations: number
  last_updated: string
}

interface CasesResponse {
  cases: CaseWithDetails[]
  total_cases: number
  pending_cases: number
  in_progress_cases: number
  completed_cases: number
}

function DoctorCases() {
  const { doctorId } = useParams()
  const [casesData, setCasesData] = useState<CasesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [doctorInfo, setDoctorInfo] = useState({ name: 'Loading...', specialty: '' })
  const navigate = useNavigate()
  
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!doctorId) return
      
      setLoading(true)
      setError('')
      
      try {
        // Fetch doctor details and cases concurrently
        const [details, casesResponse] = await Promise.all([
          getUserDetails(doctorId),
          getEvaluatorCasesWithDetails(doctorId)
        ]);

        if (!isMounted) return;

        console.log('Doctor details:', details);
        console.log('Cases data:', casesResponse);
        
        // Set doctor info
        if (details && details.name) {
          setDoctorInfo({
            name: details.name,
            specialty: details.role || ''
          });
        } else {
          setDoctorInfo({ 
            name: `Doctor ${doctorId.substring(0, 8)}`,
            specialty: 'Evaluator'
          });
        }

        // Set cases data
        setCasesData(casesResponse);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (!isMounted) return;
        setError('Failed to fetch data. Please check your connection and try again.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [doctorId]);

  function navigateToCase(caseId: string) {
    navigate(`/rad/${caseId}?doctorId=${doctorId}`);
  }

  function goBack() {
    navigate('/');
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{doctorInfo.name}</CardTitle>
              <CardDescription>{doctorInfo.specialty}</CardDescription>
            </div>
            <Button variant="outline" onClick={goBack}>Back to Login</Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Cases</CardTitle>
          <CardDescription>
            {casesData?.total_cases || 0} total cases ({casesData?.completed_cases || 0} completed, {casesData?.in_progress_cases || 0} in progress, {casesData?.pending_cases || 0} pending)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {(!casesData?.cases || casesData.cases.length === 0) && !error && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No cases are currently assigned to you.</p>
            </div>
          )}
          
          {casesData?.cases && casesData.cases.length > 0 && (
            <div className="space-y-4">
              {casesData.cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => navigateToCase(caseItem.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Case ID: {caseItem.image_id}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Progress: {caseItem.completed_evaluations} of {caseItem.total_evaluations} evaluations completed
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      caseItem.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : caseItem.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {caseItem.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DoctorCases 