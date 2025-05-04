import { Evaluation } from '@/types'
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
      value: number | null
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
      console.log('Store setEvaluation called with:', { idx, payload });
      console.log('Current state:', state.evaluation[idx]);
      
      const newState = { ...state }
      const newEvaluation = { ...newState.evaluation }
      const targetEvaluation = newEvaluation[idx]
      
      // Guard against targetEvaluation being undefined
      if (!targetEvaluation) {
        console.error(`Evaluation data for id ${idx} not found`);
        return state;
      }
      
      const target = targetEvaluation.map(model => ({ ...model }))

      const targetModelIndex = target.findIndex(
        (x) => x.responseId === payload.responseId
      )
      
      // Guard against model not found
      if (targetModelIndex === -1) {
        console.error(`Response ${payload.responseId} not found in evaluation`);
        return state;
      }

      const targetMetricIndex = target[targetModelIndex].metrics.findIndex(
        (x) => x.id === payload.metricId
      )
      
      // Guard against metric not found
      if (targetMetricIndex === -1) {
        console.error(`Metric ${payload.metricId} not found in model ${payload.responseId}`);
        return state;
      }
      
      // Create new metrics array with updated value
      target[targetModelIndex].metrics = target[targetModelIndex].metrics.map(
        (metric, index) => index === targetMetricIndex 
          ? { ...metric, value: payload.value }
          : metric
      )

      newEvaluation[idx] = target
      
      console.log('Updated state:', newEvaluation[idx]);
      
      return {
        ...newState,
        evaluation: newEvaluation
      }
    }),
  init: (initData) =>
    set(() => ({
      evaluation: initData,
      doneForId: {}
    })),
  initAtId: (idx, payload) =>
    set((state) => {
      console.log(`Initializing evaluations for ${idx} with:`, payload);
      return {
        ...state,
        evaluation: {
          ...state.evaluation,
          [idx]: payload.map(model => ({
            ...model,
            metrics: model.metrics.map(metric => ({ ...metric }))
          }))
        }
      }
    }),
  doneForId: {},
  setDoneForId: (idx, status) =>
    set((state) => ({
      ...state,
      doneForId: {
        ...state.doneForId,
        [idx]: status
      }
    })),
  resetDoneStatus: () =>
    set((state) => ({
      ...state,
      doneForId: {}
    }))
}))

export default useEvalutationStore
