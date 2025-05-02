import axios from 'axios'
import { Record } from '../types/Record'
import useEvalutationStore from '@/stores/evaluation'

const instance = axios.create({
  baseURL: 'https://some-domain.com/api/',
  timeout: 1000,
  // headers: { 'X-Custom-Header': 'foobar' },
})

function getRecords(radId: string): Promise<{ data: Record[] }> {
  const URL = 'records/' + radId
  // return instance.get(URL).then((res) => res)
  return new Promise((res, rej) => {
    setTimeout(() => {
      res({
        data: [
          {
            id: 'afjdhksdjf',
            imageUrl: 'some-image',
            modelOutputs: [
              {
                modelId: '1',
                findings: 'hello',
                impressions: 'you too',
              },
              {
                modelId: '2',
                findings: 'hello there',
                impressions: 'you too',
              },
              {
                modelId: '3',
                findings: 'llava',
                impressions: 'you too',
              },
            ],
            groundTruth: {
              findings: 'hello',
              impressions: 'hello too',
            },
            metrics: [
              {
                label: '',
                id: '',
              },
            ],
            models: [
              {
                label: '',
                id: '',
              },
            ],
            evaluations: [
              {
                modelId: '1',
                metrics: [
                  {
                    id: '12',
                    label: 'hello',
                    value: 10,
                  },
                ],
              },
              {
                modelId: '2',
                metrics: [
                  {
                    id: '21',
                    label: 'zanetti',
                    value: 1,
                  },
                ],
              },
              {
                modelId: '3',
                metrics: [
                  {
                    id: '34',
                    label: 'baresi',
                    value: 10,
                  },
                  {
                    id: '45',
                    label: 'frattesi',
                    value: 10,
                  },
                ],
              },
            ],
          },
        ],
        // total: 1,
      })
    }, 1000)
  })
}

function setRecords(radId: string) {
  // const URL = `recrods/${re}`
  const state = useEvalutationStore.getState()
  Object.keys(state.evaluation).forEach((key) => {
    const evaluations = state.evaluation[key]
    const URL = `records/${key}`

    const payload = {
      ...evaluations,
    }

    instance.post(URL, payload)
  })
}

export { getRecords, setRecords }
