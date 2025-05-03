export type EvaluationMetric = {
  id: string
  label: string
  value: number
}

export type Evaluation = {
  responseId: string
  metrics: EvaluationMetric[]
}
