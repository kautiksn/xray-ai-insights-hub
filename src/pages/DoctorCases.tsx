import { getEvaluatorCases, getUserDetails } from '@/services'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, User } from 'lucide-react'

function DoctorCases() {
  const { doctorId } = useParams()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [doctorInfo, setDoctorInfo] = useState({ name: 'Loading...', specialty: '' })
  const navigate = useNavigate()
  
  useEffect(() => {
    async function fetchDoctorDetails() {
      if (!doctorId) return;
      
      try {
        console.log('Fetching doctor details for:', doctorId);
        const details = await getUserDetails(doctorId);
        console.log('Doctor details:', details);
        
        setDoctorInfo({
          name: details.name || `Doctor ${doctorId.substring(0, 8)}`,
          specialty: details.role || ''
        });
      } catch (err) {
        console.error('Error fetching doctor details:', err);
        setDoctorInfo({ 
          name: `Doctor ${doctorId.substring(0, 8)}`, 
          specialty: 'Unknown' 
        });
      }
    }
    
    fetchDoctorDetails();
  }, [doctorId]);

  useEffect(() => {
    async function fetchCases() {
      if (!doctorId) return
      
      setLoading(true)
      setError('')
      
      try {
        console.log('Fetching cases for doctor:', doctorId)
        // Use the exact UUID that was provided by the user example
        const assignedCases = await getEvaluatorCases(doctorId)
        console.log('Cases fetched:', assignedCases)
        setCases(assignedCases)
      } catch (err) {
        console.error('Error fetching cases:', err)
        setError('Failed to fetch assigned cases. Please check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCases()
  }, [doctorId])

  function navigateToCase(caseId) {
    navigate(`/rad/${caseId}?doctorId=${doctorId}`)
  }

  function goBack() {
    navigate('/')
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
        </CardHeader>
        <CardContent>
          {loading && <p className="text-center py-4">Loading cases...</p>}
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!loading && cases.length === 0 && !error && (
            <p className="text-center py-4">No cases assigned to this doctor.</p>
          )}
          
          {cases.length > 0 && (
            <div className="space-y-2">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="p-4 border rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => navigateToCase(caseItem.id)}
                >
                  <div className="font-medium">Case ID: {caseItem.image_id}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Click to view and evaluate this case
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DoctorCases 