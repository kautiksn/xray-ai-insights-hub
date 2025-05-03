import { getRecords } from '@/services'
import { Record } from '@/types'
import { useEffect, useRef, useState } from 'react'

function useRecords(radId: string) {
  const [records, setRecords] = useState<Record[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const runOnceRef = useRef(false)

  useEffect(() => {
    if (runOnceRef.current || !radId) {
      return
    }

    console.log('Fetching records for radId:', radId)
    runOnceRef.current = true
    
    ;(async () => {
      try {
        const _records = await getRecords(radId)
        console.log('Records fetched successfully:', _records)
        setRecords(_records.data)
      } catch (err) {
        console.error('Error fetching records:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    })()
  }, [radId])

  // Return both records and error state
  return records
}

export default useRecords
