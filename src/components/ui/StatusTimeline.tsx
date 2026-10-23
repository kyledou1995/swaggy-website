'use client';

import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/useInView';

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

const STEP_MS = 140; // delay between each step lighting up on load

/**
 * Vertical order progress timeline. On mount, completed steps check off one by
 * one, the connecting line fills down to the current step, and the current
 * step pulses.
 */
export const StatusTimeline: React.FC<StatusTimelineProps> = ({ steps, currentStepIndex }) => {
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = useState(-1);
  const shown = reduced ? currentStepIndex : revealed;

  useEffect(() => {
    if (reduced) return;
    let i = -1;
    const id = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= currentStepIndex) clearInterval(id);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [currentStepIndex, reduced]);

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex && index <= shown;
        const isCurrent = index === currentStepIndex && shown >= currentStepIndex;
        const lineFilled = index < currentStepIndex && index + 1 <= shown;

        return (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 ${
                  isCompleted
                    ? 'bg-green-500 border-green-500'
                    : isCurrent
                      ? 'border-green-500 bg-white animate-ring-ping'
                      : 'bg-white border-gray-300'
                }`}
              >
                {isCompleted ? (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      style={{ strokeDasharray: 24, strokeDashoffset: reduced ? 0 : 24, animation: reduced ? undefined : 'merchin-draw .35s ease-out forwards' }}
                    />
                  </svg>
                ) : isCurrent ? (
                  <span className="w-3.5 h-3.5 rounded-full bg-green-500" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-gray-300" />
                )}
              </div>

              {index < steps.length - 1 && (
                <div className="relative w-0.5 h-12 my-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-x-0 top-0 bg-green-500 transition-[height] ease-out"
                    style={{ height: lineFilled ? '100%' : '0%', transitionDuration: `${STEP_MS}ms` }}
                  />
                </div>
              )}
            </div>

            <div className="pt-1 pb-6">
              <h3
                className={`text-sm font-semibold transition-colors duration-300 ${
                  isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.label}
              </h3>
              {step.timestamp && <p className="mt-0.5 text-xs text-gray-500">{step.timestamp}</p>}
              {step.message && <p className="mt-1 text-sm text-gray-600">{step.message}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

StatusTimeline.displayName = 'StatusTimeline';
