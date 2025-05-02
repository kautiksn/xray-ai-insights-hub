import useRecords from '@/hooks/use-records'
import { useParams } from 'react-router-dom'
import Index from './Index'

function IndexWrapper() {
  const { radId } = useParams()
  const records = useRecords(radId)

  if (!records || records?.length === 0) {
    return <></>
  }

  return <Index records={records} />
}

export default IndexWrapper
