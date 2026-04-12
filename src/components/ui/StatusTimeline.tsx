import React from 'react';
import { Check, Circle } from 'lucide-react';

export interface TimelineStep {
  id: string | number;
  label: string;
  timestamp?: string;
  message?: string;
}

export interface StatusTimelineProps {
  steps: TimelineStep[];
  currentStepIndex: number;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  steps,
  currentStepIndex,
}) => {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isUpcoming = index > currentStepIndex;

        return (
          <div key={step.id} className="flex gap-4">
            {/* Timeline line and icon */}
            <div className="flex flex-col items-center">
              {/* Icon */}
              <div
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted
                    ? 'bg-green-500 border-green-500'
                    : isCurrent
                      ? 'border-green-500 bg-white'
                      : 'bg-white border-gray-300'
                }`}
              >
                {isCompleted && (
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                )}
                {isCurrent && (
                  <Circle
                    className="w-4 h-4 text-green-500 animate-pulse"
                    fill="currentColor"
                  />
                )}
                {isUpcoming && (
                  <Circle className="w-3 h-3 text-gray-400" />
                )}
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-12 my-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="pt-1 pb-6">
              <h3
                className={`text-sm font-semibold ${
                  isCompleted || isCurrent
                    ? 'text-gray-900'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </h3>
              {step.timestamp && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {step.timestamp}
                </p>
              )}
              {step.message && (
                <p className="mt-1 text-sm text-gray-600">{step.message}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

StatusTimeline.displayName = 'StatusTimeline';
