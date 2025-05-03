import useRecords from '@/hooks/use-records'
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Index from './Index'
import { getUserDetails } from '@/services'

function IndexWrapper() {
  const { radId } = useParams()
  const records = useRecords(radId)
  const [doctorInfo, setDoctorInfo] = useState(null)
  const [loading, setLoading] = useState(true)

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
          setLoading(false)
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
      } finally {
        setLoading(false)
      }
    }
    
    getDoctorInfo()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-medical-darkest-gray text-foreground">
        <p>Loading...</p>
      </div>
    )
  }

  if (!records || records?.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-medical-darkest-gray text-foreground">
        <p>No records found</p>
      </div>
    )
  }

  return (
    <div>
      {doctorInfo && (
        <div className="bg-medical-dark-gray/50 p-3 text-center text-white">
          <p className="text-lg">
            Current Evaluator: <span className="font-bold">{doctorInfo.name}</span>
          </p>
        </div>
      )}
      <Index records={records} />
    </div>
  )
}

export default IndexWrapper
