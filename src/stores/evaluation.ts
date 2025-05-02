import { Evaluation } from '@/types/Evaluation'
import { create } from 'zustand'

type LocalEvaluation = {
  [idx: string]: Evaluation[]
}

type EvaluationStore = {
  evaluation: LocalEvaluation
  setEvaluation: (
    idx: string,
    payload: {
      modelId: string
      metricId: string
      value: number
    }
  ) => void
  init: (payload: LocalEvaluation) => void
  initAtId: (idx: string, payload: Evaluation[]) => void
  doneForId: {
    [idx: string]: boolean
  }
  setDoneForId: (idx: string, status: boolean) => void
}

const useEvalutationStore = create<EvaluationStore>()((set) => ({
  evaluation: {},
  setEvaluation: (idx, payload) =>
    set((state) => {
      // return {
      //   ...state,
      // }
      const newState = { ...state }
      const newEvaluation = { ...newState.evaluation }
      const targetEvaluation = newEvaluation[idx]
      const target = [...targetEvaluation]

      const targetModelIndex = target.findIndex(
        (x) => x.modelId === payload.modelId
      )
      const targetModel = { ...target[targetModelIndex] }

      const targetMetricIndex = targetModel.metrics.findIndex(
        (x) => x.id === payload.metricId
      )
      const newMetrics = [...targetModel.metrics]
      const targetMetric = newMetrics[targetMetricIndex]

      newMetrics[targetMetricIndex] = {
        ...targetMetric,
        value: payload.value,
      }

      targetModel.metrics = [...newMetrics]
      target[targetModelIndex] = { ...targetModel }
      newEvaluation[idx] = [...target]

      return {
        ...newState,
        evaluation: { ...newEvaluation },
      }
    }),
  init: (initData) =>
    set((state) => ({
      evaluation: initData,
      ...state,
    })),
  initAtId: (idx, payload) =>
    set((state) => {
      const newState = { ...state }
      newState.evaluation[idx] = [...payload]
      return newState
    }),
  doneForId: {},
  setDoneForId: (idx, status) =>
    set((state) => {
      const newState = { ...state }
      newState.doneForId[idx] = status
      return newState
    }),
}))

export default useEvalutationStore
