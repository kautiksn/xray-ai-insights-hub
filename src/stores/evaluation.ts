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
      if (!state.evaluation[idx]) {
        console.error(`Evaluation data for id ${idx} not found`);
        return state;
      }

      const newEvaluation = { ...state.evaluation };
      const modelIndex = newEvaluation[idx].findIndex(
        (model) => model.responseId === payload.responseId
      );

      if (modelIndex === -1) {
        console.error(`Response ${payload.responseId} not found in evaluation`);
        return state;
      }

      const metricIndex = newEvaluation[idx][modelIndex].metrics.findIndex(
        (metric) => metric.id === payload.metricId
      );

      if (metricIndex === -1) {
        console.error(`Metric ${payload.metricId} not found in model ${payload.responseId}`);
        return state;
      }

      newEvaluation[idx][modelIndex].metrics[metricIndex].value = payload.value;

      return {
        evaluation: newEvaluation,
      };
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
