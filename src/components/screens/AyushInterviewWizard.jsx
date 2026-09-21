import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  getLocalizedAyushQuestions,
  getLocalizedDashavidhaSections,
} from '../../data/ayushQuestions';
import useGeminiLive from '../../hooks/useGeminiLive';
import ModernMic from '../ui/ModernMic';
import { getTranslation } from '../../data/translations';

const AyushInterviewWizard = ({
  sessionId,
  language,
  onComplete,
  speak,
}) => {
  const t = useMemo(() => getTranslation(language?.code || 'en'), [language]);
  const langCode = language?.code || 'en';
  const lang = language?.ttsLang || 'en-IN';

  const questions = useMemo(() => getLocalizedAyushQuestions(langCode), [langCode]);
  const sections = useMemo(() => getLocalizedDashavidhaSections(langCode), [langCode]);

  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState([]);

  const sendUserMessageRef = useRef(null);
  const lastSpokenTextRef = useRef('');
  const prevLangCodeRef = useRef(null);

  const currentQ = questions[qIndex] || questions[0];
  const totalSteps = questions.length;
  const progress = totalSteps > 0 ? (qIndex / totalSteps) * 100 : 0;
  const currentSection = sections.find((s) => s.id === currentQ?.section);

  const speakCurrentQuestion = useCallback(
    (textToSpeak) => {
      if (!textToSpeak || textToSpeak === lastSpokenTextRef.current) return;
      lastSpokenTextRef.current = textToSpeak;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore cancel error
        }
      }
      speak?.(textToSpeak, lang);
    },
    [lang, speak]
  );

  const recordAnswer = useCallback(
    (value) => {
      if (!currentQ) return;
      const valString = Array.isArray(value) ? value.join(', ') : String(value);
      const newAnswers = { ...answers, [currentQ.id]: valString };
      setAnswers(newAnswers);
      setSelected([]);

      // Send to live AI dialogue
      sendUserMessageRef.current?.(valString);

      if (qIndex < questions.length - 1) {
        setQIndex((prev) => prev + 1);
      } else {
        onComplete?.(newAnswers);
      }
    },
    [answers, currentQ, onComplete, qIndex, questions.length]
  );

  const handleOptionSelect = useCallback(
    (opt) => {
      if (currentQ?.type === 'multi') {
        setSelected((prev) =>
          prev.includes(opt) ? prev.filter((s) => s !== opt) : [...prev, opt]
        );
      } else {
        recordAnswer(opt);
      }
    },
    [currentQ, recordAnswer]
  );

  // Intelligent Voice Answer Matching
  const handleVoiceAnswer = useCallback(
    (spokenText) => {
      if (!spokenText || !spokenText.trim() || !currentQ) return;
      const clean = spokenText.trim().toLowerCase();

      // 1. Ordinal numbers matching (1, 2, 3, first, second, etc.)
      const numMatches = {
        '1': 0, 'one': 0, 'first': 0, 'पहला': 0, 'एक': 0, 'प्रथम': 0, 'पहिला': 0, 'ஒன்று': 0, 'ఒకటి': 0, 'ಒಂದು': 0, 'এক': 0, 'એક': 0,
        '2': 1, 'two': 1, 'second': 1, 'दूसरा': 1, 'दो': 1, 'द्वितीय': 1, 'दुसरा': 1, 'இரண்டு': 1, 'రెండు': 1, 'ಎರಡು': 1, 'দুই': 1, 'બે': 1,
        '3': 2, 'three': 2, 'third': 2, 'तीसरा': 2, 'तीन': 2, 'तृतीय': 2, 'तिसरा': 2, 'மூன்று': 2, 'మూడు': 2, 'ಮೂರು': 2, 'তিন': 2, 'ત્રણ': 2,
        '4': 3, 'four': 3, 'fourth': 3, 'चौथा': 3, 'चार': 3, 'चतुर्थ': 3, 'நான்கு': 3, 'నాలుగు': 3, 'ನಾಲ್ಕು': 3, 'চার': 3, 'ચાર': 3,
      };

      for (const [kw, idx] of Object.entries(numMatches)) {
        if (clean === kw || clean.startsWith(kw + ' ') || clean.endsWith(' ' + kw)) {
          if (currentQ.options && currentQ.options[idx]) {
            handleOptionSelect(currentQ.options[idx]);
            return;
          }
        }
      }

      // 2. Keyword and Dosha matching against options
      if (currentQ.options && currentQ.options.length > 0) {
        let bestOpt = null;
        let highestScore = 0;

        for (const opt of currentQ.options) {
          const optLower = opt.toLowerCase();

          // Direct inclusion
          if (optLower.includes(clean) || clean.includes(optLower)) {
            bestOpt = opt;
            highestScore = 100;
            break;
          }

          let score = 0;

          // Ayurvedic dosha keywords
          if (
            (clean.includes('वात') || clean.includes('vata')) &&
            (optLower.includes('वात') || optLower.includes('vata'))
          ) score += 10;

          if (
            (clean.includes('पित्त') || clean.includes('pitta')) &&
            (optLower.includes('पित्त') || optLower.includes('pitta'))
          ) score += 10;

          if (
            (clean.includes('कफ') || clean.includes('kapha')) &&
            (optLower.includes('कफ') || optLower.includes('kapha'))
          ) score += 10;

          // Common clinical keywords
          const clinicalKeywords = [
            'पतला', 'सुडौल', 'भारी', 'रूखी', 'तैलीय', 'मुलायम',
            'तीक्ष्ण', 'मंद', 'विषम', 'उत्कृष्ट', 'मध्यम', 'अवर',
            'गर्म', 'ठंडी', 'कमजोरी', 'थकावट', 'हाँ', 'नहीं'
          ];
          for (const ck of clinicalKeywords) {
            if (clean.includes(ck) && optLower.includes(ck)) score += 5;
          }

          // Token overlap
          const optTokens = optLower.split(/[\s,()\-—/]+/).filter((t) => t.length > 2);
          const speechTokens = clean.split(/[\s,()\-—/]+/).filter((t) => t.length > 2);
          for (const st of speechTokens) {
            if (optTokens.some((ot) => ot.includes(st) || st.includes(ot))) {
              score += 2;
            }
          }

          if (score > highestScore) {
            highestScore = score;
            bestOpt = opt;
          }
        }

        if (bestOpt && highestScore > 0) {
          handleOptionSelect(bestOpt);
          return;
        }
      }

      // 3. If descriptive/free-form speech, record spoken text directly
      recordAnswer(spokenText.trim());
    },
    [currentQ, handleOptionSelect, recordAnswer]
  );

  const handleSpeakFallback = useCallback((text) => {
    if (currentQ?.question) {
      speakCurrentQuestion(currentQ.question);
    }
  }, [currentQ?.question, speakCurrentQuestion]);

  // Connect to Gemini Live in AYUSH mode
  const {
    isAiSpeaking,
    isListening,
    aiSpeechText,
    userSpeechText,
    error,
    startListening,
    stopListening,
    sendUserMessage,
  } = useGeminiLive({
    sessionId,
    languageCode: langCode,
    opdMode: 'ayush',
    onUserSpeech: handleVoiceAnswer,
    speakFallback: handleSpeakFallback,
  });

  useEffect(() => {
    sendUserMessageRef.current = sendUserMessage;
  }, [sendUserMessage]);

  // Reset spoken state when language changes
  useEffect(() => {
    if (prevLangCodeRef.current !== langCode) {
      prevLangCodeRef.current = langCode;
      lastSpokenTextRef.current = '';
    }
  }, [langCode]);

  // Speak question in patient's language on mount or index change
  useEffect(() => {
    if (currentQ?.question) {
      speakCurrentQuestion(currentQ.question);
    }
  }, [currentQ?.question, speakCurrentQuestion]);

  const handleMicToggle = () => {
    if (isAiSpeaking || (typeof window !== 'undefined' && window.speechSynthesis?.speaking)) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speech cancel error
      }
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getPrakritiClass = (opt) => {
    if (opt.includes('Vata') || opt.includes('वात')) return 'prakriti-vata';
    if (opt.includes('Pitta') || opt.includes('पित्त')) return 'prakriti-pitta';
    if (opt.includes('Kapha') || opt.includes('कफ')) return 'prakriti-kapha';
    return '';
  };

  return (
    <div className="screen-container screen-wide interview-screen-wrap animate-slide-up">
      {/* 2-Column Responsive Layout: Left = AYUSH Questions & Options, Right = Live Voice Mic */}
      <div className="interview-grid-layout">
        {/* ========================================================
            LEFT COLUMN: QUESTION, DOSHA OPTIONS & NAVIGATOR
            ======================================================== */}
        <div className="interview-left-col">
          {/* Progress Bar & Step Indicator (Exact same as General OPD) */}
          <div className="interview-progress">
            <div className="ip-track">
              <div className="ip-fill ayush-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="ip-label">
              {currentSection ? `${currentSection.icon} ${currentSection.label} · ` : ''}
              Step {qIndex + 1} of {totalSteps}
            </span>
          </div>

          {/* MAIN UNIFIED QUESTION BANNER: Spoken by AI & Read on Screen */}
          <div className="screen-header" style={{ marginBottom: '0.85rem' }}>
            <span className="interview-ai-badge ayush-badge">
              🌿 AYUSH Dashavidha Pariksha · {currentSection?.label || 'Clinical Intake'} {currentSection?.subtitle ? `(${currentSection.subtitle})` : ''}
            </span>
            <h2 className="question-text" style={{ fontSize: '1.35rem', lineHeight: '1.35', marginTop: '0.35rem' }}>
              {currentQ?.question}
            </h2>
            <p className="screen-subtitle" style={{ fontSize: '0.88rem', color: '#6B7280', marginTop: '0.25rem' }}>
              {currentQ?.type === 'multi'
                ? (t.multiSelectHint || 'Select one or more options, then tap confirm or speak into microphone.')
                : (t.singleSelectHint || 'Tap an answer below or speak directly into the microphone.')}
            </p>
          </div>

          {/* TAP OPTIONS CONTAINER */}
          <div className="interview-tap-options-wrap">
            <div className="options-list options-grid-2col">
              {currentQ?.options?.map((opt, idx) => {
                const isSel = selected.includes(opt);
                return (
                  <button
                    key={idx}
                    className={`option-btn ayush-option ${getPrakritiClass(opt)} ${
                      isSel ? 'selected' : ''
                    }`}
                    onClick={() => handleOptionSelect(opt)}
                  >
                    <span className="opt-bullet">{isSel ? '✓' : '👉'}</span>
                    <span style={{ fontWeight: 600 }}>{opt}</span>
                  </button>
                );
              })}
              {currentQ?.type === 'multi' && (
                <button
                  className="btn btn-primary"
                  style={{
                    marginTop: '0.35rem',
                    width: '100%',
                    gridColumn: 'span 2',
                    minHeight: '44px',
                    fontWeight: 700,
                  }}
                  disabled={selected.length === 0}
                  onClick={() => recordAnswer(selected)}
                >
                  {t.confirmProceed || 'Confirm & Continue →'}
                </button>
              )}
            </div>
          </div>

          {/* Compact Mini Dashavidha Pill Row */}
          <div className="ayush-dashavidha-pill-row">
            {sections.map((sec, sIdx) => {
              const isActive = currentQ?.section === sec.id;
              const isDone = sections.findIndex((s) => s.id === currentQ?.section) > sIdx;
              return (
                <span
                  key={sec.id}
                  className={`ayush-mini-pill ${isActive ? 'active' : isDone ? 'done' : ''}`}
                  title={`${sec.label} — ${sec.subtitle}`}
                >
                  {sec.icon} <span className="ayush-mini-pill-label">{sec.label}</span>
                </span>
              );
            })}
          </div>

          {/* Compact Inline Navigation Row (Inside left column, eliminating separate bottom bar) */}
          <div className="interview-nav-row" style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border)' }}>
            <button
              className="btn-nav-step"
              onClick={() => {
                if (qIndex > 0) setQIndex((prev) => prev - 1);
              }}
              disabled={qIndex === 0}
            >
              {t.backBtn || '← Back'}
            </button>

            <button
              className="btn-nav-step"
              onClick={() => {
                if (qIndex < questions.length - 1) setQIndex((prev) => prev + 1);
                else onComplete?.(answers);
              }}
            >
              {t.skipBtn || 'Skip this question →'}
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onComplete?.(answers)}
            >
              {t.completeInterviewBtn || 'Done → Complete'}
            </button>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: STICKY RIGHT-CORNER LIVE MIC PANEL
            ======================================================== */}
        <div className="interview-right-col">
          <div
            className={`interview-voice-panel ${
              isAiSpeaking ? 'ai-active' : isListening ? 'user-active' : ''
            }`}
          >
            <div className="live-status-indicator">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="live-pulse-dot" />
                <span className="live-status-text">
                  {isAiSpeaking
                    ? t.aiSpeaking || 'AI Doctor is speaking...'
                    : isListening
                    ? t.listening || 'Listening to your voice...'
                    : t.voiceHint || 'Tap mic to speak naturally'}
                </span>
              </div>
              <span className="live-lang-tag">🌐 {language?.nativeName}</span>
            </div>

            {/* Live Conversation Stream Dialogue */}
            <div className="live-conversation-stream">
              <div className="live-ai-bubble animate-fade-in">
                <span className="bubble-speaker">👨‍⚕️ Dr. Ayush</span>
                <p className="bubble-text">{currentQ?.question}</p>
              </div>

              {userSpeechText && (
                <div className="live-user-bubble animate-fade-in">
                  <span className="bubble-speaker">👤 {language?.nativeName || 'Patient'}</span>
                  <p className="bubble-text">"{userSpeechText}"</p>
                </div>
              )}
            </div>

            {/* Centered Modern Studio Mic */}
            <ModernMic
              isListening={isListening}
              isAiSpeaking={isAiSpeaking}
              error={error}
              onToggle={handleMicToggle}
              onClick={handleMicToggle}
              labelIdle={t.tapToSpeak || 'Tap to speak'}
              labelListening={t.listening || 'Listening... Speak now'}
              labelSpeaking={t.aiSpeaking || 'AI Doctor is speaking...'}
            />

            {/* Voice hint instruction */}
            <div className="voice-card-hint">
              <span>🗣️ Speak naturally in your language or tap options</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AyushInterviewWizard);
