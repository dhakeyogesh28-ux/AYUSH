import React, { useMemo } from 'react';
import { getTranslation } from '../../data/translations';

const STEP_KEYS = [
  { id: 'language', key: 'stepLanguage', icon: '🌐' },
  { id: 'id', key: 'stepId', icon: '🪪' },
  { id: 'opd', key: 'stepOpd', icon: '🏥' },
  { id: 'consent', key: 'stepConsent', icon: '🛡️' },
  { id: 'interview', key: 'stepInterview', icon: '🩺' },
  { id: 'scan', key: 'stepScan', icon: '📄' },
  { id: 'summary', key: 'stepSummary', icon: '✅' },
];

const ProgressStepper = ({ currentStep, language }) => {
  const t = useMemo(() => getTranslation(language?.code || 'en'), [language]);
  const currentIdx = STEP_KEYS.findIndex((s) => s.id === currentStep);

  return (
    <div className="progress-stepper">
      {STEP_KEYS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isActive = idx === currentIdx;
        const label = t[step.key] || step.id;
        return (
          <React.Fragment key={step.id}>
            <div
              className={`stepper-item ${isActive ? 'active' : ''} ${
                isCompleted ? 'completed' : ''
              }`}
            >
              <div className="stepper-icon">
                {isCompleted ? '✓' : step.icon}
              </div>
              <span className="stepper-label">{label}</span>
            </div>
            {idx < STEP_KEYS.length - 1 && (
              <div
                className={`stepper-connector ${
                  isCompleted ? 'completed' : ''
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default React.memo(ProgressStepper);
