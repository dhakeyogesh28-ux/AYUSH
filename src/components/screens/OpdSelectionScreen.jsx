import React, { useState, useEffect, useMemo } from 'react';
import { getTranslation } from '../../data/translations';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

const OpdSelectionScreen = ({
  currentMode = 'allopathy',
  patient,
  language,
  onSelect,
  onBack,
  speak,
}) => {
  const langCode = language?.code || 'en';
  const t = useMemo(() => getTranslation(langCode), [langCode]);

  // Supports: 'allopathy', 'ayush', or 'both'
  const [selectedModes, setSelectedModes] = useState(() => {
    if (currentMode === 'both') return ['allopathy', 'ayush'];
    if (currentMode === 'ayush') return ['ayush'];
    return ['allopathy'];
  });

  const isBothSelected = selectedModes.includes('allopathy') && selectedModes.includes('ayush');
  const effectiveMode = isBothSelected ? 'both' : selectedModes[0] || 'allopathy';

  useEffect(() => {
    const prompt =
      t.audioIdNext ||
      'Patient identification verified. Please select your consultation OPD type: General, AYUSH, or Both.';
    speak?.(prompt, language?.ttsLang);
  }, [language?.ttsLang, speak, t.audioIdNext]);

  const handleModeToggle = (modeId) => {
    let nextModes;
    if (selectedModes.includes(modeId)) {
      if (selectedModes.length > 1) {
        nextModes = selectedModes.filter((m) => m !== modeId);
      } else {
        nextModes = selectedModes;
      }
    } else {
      nextModes = [...selectedModes, modeId];
    }

    setSelectedModes(nextModes);

    const nextBoth = nextModes.includes('allopathy') && nextModes.includes('ayush');
    if (nextBoth) {
      speak?.(t.aiOpdBoth, language?.ttsLang);
    } else if (nextModes.includes('ayush')) {
      speak?.(t.aiOpdAyush, language?.ttsLang);
    } else {
      speak?.(t.aiOpdAllopathy, language?.ttsLang);
    }
  };

  const handleSelectBothDirectly = () => {
    setSelectedModes(['allopathy', 'ayush']);
    speak?.(t.aiOpdBoth, language?.ttsLang);
  };

  const OPD_OPTIONS = [
    {
      id: 'allopathy',
      label: t.allopathyLabel || 'General OPD',
      subtitle: t.allopathySub || 'Modern Medicine (Allopathy)',
      icon: '🏥',
      desc: t.allopathyDesc || 'Fever, cough, aches, infections, general health',
      color: '#0EA5E9',
    },
    {
      id: 'ayush',
      label: t.ayushLabel || 'AYUSH OPD',
      subtitle: t.ayushSub || 'Ayurveda / Yoga / Naturopathy',
      icon: '🌿',
      desc: t.ayushDesc || 'Prakriti analysis, Dashavidha Pariksha, holistic care',
      color: '#10B981',
    },
  ];

  return (
    <div className="screen-container animate-slide-up opd-selection-container">
      {/* Top Header with Back and Title */}
      <div className="opd-screen-topbar">
        {onBack && (
          <button type="button" className="back-btn" onClick={onBack} aria-label="Back">
            <ArrowLeft size={16} />
            <span>{t.backBtn || '← Back'}</span>
          </button>
        )}

        <div className="opd-screen-heading">
          <h2 className="screen-title">{t.opdSectionTitle || 'Select OPD Type'}</h2>
          <p className="screen-subtitle">
            {t.opdSubtitleText ||
              'Patient verified. Choose General OPD, AYUSH OPD, or both for an integrative consultation.'}
          </p>
        </div>
      </div>

      {/* Patient Mini Banner */}
      {patient && (
        <div className="opd-patient-banner">
          <span className="opd-patient-avatar">👤</span>
          <div className="opd-patient-meta">
            <span className="opd-patient-name">{patient.name || 'Verified Patient'}</span>
            <span className="opd-patient-sub">
              {patient.mobile ? `+91 ${patient.mobile}` : patient.abhaId || 'ABDM Profile'}
            </span>
          </div>
          <span className="opd-verified-pill">✓ {t.verifiedAbha || 'Verified'}</span>
        </div>
      )}

      {/* Quick "Select Both" Banner Button */}
      <div className="opd-both-shortcut-banner">
        <button
          type="button"
          className={`opd-both-btn ${isBothSelected ? 'is-active' : ''}`}
          onClick={handleSelectBothDirectly}
        >
          <div className="opd-both-btn-left">
            <span className="opd-both-icon">🌟</span>
            <div className="opd-both-text">
              <span className="opd-both-title">{t.bothLabel || 'Both (General + AYUSH)'}</span>
              <span className="opd-both-sub">
                {t.bothShortcutDesc ||
                  'Recommended: Full modern clinical assessment + Ayurvedic Dashavidha Pariksha'}
              </span>
            </div>
          </div>
          <div className={`opd-both-check ${isBothSelected ? 'checked' : ''}`}>
            {isBothSelected ? <Check size={20} /> : <Sparkles size={18} />}
          </div>
        </button>
      </div>

      {/* Individual OPD Cards (Can select either or both) */}
      <div className="opd-mode-grid">
        {OPD_OPTIONS.map((mode) => {
          const isSelected = selectedModes.includes(mode.id);
          return (
            <button
              key={mode.id}
              className={`opd-mode-card ${isSelected ? 'opd-mode-selected' : ''}`}
              onClick={() => handleModeToggle(mode.id)}
              aria-label={`Select ${mode.label}`}
              aria-pressed={isSelected}
            >
              <span className="opd-icon">{mode.icon}</span>
              <div className="opd-info">
                <div className="opd-label">{mode.label}</div>
                <div className="opd-subtitle">{mode.subtitle}</div>
                <p className="opd-desc-text">{mode.desc}</p>
              </div>
              <div className={`opd-multicheck ${isSelected ? 'checked' : ''}`}>
                {isSelected ? '✓' : '+'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Selection Hint */}
      <div className="opd-hint-box">
        <p className="opd-hint-text">
          {isBothSelected && t.hintBoth}
          {!isBothSelected && selectedModes.includes('ayush') && t.hintAyush}
          {!isBothSelected && selectedModes.includes('allopathy') && t.hintAllopathy}
        </p>
      </div>

      {/* Proceed CTA Button */}
      <div className="opd-proceed-wrap">
        <button
          className="btn btn-primary btn-large btn-proceed"
          onClick={() => onSelect(effectiveMode)}
        >
          <span>{t.continueToConsent || 'Continue to Patient Consent →'}</span>
          <span className="btn-proceed-badge">
            {isBothSelected
              ? `${t.allopathyLabel} + ${t.ayushLabel}`
              : selectedModes.includes('ayush')
              ? t.ayushLabel
              : t.allopathyLabel}
          </span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(OpdSelectionScreen);
