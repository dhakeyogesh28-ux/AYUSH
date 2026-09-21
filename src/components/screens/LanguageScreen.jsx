import React, { useEffect, useState, useRef } from 'react';
import { LANGUAGES } from '../../data/languages';
import { getTranslation } from '../../data/translations';
import { Layers, Smartphone, Mic, Check } from 'lucide-react';

const LanguageScreen = ({
  currentLanguage,
  currentInputMode = 'both',
  onSelect,
  onLanguageChange,
  speak,
}) => {
  const [selectedLang, setSelectedLang] = useState(currentLanguage || LANGUAGES[0]);
  const [selectedInputMode, setSelectedInputMode] = useState(currentInputMode || 'both');
  const isInitialMount = useRef(true);

  const t = getTranslation(selectedLang.code);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      speak(t.aiWelcome, selectedLang.ttsLang);
    }
  }, [speak, t.aiWelcome, selectedLang.ttsLang]);

  useEffect(() => {
    if (currentLanguage && currentLanguage.code !== selectedLang.code) {
      setSelectedLang(currentLanguage);
    }
  }, [currentLanguage]);

  useEffect(() => {
    if (currentInputMode && currentInputMode !== selectedInputMode) {
      setSelectedInputMode(currentInputMode);
    }
  }, [currentInputMode]);

  const handleLanguageSelect = (lang) => {
    setSelectedLang(lang);
    onLanguageChange?.(lang);

    const newT = getTranslation(lang.code);
    speak(newT.aiWelcome, lang.ttsLang);
  };

  const handleInputModeSelect = (modeId) => {
    setSelectedInputMode(modeId);

    if (modeId === 'both') {
      speak(t.aiInputModeBoth || 'Both touch keypad and voice selected.', selectedLang.ttsLang);
    } else if (modeId === 'touch') {
      speak(t.aiInputModeTouch || 'Touch keypad selected.', selectedLang.ttsLang);
    } else {
      speak(t.aiInputModeVoice || 'Tap to speak voice selected.', selectedLang.ttsLang);
    }
  };

  const handleContinue = () => {
    onSelect(selectedLang, selectedInputMode);
  };

  const INPUT_MODES = [
    {
      id: 'both',
      label: t.inputBothLabel || 'Both (Tap + Voice)',
      subtitle: t.inputBothSub || 'Touch keypad and microphone active simultaneously',
      icon: <Layers size={28} />,
      badge: 'Recommended / अनुशंसित',
      color: '#0284C7',
    },
    {
      id: 'touch',
      label: t.inputTouchLabel || 'Touch Keypad',
      subtitle: t.inputTouchSub || 'Manual on-screen keypad and card taps',
      icon: <Smartphone size={28} />,
      color: '#0D9488',
    },
    {
      id: 'voice',
      label: t.inputVoiceLabel || 'Tap to Speak',
      subtitle: t.inputVoiceSub || 'Voice microphone input in your chosen language',
      icon: <Mic size={28} />,
      color: '#E11D48',
    },
  ];

  return (
    <div className="screen-container animate-slide-up">
      {/* Language Header */}
      <div className="screen-header">
        <h2 className="screen-title">{t.langTitle}</h2>
        <p className="screen-subtitle">{t.langSubtitle}</p>
      </div>

      {/* Language Selection Grid */}
      <div className="language-grid">
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLang.code === lang.code;
          return (
            <button
              key={lang.code}
              className={`language-card ${isSelected ? 'language-card-active' : ''}`}
              onClick={() => handleLanguageSelect(lang)}
              aria-label={`Select ${lang.name}`}
              aria-pressed={isSelected}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-native">{lang.nativeName}</span>
              <span className="lang-english">{lang.name}</span>
              {isSelected && <span className="lang-selected-check">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Input Mode Section Header */}
      <div className="section-divider opd-divider-animated">
        <span>{t.inputModeSectionTitle || 'Select Input Mode'}</span>
      </div>

      <p className="opd-section-subtext">
        {t.inputModeSubtext || 'Choose how you would like to interact with the kiosk'}
      </p>

      {/* 3-Card Input Mode Grid */}
      <div className="input-mode-selection-grid">
        {INPUT_MODES.map((mode) => {
          const isSelected = selectedInputMode === mode.id;
          return (
            <button
              key={mode.id}
              className={`input-mode-card ${isSelected ? 'input-mode-card-selected' : ''}`}
              onClick={() => handleInputModeSelect(mode.id)}
              aria-label={`Select ${mode.label}`}
              aria-pressed={isSelected}
            >
              <div className="input-mode-icon-wrap" style={{ color: mode.color }}>
                {mode.icon}
              </div>
              <div className="input-mode-info">
                <div className="input-mode-label">{mode.label}</div>
                <div className="input-mode-subtitle">{mode.subtitle}</div>
              </div>
              <div className={`input-mode-check ${isSelected ? 'checked' : ''}`}>
                {isSelected ? <Check size={18} /> : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Proceed CTA */}
      <div className="language-proceed-wrap">
        <button
          className="btn btn-primary btn-large btn-proceed"
          onClick={handleContinue}
        >
          <span>{t.continueBtn}</span>
          <span className="btn-proceed-badge">
            {selectedLang.nativeName} · {INPUT_MODES.find((m) => m.id === selectedInputMode)?.label}
          </span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(LanguageScreen);
