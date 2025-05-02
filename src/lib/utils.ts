import { Evaluation } from '@/types/Evaluation'
import { Metric } from '@/types/Metric'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fisher–Yates Shuffle
export function shuffle<T>(array: T[]): T[] {
  let m = array.length,
    t,
    i

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--)

    // And swap it with the current element.
    t = array[m]
    array[m] = array[i]
    array[i] = t
  }

  return array
}

export function addEmptyMetrics(
  evaluations: Evaluation[],
  stockMetrics
): Evaluation[] {
  const dummyMetric: Metric & { value: number } = {
    label: '',
    id: '',
    value: 0,
  }

  const newEvaluations = []
  evaluations.forEach((evaluation) => {
    const { metrics, modelId } = evaluation

    const newObj: Evaluation = {
      modelId,
      metrics: [],
    }

    const newMetrics = stockMetrics.map((stockMetric) => {
      const metricIdx = metrics.findIndex((x) => x.id === stockMetric.id)
      const hasMetric = metricIdx !== -1

      if (!hasMetric) {
        return {
          ...stockMetric,
          value: 0,
        }
      }
      return metrics[metricIdx]
    })

    newObj.metrics = newMetrics
    newEvaluations.push(newObj)
  })

  return newEvaluations
}
