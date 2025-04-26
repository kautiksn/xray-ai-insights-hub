
import React from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ModelScore {
  modelId: string;
  metrics: {
    [key: string]: number | null;
  };
}

interface EvaluationMetricsProps {
  metrics: string[];
  modelScores: ModelScore[];
  onUpdateScore: (modelId: string, metricId: string, score: number) => void;
}

export const EvaluationMetrics: React.FC<EvaluationMetricsProps> = ({
  metrics,
  modelScores,
  onUpdateScore,
}) => {
  // Function to get background color based on score
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-medical-dark-gray';
    
    if (score <= 3) return `bg-score-${score}`;
    if (score <= 7) return `bg-score-${score}`;
    return `bg-score-${score}`;
  };

  return (
    <div className="rounded-lg border border-medical-dark-gray/30 overflow-hidden">
      <div className="bg-medical-dark-gray/50 p-3 border-b border-medical-dark-gray/30">
        <h2 className="text-lg font-medium">EVALUATION METRICS</h2>
      </div>
      
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-medical-dark-gray/30 border-b border-medical-dark-gray/30">
              <th className="p-3 text-left w-24">MODEL</th>
              {metrics.map((metric) => (
                <th key={metric} className="p-3 text-center">
                  {metric}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {modelScores.map((model) => (
              <tr key={model.modelId} className="border-b border-medical-dark-gray/20">
                <td className="p-3 font-medium text-left">
                  {model.modelId}
                </td>
                
                {metrics.map((metricId) => {
                  const score = model.metrics[metricId];
                  
                  return (
                    <td key={`${model.modelId}-${metricId}`} className="p-3 text-center">
                      {score !== null ? (
                        <div className="flex justify-center">
                          <div 
                            className={cn('score-circle', getScoreColor(score))}
                            title={`Score: ${score}/10`}
                          >
                            {score}
                          </div>
                        </div>
                      ) : (
                        <Select 
                          onValueChange={(value) => onUpdateScore(model.modelId, metricId, parseInt(value))}
                        >
                          <SelectTrigger className="w-20 mx-auto">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(10)].map((_, i) => (
                              <SelectItem key={i+1} value={(i+1).toString()}>
                                {i+1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
