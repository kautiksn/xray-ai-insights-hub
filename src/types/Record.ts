import { Evaluation } from './Evaluation'
import { Metric } from './Metric'
import { Model } from './Model'

export type Report = {
  findings: string
  impressions: string
}

export type Record = {
  id?: string
  imageUrl: string
  modelOutputs: ({
    modelId: string
  } & Report)[]
  groundTruth: Report
  metrics: Metric[]
  models: Model[]
  evaluations: Evaluation[]
}
