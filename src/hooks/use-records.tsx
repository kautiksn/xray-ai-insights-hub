import { getRecords } from '@/services'
import { Record } from '@/types'
import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

function useRecords(radId: string) {
  const [records, setRecords] = useState<Record[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const runOnceRef = useRef(false)
  const { toast } = useToast()

  useEffect(() => {
    if (runOnceRef.current || !radId) {
      return
    }

    console.log('Fetching records for radId:', radId)
    runOnceRef.current = true
    
    ;(async () => {
      try {
        // Get doctorId from URL
        const urlParams = new URLSearchParams(window.location.search)
        const doctorId = urlParams.get('doctorId')

        if (!doctorId) {
          console.error('No doctorId found in URL')
          toast({
            title: "Error",
            description: "Missing doctor ID in URL",
            variant: "destructive",
          })
          return
        }

        // First try to fetch the specific case
        try {
          const _records = await getRecords(radId)
          console.log('Records fetched successfully:', _records)
          
          if (!_records.data || _records.data.length === 0) {
            throw new Error('No records returned from API')
          }

          // Check if we have all required data
          const record = _records.data[0]
          if (!record.imageUrl) {
            throw new Error('Missing image URL in record')
          }
          if (!record.modelOutputs || record.modelOutputs.length === 0) {
            throw new Error('No model outputs found')
          }
          if (!record.metrics || record.metrics.length === 0) {
            throw new Error('No metrics found')
          }

          setRecords(_records.data)
          return
        } catch (err) {
          console.error('Error fetching specific case:', err)
          throw err
        }
      } catch (err) {
        console.error('Error in records fetch:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load case details",
          variant: "destructive",
        })
      }
    })()
  }, [radId, toast])

  return records
}

export default useRecords
