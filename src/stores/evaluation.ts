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
      responseId: string
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
  resetDoneStatus: () => void
}

// Create store without persistence - no localStorage
const useEvalutationStore = create<EvaluationStore>()((set) => ({
  evaluation: {},
  setEvaluation: (idx, payload) =>
    set((state) => {
      const newState = { ...state }
      const newEvaluation = { ...newState.evaluation }
      const targetEvaluation = newEvaluation[idx]
      
      // Guard against targetEvaluation being undefined
      if (!targetEvaluation) {
        console.error(`Evaluation data for id ${idx} not found`);
        return state;
      }
      
      const target = [...targetEvaluation]

      const targetModelIndex = target.findIndex(
        (x) => x.responseId === payload.responseId
      )
      
      // Guard against model not found
      if (targetModelIndex === -1) {
        console.error(`Response ${payload.responseId} not found in evaluation`);
        return state;
      }
      
      const targetModel = { ...target[targetModelIndex] }

      const targetMetricIndex = targetModel.metrics.findIndex(
        (x) => x.id === payload.metricId
      )
      
      // Guard against metric not found
      if (targetMetricIndex === -1) {
        console.error(`Metric ${payload.metricId} not found in model ${payload.responseId}`);
        return state;
      }
      
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
      console.log(`Initializing evaluations for ${idx} with:`, payload);
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
  resetDoneStatus: () =>
    set((state) => ({
      ...state,
      doneForId: {}
    }))
}))

export default useEvalutationStore
