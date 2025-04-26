
import React from 'react';
import { cn } from '@/lib/utils';

export interface Report {
  title: string;
  findings: string;
  impression: string;
  highlight?: boolean;
}

interface ReportPanelProps {
  report: Report;
  className?: string;
}

export const ReportPanel: React.FC<ReportPanelProps> = ({
  report,
  className,
}) => {
  return (
    <div 
      className={cn(
        "rounded-lg border overflow-hidden flex flex-col h-full",
        report.highlight 
          ? "border-medical-blue/50 bg-medical-dark-gray/80" 
          : "border-medical-dark-gray/30 bg-medical-dark-gray/30",
        className
      )}
    >
      <div 
        className={cn(
          "p-3 font-medium border-b text-lg",
          report.highlight 
            ? "bg-medical-blue text-white border-medical-blue/50" 
            : "bg-medical-dark-gray/50 border-medical-dark-gray/30",
        )}
      >
        {report.title}
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto report-panel space-y-4">
        <div>
          <h3 className="text-sm font-medium text-medical-gray uppercase mb-1">FINDINGS:</h3>
          <p className="text-sm">{report.findings}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-medical-gray uppercase mb-1">IMPRESSION:</h3>
          <p className="text-sm">{report.impression}</p>
        </div>
      </div>
    </div>
  );
};
