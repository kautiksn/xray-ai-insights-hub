import React, { useEffect, useRef, useState } from 'react'
import { ImageViewer } from '@/components/ImageViewer'
import { ReportPanel } from '@/components/ReportPanel'
import { EvaluationMetrics } from '@/components/EvaluationMetrics'
import { addEmptyMetrics, shuffle } from '@/lib/utils'
import { Record } from '@/types'
import useEvalutationStore from '@/stores/evaluation'
import { Button } from '@/components/ui/button'
import { setRecords } from '@/services'

const metrics = [
  { label: 'Hello', id: '12' },
  { label: 'There', id: '21' },
  { label: 'Good', id: '34' },
  { label: 'Day', id: '45' },
]

interface Props {
  records: Record[]
}

const Index = (props: Props) => {
  const { records } = props

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const initId = useEvalutationStore((state) => state.initAtId)
  const doneForId = useEvalutationStore((state) => state.doneForId)
  const setDoneForId = useEvalutationStore((state) => state.setDoneForId)

  const handleImageChange = (newIndex: number) => {
    setCurrentImageIndex(newIndex)
  }

  const activeRecord = records[currentImageIndex]
  const modelReports = shuffle([...activeRecord.modelOutputs])
  const modelScores = addEmptyMetrics(activeRecord.evaluations, metrics).sort(
    (a, b) => {
      const aIndex = modelReports.findIndex((x) => x.modelId === a.modelId)
      const bIndex = modelReports.findIndex((x) => x.modelId === b.modelId)

      return aIndex - bIndex
    }
  )

  if (!doneForId[activeRecord.id]) {
    initId(activeRecord.id, modelScores)
    setDoneForId(activeRecord.id, true)
  }

  console.log({ activeRecord, modelReports, modelScores })

  return (
    <div className="min-h-screen flex flex-col bg-medical-darkest-gray text-foreground">
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <div className="flex gap-4 h-[70vh]">
          <div className="w-2/5">
            <ImageViewer
              currentImage={activeRecord.imageUrl}
              currentIndex={currentImageIndex}
              onChangeImage={handleImageChange}
              totalImages={records.length}
            />
          </div>

          <div className="w-3/5 grid grid-cols-2 grid-rows-2 gap-4">
            <ReportPanel isGroundTruth report={activeRecord.groundTruth} />
            {modelReports.map((report, index) => (
              <ReportPanel
                key={index}
                report={report}
                title={`MODEL ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="">
          <EvaluationMetrics
            activeRecordId={activeRecord.id}
            metrics={metrics}
          />
        </div>

        <div className="flex justify-center flex-col pt-3">
          <p className="text-center text-sm text-gray-600 py-3">
            Note: This submits all records. Please use this once you are done
            with all records.
          </p>
          <Button onClick={setRecords}>Submit</Button>
        </div>
      </div>
    </div>
  )
}

export default Index
