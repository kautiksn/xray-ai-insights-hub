import useRecords from '@/hooks/use-records'
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Index from './Index'
import { getUserDetails } from '@/services'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

function IndexWrapper() {
  const { radId } = useParams()
  const records = useRecords(radId)
  const [doctorInfo, setDoctorInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Extract doctor ID from URL
  // URL format is typically /rad/:radId?doctorId=xxx
  useEffect(() => {
    const getDoctorInfo = async () => {
      try {
        // Get doctor ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const doctorId = urlParams.get('doctorId')
        
        // If no doctorId in URL, try to get from local storage or just show generic message
        if (!doctorId) {
          console.log('No doctorId found in URL')
          setDoctorInfo({ name: 'Anonymous Evaluator' })
          return
        }
        
        // Fetch doctor details
        console.log('Fetching doctor details for:', doctorId);
        const details = await getUserDetails(doctorId)
        console.log('Doctor details:', details)
        
        if (details && details.name) {
          setDoctorInfo(details)
        } else {
          // If API returns empty data or missing name
          setDoctorInfo({ 
            name: `Doctor ${doctorId.substring(0, 8)}`,
            role: 'Evaluator'
          });
          console.warn('API returned incomplete doctor info:', details);
        }
      } catch (error) {
        console.error('Error fetching doctor info:', error)
        // Use a partial doctor ID as fallback for name
        const urlParams = new URLSearchParams(window.location.search)
        const doctorId = urlParams.get('doctorId')
        setDoctorInfo({ 
          name: doctorId ? `Doctor ${doctorId.substring(0, 8)}` : 'Unknown Evaluator',
          role: 'Evaluator' 
        });
        setError('Error loading doctor information')
      } finally {
        setLoading(false)
      }
    }
    
    getDoctorInfo()
  }, [])

  // Show loading state while fetching records or doctor info
  if (loading || !records) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-medical-darkest-gray text-foreground">
        <div className="animate-pulse">
          <p className="text-lg">Loading case details...</p>
        </div>
      </div>
    )
  }

  // Show error state if no records found
  if (records?.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-medical-darkest-gray text-foreground">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No case details found. This could be because:
            <ul className="list-disc list-inside mt-2">
              <li>The case ID is invalid</li>
              <li>You don't have permission to view this case</li>
              <li>The case has been removed</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* {doctorInfo && (
        <div className="bg-medical-dark-gray/50 p-3 text-center text-white">
          <p className="text-lg">
            Current Evaluator: <span className="font-bold">{doctorInfo.name}</span>
          </p>
        </div>
      )} */}
      <Index records={records} />
    </div>
  )
}

export default IndexWrapper
