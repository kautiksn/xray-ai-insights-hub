import { getRecords } from '@/services'
import { Record } from '@/types'
import { useEffect, useRef, useState } from 'react'

function useRecords(radId: string) {
  const [records, setRecords] = useState<Record[] | null>(null)
  const runOnceRef = useRef(false)

  useEffect(() => {
    if (runOnceRef.current || !radId) {
      return
    }

    runOnceRef.current = true
    ;(async () => {
      const _records = await getRecords(radId)
      setRecords(_records.data)
    })()
  }, [radId])

  return records
}

export default useRecords
