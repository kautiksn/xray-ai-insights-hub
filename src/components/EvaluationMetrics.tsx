import React from 'react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useEvalutationStore from '@/stores/evaluation'

export interface ModelScore {
  modelId: string
  metrics: {
    id: string
    label: string
    value: number
  }[]
}

interface EvaluationMetricsProps {
  metrics: { id: string; label: string }[]
  // modelScores: ModelScore[]
  activeRecordId: string
}

export const EvaluationMetrics: React.FC<EvaluationMetricsProps> = ({
  activeRecordId,
  metrics,
  // modelScores,
}) => {
  const evaluation = useEvalutationStore((state) => state.evaluation)
  const setEvaluation = useEvalutationStore((state) => state.setEvaluation)

  const activeEvaluation = evaluation[activeRecordId]

  console.log({ activeEvaluation })

  // Function to get background color based on score
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-medical-dark-gray'

    // Calculate the color using a gradient
    const red = Math.round(255 * (1 - score / 10))
    const green = Math.round(255 * (score / 10))

    return `bg-[rgb(${red},${green},0)]`
  }

  return (
    <div className="rounded-lg border border-medical-dark-gray/30 overflow-hidden">
      <div className="bg-medical-dark-gray/50 p-3 border-b border-medical-dark-gray/30">
        <h2 className="text-lg font-medium">EVALUATION METRICS</h2>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-medical-dark-gray/30 border-b border-medical-dark-gray/30">
              <th className="p-3 text-left w-24">MODEL</th>
              {metrics.map((metric) => (
                <th key={metric.id} className="p-3 text-center">
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {activeEvaluation.map((model, idx) => (
              <tr
                key={model.modelId}
                className="border-b border-medical-dark-gray/20"
              >
                <td className="p-3 font-medium text-left">{`Model ${
                  idx + 1
                }`}</td>

                {metrics.map((metric) => {
                  const score = model.metrics.find(
                    (x) => x.id === metric.id
                  )?.value

                  return (
                    <td
                      key={`${model.modelId}-${metric.id}`}
                      className="p-3 text-center"
                    >
                      <select
                        defaultValue={score}
                        name="metrics"
                        id="rate-model-output"
                        onChange={(e) => {
                          setEvaluation(activeRecordId, {
                            metricId: metric.id,
                            modelId: model.modelId,
                            value: Number(e.target.value),
                          })
                        }}
                      >
                        <option value="0">--</option>
                        {[...Array(10)].map((_, i) => {
                          return (
                            <option key={i} value={i + 1}>
                              {i + 1}
                            </option>
                          )
                        })}
                      </select>
                      {/* <Select
                        value={score?.toString()}
                        onValueChange={(value) =>
                          // onUpdateScore(
                          //   model.modelId,
                          //   metric.id,
                          //   parseInt(value)
                          // )
                          setEvaluation(activeRecordId, {
                            metricId: metric.id,
                            modelId: model.modelId,
                            value: Number(value),
                          })
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            'mx-auto transition-colors',
                            score !== null && 'text-white',
                            getScoreColor(score)
                          )}
                        >
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(10)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select> */}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
