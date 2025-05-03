import { Evaluation } from './Evaluation'
import { Metric } from './Metric'
import { Model } from './Model'

export type Report = {
  findings: string
  impressions: string
}

export type Navigation = {
  allCaseIds: string[]
  currentIndex: number
  hasPrevious: boolean
  hasNext: boolean
  previousId: string | null
  nextId: string | null
}

export type Record = {
  id?: string
  imageUrl: string
  modelOutputs: {
    responseId: string
    response: string
  }[]
  groundTruth: Report
  metrics: {
    id: string
    label: string
  }[]
  models: Model[]
  evaluations: {
    responseId: string
    metric: string
    score: number
  }[]
  navigation?: Navigation
}
