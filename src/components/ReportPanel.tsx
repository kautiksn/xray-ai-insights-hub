import React from 'react'
import { cn } from '@/lib/utils'
import { Report } from '@/types/Record'

interface ReportPanelProps {
  report: Report | { responseId: string; response: string }
  className?: string
  isGroundTruth?: boolean
  title?: string
}

export const ReportPanel: React.FC<ReportPanelProps> = ({
  report,
  className,
  isGroundTruth,
  title,
}) => {
  // Check if report is ground truth or model output
  const isModelOutput = 'response' in report;

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden flex flex-col h-full',
        isGroundTruth
          ? 'border-medical-blue/50 bg-medical-dark-gray/80'
          : 'border-medical-dark-gray/30 bg-medical-dark-gray/30',
        className
      )}
    >
      <div
        className={cn(
          'p-3 font-medium border-b text-lg',
          isGroundTruth
            ? 'bg-medical-blue text-white border-medical-blue/50'
            : 'bg-medical-dark-gray/50 border-medical-dark-gray/30'
        )}
      >
        {isGroundTruth ? 'Ground Truth' : title}
      </div>

      <div className="flex-1 p-4 overflow-y-auto report-panel space-y-4">
        {isModelOutput ? (
          <div>
            <h3 className="text-sm font-medium text-medical-gray uppercase mb-1">
              RESPONSE:
            </h3>
            <p className="text-sm">{(report as { response: string }).response}</p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-sm font-medium text-medical-gray uppercase mb-1">
                FINDINGS:
              </h3>
              <p className="text-sm">{(report as Report).findings}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-medical-gray uppercase mb-1">
                IMPRESSION:
              </h3>
              <p className="text-sm">{(report as Report).impressions}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
