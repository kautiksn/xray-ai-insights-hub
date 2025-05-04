export interface Navigation {
  hasPrevious: boolean;
  hasNext: boolean;
  previousId: string | null;
  nextId: string | null;
}

export interface Metric {
  id: string;
  name: string;
  description?: string;
}

export interface EvaluationMetric {
  id: string;
  name: string;
  description?: string;
  value: number | null;
}

export interface Evaluation {
  responseId: string;
  metrics: EvaluationMetric[];
}

export interface APIEvaluation {
  responseId: string;
  metricId: string;
  metricName?: string;
  score: number;
}

export interface Record {
  id: string;
  imageUrl: string;
  image_id?: string;
  status?: string;
  modelOutputs: Array<{
    responseId: string;
    response: string;
    evaluations?: APIEvaluation[];
  }>;
  metrics: Metric[];
  evaluations: APIEvaluation[];
  groundTruth: {
    findings: string;
    impressions: string;
  };
  models: any[];
  navigation?: Navigation;
}
