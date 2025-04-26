
import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { DoctorSidebar } from '@/components/DoctorSidebar';
import { ImageViewer } from '@/components/ImageViewer';
import { ReportPanel, Report } from '@/components/ReportPanel';
import { EvaluationMetrics, ModelScore } from '@/components/EvaluationMetrics';
import { toast } from '@/components/ui/sonner';

// Mock data
const mockDoctors = [
  { id: 'd1', name: 'Dr. Divya Sharma' },
  { id: 'd2', name: 'Dr. Alex Johnson' },
  { id: 'd3', name: 'Dr. Sarah Williams' },
  { id: 'd4', name: 'Dr. Michael Chen' },
];

const mockImages = [
  'public/placeholder.svg',
  'public/placeholder.svg',
  'public/placeholder.svg',
  'public/placeholder.svg',
  'public/placeholder.svg',
];

const groundTruthReport: Report = {
  title: 'GROUND TRUTH REPORT',
  findings: 'PA and lateral views of the chest demonstrate normal cardiomediastinal silhouette. The lungs are clear without focal consolidation, pneumothorax, or pleural effusion. No acute osseous abnormality.',
  impression: 'Normal chest radiograph. No acute cardiopulmonary process identified.',
  highlight: true,
};

const modelReports: Report[] = [
  {
    title: 'MODEL 1',
    findings: 'Clear lung fields. Normal cardiomediastinal silhouette. No pleural effusion.',
    impression: 'No acute abnormality.',
  },
  {
    title: 'MODEL 2',
    findings: 'Normal lung volumes. No infiltrates or effusions. Heart size within normal limits.',
    impression: 'Normal chest x-ray.',
  },
  {
    title: 'MODEL 3',
    findings: 'The lungs are clear bilaterally. Cardiomediastinal silhouette is normal. No pleural effusion.',
    impression: 'Normal chest radiograph.',
  },
];

const metricsLabels = ['METRIC 1', 'METRIC 2', 'METRIC 3', 'METRIC 4', 'METRIC 5', 'METRIC 6'];

const initialModelScores: ModelScore[] = [
  {
    modelId: 'MODEL 1',
    metrics: {
      'METRIC 1': 9,
      'METRIC 2': null,
      'METRIC 3': 7,
      'METRIC 4': 8,
      'METRIC 5': null,
      'METRIC 6': 9,
    }
  },
  {
    modelId: 'MODEL 2',
    metrics: {
      'METRIC 1': 6,
      'METRIC 2': 8,
      'METRIC 3': null,
      'METRIC 4': 75, // This represents a percentage, will be handled specially
      'METRIC 5': 3,
      'METRIC 6': 7,
    }
  },
  {
    modelId: 'MODEL 3',
    metrics: {
      'METRIC 1': null,
      'METRIC 2': null,
      'METRIC 3': null,
      'METRIC 4': null,
      'METRIC 5': null,
      'METRIC 6': null,
    }
  },
];

const Index = () => {
  const [currentDoctor, setCurrentDoctor] = useState(mockDoctors[0]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modelScores, setModelScores] = useState(initialModelScores);

  const handleUpdateScore = (modelId: string, metricId: string, score: number) => {
    setModelScores(prev => 
      prev.map(model => 
        model.modelId === modelId 
          ? { 
              ...model, 
              metrics: { 
                ...model.metrics, 
                [metricId]: score 
              } 
            }
          : model
      )
    );
    
    toast.success(`${modelId} ${metricId} score updated to ${score}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-medical-darkest-gray text-foreground">
      {/* Header */}
      <header className="bg-medical-darker-gray px-8 py-3 border-b border-medical-dark-gray/30 flex justify-between items-center">
        <h1 className="text-xl font-bold text-medical-blue flex items-center">
          <Settings className="mr-2" size={20} />
          Radiology AI Comparison Platform
        </h1>
        <div className="flex items-center">
          <span className="font-medium text-sm text-medical-light-blue mr-2">
            Current Radiologist:
          </span>
          <span className="font-medium">
            {currentDoctor.name}
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Top section (70% height) */}
        <div className="flex gap-4 h-[70vh]">
          {/* Image viewer (40% width) */}
          <div className="w-2/5">
            <ImageViewer 
              images={mockImages}
              currentIndex={currentImageIndex}
              onChangeImage={setCurrentImageIndex}
            />
          </div>
          
          {/* Reports grid (60% width) */}
          <div className="w-3/5 grid grid-cols-2 grid-rows-2 gap-4">
            <ReportPanel report={groundTruthReport} />
            {modelReports.map((report, index) => (
              <ReportPanel key={index} report={report} />
            ))}
          </div>
        </div>
        
        {/* Bottom section (30% height) */}
        <div className="h-[30vh] min-h-[250px]">
          <EvaluationMetrics
            metrics={metricsLabels}
            modelScores={modelScores}
            onUpdateScore={handleUpdateScore}
          />
        </div>
      </div>

      {/* Doctor sidebar */}
      <DoctorSidebar
        doctors={mockDoctors}
        currentDoctor={currentDoctor}
        onSelectDoctor={setCurrentDoctor}
      />
    </div>
  );
};

export default Index;
