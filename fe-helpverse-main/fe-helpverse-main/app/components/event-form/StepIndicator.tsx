import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  steps: {
    number: number;
    label: string;
  }[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mb-6 sm:mb-8 overflow-x-auto pb-2">
      <div className="flex items-center min-w-max">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className={`flex items-center ${step.number <= currentStep ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 ${
                step.number <= currentStep ? 'border-indigo-600' : 'border-gray-300'
              }`}>
                <span className="text-xs sm:text-sm">{step.number}</span>
              </div>
              <div className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium">
                {step.label}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-6 sm:w-16 h-0.5 mx-1 sm:mx-4 ${step.number < currentStep ? 'bg-indigo-600' : 'bg-gray-300'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
} 