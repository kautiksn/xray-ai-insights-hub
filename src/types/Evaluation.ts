export type EvaluationMetric = {
  id: string
  label: string
  value: number
}

export type Evaluation = {
  modelId: string
  metrics: EvaluationMetric[]
}
