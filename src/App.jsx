import React, { useState, useCallback, memo, useMemo } from 'react';

import WelcomeScreen from './components/screens/WelcomeScreen';
import LanguageScreen from './components/screens/LanguageScreen';
import IdentificationScreen from './components/screens/IdentificationScreen';
import OpdSelectionScreen from './components/screens/OpdSelectionScreen';
import ConsentScreen from './components/screens/ConsentScreen';
import InterviewWizard from './components/screens/InterviewWizard';
import AyushInterviewWizard from './components/screens/AyushInterviewWizard';
import DocumentScanScreen from './components/screens/DocumentScanScreen';
import SummaryScreen from './components/screens/SummaryScreen';
import PhysicianDashboard from './components/screens/PhysicianDashboard';
import ProgressStepper from './components/ui/ProgressStepper';
import RedFlagAlert from './components/ui/RedFlagAlert';
import Doctor3DAvatar from './components/ui/Doctor3DAvatar';
import useSpeech from './hooks/useSpeech';
import useSessionTimer from './hooks/useSessionTimer';
import { getTranslation } from './data/translations';

// ---- Doctor Avatar (Lightweight fallback) ----
const DoctorAvatar = memo(({ isSpeaking }) => (
  <div className={`doctor-avatar-circle ${isSpeaking ? 'speaking' : ''}`}>
    <div className="avatar-icon-wrap">
      <span className="avatar-emoji">👨‍⚕️</span>
    </div>
    {isSpeaking && (
      <div className="speaking-rings">
        <div className="sr-ring sr-ring-1" />
        <div className="sr-ring sr-ring-2" />
        <div className="sr-ring sr-ring-3" />
      </div>
    )}
  </div>
));

// ---- Error Boundary ----
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.warn('Recovered in ErrorBoundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ padding: '2.5rem', textAlign: 'center', background: '#FEF2F2', borderRadius: '16px', margin: '2rem', border: '1px solid #FECACA' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3 style={{ color: '#991B1B', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Screen Issue Recovered</h3>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            {this.state.error?.message || 'An unexpected rendering issue occurred.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
          >
            {this.props.resetLabel || 'Try Again / Back'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---- Session Timer Bar ----
const SessionTimerBar = memo(({ isActive, onExpire, t }) => {
  const timer = useSessionTimer(300, onExpire, isActive);
  if (!timer.isWarning) return null;
  return (
    <div className={`session-timer-bar ${timer.isCritical ? 'critical' : 'warning'}`}>
      <span>⏱️ {t.sessionWarning || 'Session expires in'} {timer.formatTime()}</span>
      <div className="stb-track">
        <div className="stb-fill" style={{ width: `${timer.percentLeft}%` }} />
      </div>
    </div>
  );
});

export default function App() {
  const [step, setStep] = useState('welcome');
  const [sessionId, setSessionId] = useState(() => `ayush_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const [language, setLanguage] = useState(null);
  const [inputMode, setInputMode] = useState('both');
  const [opdMode, setOpdMode] = useState('allopathy');
  const [patient, setPatient] = useState(null);
  const [answers, setAnswers] = useState({});
  const [documents, setDocuments] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [showPhysician, setShowPhysician] = useState(false);
  const [doctorText, setDoctorText] = useState('Namaste! I am your AI clinical assistant.');

  const { speak, stop, isSpeaking } = useSpeech();

  const t = useMemo(() => getTranslation(language?.code || 'en'), [language]);

  const handleSessionExpire = useCallback(() => {
    setStep('welcome');
    setAnswers({});
    setDocuments([]);
    setPatient(null);
    setSessionId(`ayush_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  }, []);

  const handleSpeak = useCallback(
    (text, lang) => {
      setDoctorText(text);
      speak(text, lang || language?.ttsLang || 'en-IN');
    },
    [speak, language]
  );

  const handleLanguageSelect = useCallback(
    async (lang, chosenInputMode = 'both') => {
      setLanguage(lang);
      setInputMode(chosenInputMode);
      setStep('id');

      // Initialize session in backend with chosen language
      try {
        await fetch('/api/gemini/session/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            language_code: lang.code,
            opd_mode: opdMode,
          }),
        });
      } catch (err) {
        console.warn('Session init fetch error:', err);
      }

      const newT = getTranslation(lang.code);
      setTimeout(() => {
        handleSpeak(`${lang.greeting} ${newT.idSubtitle}`, lang.ttsLang);
      }, 50);
    },
    [handleSpeak, opdMode, sessionId]
  );

  // After Patient Identification -> Route directly to Select OPD Type!
  const handleIdNext = useCallback(
    (patientData) => {
      setPatient(patientData);
      setStep('opd');
      const newT = getTranslation(language?.code || 'en');
      setTimeout(() => {
        handleSpeak(
          newT.audioIdNext ||
            'Patient identity verified. Please choose your consultation OPD type: General, AYUSH, or Both.',
          language?.ttsLang
        );
      }, 50);
    },
    [handleSpeak, language]
  );

  // After OPD Type Selection -> Route to Consent Screen
  const handleOpdSelect = useCallback(
    (selectedOpdMode) => {
      setOpdMode(selectedOpdMode);
      setStep('consent');
      const newT = getTranslation(language?.code || 'en');
      setTimeout(() => {
        handleSpeak(
          newT.consentSubtitle || 'Please review and accept patient consent to proceed.',
          language?.ttsLang
        );
      }, 50);
    },
    [handleSpeak, language]
  );

  const handleConsentAgree = useCallback(() => {
    const newT = getTranslation(language?.code || 'en');
    handleSpeak(
      newT.audioConsentAgree ||
        'Thank you for your consent. Let us begin discussing your health concern.',
      language?.ttsLang
    );
    setStep('interview');
  }, [handleSpeak, language]);

  const handleInterviewComplete = useCallback(
    (data) => {
      const record = data?.clinicalRecord || {};
      const merged = {
        ...record,
        ...data,
      };
      setAnswers((prev) => ({ ...prev, ...merged }));
      const newT = getTranslation(language?.code || 'en');
      if (opdMode === 'both' && step === 'interview') {
        setStep('ayush');
        handleSpeak(
          newT.audioGeneralHistoryCaptured ||
            'General clinical history captured. Now proceeding to AYUSH Dashavidha Pariksha.',
          language?.ttsLang
        );
        return;
      }
      setStep('scan');
      handleSpeak(
        newT.audioSymptomsRecorded ||
          'Excellent! Your symptoms are recorded. Please upload any previous medical documents.',
        language?.ttsLang
      );
    },
    [handleSpeak, language, opdMode, step]
  );

  const handleScanNext = useCallback(
    (docs) => {
      setDocuments(docs);
      setStep('summary');
      const newT = getTranslation(language?.code || 'en');
      handleSpeak(
        newT.audioGeneratingSummary ||
          'Perfect. I am now generating your clinical summary for the doctor.',
        language?.ttsLang
      );
    },
    [handleSpeak, language]
  );

  const handleRedFlag = useCallback((flags) => {
    setRedFlags(flags);
  }, []);

  const handleRedFlagDismiss = useCallback(() => setRedFlags([]), []);

  const handleEmergency = useCallback(
    (flag) => {
      setRedFlags([]);
      handleSpeak(
        `Emergency alert: ${flag.title}. Please notify the emergency triage team immediately.`,
        language?.ttsLang
      );
    },
    [handleSpeak, language]
  );

  // Physician view overlay
  if (showPhysician) {
    return (
      <ErrorBoundary onReset={() => setShowPhysician(false)} resetLabel="Return to Kiosk">
        <PhysicianDashboard
          sessionId={sessionId}
          answers={answers}
          documents={documents}
          patient={patient}
          mode={opdMode}
          language={language}
          onClose={() => setShowPhysician(false)}
        />
      </ErrorBoundary>
    );
  }

  // Welcome screen
  if (step === 'welcome') {
    return <WelcomeScreen onStart={() => setStep('language')} />;
  }

  return (
    <div className="kiosk-root">
      {/* Red flag emergency overlay */}
      <RedFlagAlert
        flags={redFlags}
        language={language}
        onDismiss={handleRedFlagDismiss}
        onConfirmEmergency={handleEmergency}
      />

      {/* Header */}
      <header className="kiosk-header">
        <div
          className="kh-logo"
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            stop();
            setStep('welcome');
            setAnswers({});
            setDocuments([]);
            setPatient(null);
            setSessionId(`ayush_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
          }}
          title="Ayush"
        >
          <img src="/ayush-logo.png" alt="Ayush" className="kh-logo-img" />
          <div>
            <span className="kh-brand">Ayush</span>
          </div>
        </div>

        <div className="kh-stepper">
          <ProgressStepper
            currentStep={step === 'ayush' ? 'interview' : step}
            language={language}
          />
        </div>

        <div className="kh-right">
          {language && (
            <div className="kh-lang-badge">
              <span>{language.flag}</span>
              <span>{language.nativeName}</span>
            </div>
          )}
          {opdMode === 'ayush' && (
            <div className="ayush-mode-indicator">{t.ayushTag}</div>
          )}
          {opdMode === 'allopathy' && (
            <div
              className="ayush-mode-indicator"
              style={{
                background: '#E0F2FE',
                color: '#0369A1',
                borderColor: '#BAE6FD',
              }}
            >
              {t.generalTag}
            </div>
          )}
          {opdMode === 'both' && (
            <div className="ayush-mode-indicator both-mode-indicator">
              {t.bothTag}
            </div>
          )}
        </div>
      </header>

      {/* Session timer warning */}
      <SessionTimerBar
        isActive={step !== 'welcome'}
        onExpire={handleSessionExpire}
        t={t}
      />

      {/* Main layout */}
      <main className="kiosk-main">
        {/* Doctor column */}
        <aside className="doctor-column">
          <div className="doctor-avatar-wrap">
            <ErrorBoundary fallback={<DoctorAvatar isSpeaking={isSpeaking} />}>
              <Doctor3DAvatar isSpeaking={isSpeaking} />
            </ErrorBoundary>
          </div>

          <div className={`speech-bubble-wrap ${isSpeaking ? 'active-speech' : ''}`}>
            <div className="speech-bubble">
              {isSpeaking && <span className="bubble-pulse">🔊</span>}
              <p>{doctorText}</p>
            </div>
          </div>
        </aside>

        {/* Content column */}
        <section className="content-column">
          <div className="content-scroll">
            <ErrorBoundary onReset={() => setStep('welcome')} resetLabel="Return to Welcome Screen">
              {step === 'language' && (
                <LanguageScreen
                  currentLanguage={language}
                  currentInputMode={inputMode}
                  onSelect={handleLanguageSelect}
                  onLanguageChange={setLanguage}
                  speak={handleSpeak}
                />
              )}
              {step === 'id' && (
                <IdentificationScreen
                  onNext={handleIdNext}
                  onBack={() => setStep('language')}
                  speak={handleSpeak}
                  language={language}
                  defaultInputMode={inputMode}
                />
              )}
              {step === 'opd' && (
                <OpdSelectionScreen
                  currentMode={opdMode}
                  patient={patient}
                  language={language}
                  onSelect={handleOpdSelect}
                  onBack={() => setStep('id')}
                  speak={handleSpeak}
                />
              )}
              {step === 'consent' && (
                <ConsentScreen
                  onAgree={handleConsentAgree}
                  onDecline={() => setStep('opd')}
                  speak={handleSpeak}
                  patient={patient}
                  language={language}
                />
              )}
              {step === 'interview' && (opdMode === 'allopathy' || opdMode === 'both') && (
                <InterviewWizard
                  sessionId={sessionId}
                  language={language}
                  opdMode={opdMode}
                  onComplete={handleInterviewComplete}
                  onRedFlag={handleRedFlag}
                  speak={handleSpeak}
                />
              )}
              {(step === 'ayush' || (step === 'interview' && opdMode === 'ayush')) && (
                <AyushInterviewWizard
                  sessionId={sessionId}
                  language={language}
                  onComplete={handleInterviewComplete}
                  speak={handleSpeak}
                />
              )}
              {step === 'scan' && (
                <DocumentScanScreen
                  onNext={handleScanNext}
                  speak={handleSpeak}
                  language={language}
                />
              )}
              {step === 'summary' && (
                <SummaryScreen
                  sessionId={sessionId}
                  answers={answers}
                  documents={documents}
                  patient={patient}
                  mode={opdMode}
                  language={language}
                  speak={handleSpeak}
                  onViewPhysician={() => setShowPhysician(true)}
                />
              )}
            </ErrorBoundary>
          </div>
        </section>
      </main>
    </div>
  );
}
