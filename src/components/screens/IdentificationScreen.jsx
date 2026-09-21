import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  validateABHA,
  formatABHA,
  validateMobile,
  validateAadhaar,
  formatAadhaar,
  validateOTP,
  extractDigitsFromSpeech,
  sendOTP,
  verifyOTP,
  fetchABHAPatient,
  registerNewPatientWithAadhaar,
  generatePatientId,
} from '../../utils/abhaUtils';
import { getTranslation } from '../../data/translations';
import KioskNumericKeypad from '../ui/KioskNumericKeypad';
import ModernMic from '../ui/ModernMic';
import useVoiceInput from '../../hooks/useVoiceInput';
import {
  Phone,
  CreditCard,
  UserPlus,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  Mic,
  Smartphone,
  Layers,
} from 'lucide-react';

const IdentificationScreen = ({ onNext, onBack, speak, language, defaultInputMode = 'both' }) => {
  // Mode: 'mobile' | 'abha' | 'new'
  const [mode, setMode] = useState('mobile');

  // Input Method: 'both' | 'touch' | 'voice'
  const [inputMethod, setInputMethod] = useState(defaultInputMode || 'both');

  // Active stage: 'input' | 'otp' | 'verified'
  const [stage, setStage] = useState('input');

  // Inputs
  const [mobileInput, setMobileInput] = useState('');
  const [abhaInput, setAbhaInput] = useState('');
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [newName, setNewName] = useState('');
  const [otpInput, setOtpInput] = useState('');

  // Active target field for new patient: 'aadhaar' | 'mobile' | 'name'
  const [activeNewField, setActiveNewField] = useState('aadhaar');

  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');
  const [otpResendCountdown, setOtpResendCountdown] = useState(30);
  const [maskedTarget, setMaskedTarget] = useState('');
  const [lastSpokenTranscript, setLastSpokenTranscript] = useState('');

  const t = useMemo(() => getTranslation(language?.code || 'en'), [language]);
  const langCode = language?.code || 'en';
  const lang = language?.ttsLang || 'en-IN';

  // Initial greeting
  useEffect(() => {
    const welcomeText = t.aiWelcome || 'Please enter your mobile number or ABHA ID to proceed.';
    speak(welcomeText, lang);
  }, [lang, speak, t.aiWelcome]);

  // Resend OTP Countdown timer
  useEffect(() => {
    let timer;
    if (stage === 'otp' && otpResendCountdown > 0) {
      timer = setInterval(() => {
        setOtpResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage, otpResendCountdown]);

  // Handle Speech Recognition for Digits
  const handleVoiceTranscript = useCallback(
    (spokenText, isFinal) => {
      if (!spokenText) return;
      setLastSpokenTranscript(spokenText);
      const digits = extractDigitsFromSpeech(spokenText);
      if (!digits) return;

      setError('');

      if (stage === 'otp') {
        setOtpInput((prev) => {
          const next = (prev + digits).slice(0, 6);
          return next;
        });
        return;
      }

      if (mode === 'mobile') {
        setMobileInput((prev) => {
          const next = (prev + digits).slice(0, 10);
          return next;
        });
      } else if (mode === 'abha') {
        setAbhaInput((prev) => {
          const next = (prev + digits).slice(0, 14);
          return next;
        });
      } else if (mode === 'new') {
        if (activeNewField === 'aadhaar') {
          setAadhaarInput((prev) => {
            const next = (prev + digits).slice(0, 12);
            return next;
          });
        } else if (activeNewField === 'mobile') {
          setMobileInput((prev) => {
            const next = (prev + digits).slice(0, 10);
            return next;
          });
        }
      }
    },
    [activeNewField, mode, stage]
  );

  const {
    isListening,
    transcript: liveVoiceTranscript,
    error: micError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput(handleVoiceTranscript, lang);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setLastSpokenTranscript('');
      startListening();
    }
  }, [isListening, resetTranscript, startListening, stopListening]);

  // Touch Keypad Handlers
  const handleDigitPress = useCallback(
    (digit) => {
      setError('');

      if (stage === 'otp') {
        setOtpInput((prev) => (prev.length < 6 ? prev + digit : prev));
        return;
      }

      if (mode === 'mobile') {
        setMobileInput((prev) => (prev.length < 10 ? prev + digit : prev));
      } else if (mode === 'abha') {
        setAbhaInput((prev) => (prev.length < 14 ? prev + digit : prev));
      } else if (mode === 'new') {
        if (activeNewField === 'aadhaar') {
          setAadhaarInput((prev) => (prev.length < 12 ? prev + digit : prev));
        } else if (activeNewField === 'mobile') {
          setMobileInput((prev) => (prev.length < 10 ? prev + digit : prev));
        }
      }
    },
    [activeNewField, mode, stage]
  );

  const handleBackspace = useCallback(() => {
    setError('');
    if (stage === 'otp') {
      setOtpInput((prev) => prev.slice(0, -1));
      return;
    }

    if (mode === 'mobile') {
      setMobileInput((prev) => prev.slice(0, -1));
    } else if (mode === 'abha') {
      setAbhaInput((prev) => prev.slice(0, -1));
    } else if (mode === 'new') {
      if (activeNewField === 'aadhaar') {
        setAadhaarInput((prev) => prev.slice(0, -1));
      } else if (activeNewField === 'mobile') {
        setMobileInput((prev) => prev.slice(0, -1));
      } else if (activeNewField === 'name') {
        setNewName((prev) => prev.slice(0, -1));
      }
    }
  }, [activeNewField, mode, stage]);

  const handleClear = useCallback(() => {
    setError('');
    if (stage === 'otp') {
      setOtpInput('');
      return;
    }

    if (mode === 'mobile') {
      setMobileInput('');
    } else if (mode === 'abha') {
      setAbhaInput('');
    } else if (mode === 'new') {
      if (activeNewField === 'aadhaar') {
        setAadhaarInput('');
      } else if (activeNewField === 'mobile') {
        setMobileInput('');
      } else {
        setNewName('');
      }
    }
  }, [activeNewField, mode, stage]);

  // Request OTP for initial input
  const handleRequestOTP = async () => {
    setError('');

    if (mode === 'mobile') {
      if (!validateMobile(mobileInput)) {
        setError(t.enterValidMobile || 'Please enter a valid 10-digit mobile number.');
        return;
      }
      setLoading(true);
      try {
        const res = await sendOTP(mobileInput);
        setMaskedTarget(res.maskedTarget);
        setOtpInput('');
        setStage('otp');
        setOtpResendCountdown(30);
        speak(
          t.otpSentNotice || 'OTP sent to your mobile number. Please enter the 6-digit OTP.',
          lang
        );
      } catch {
        setError(
          t.otpSendFail || 'Could not send OTP. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    } else if (mode === 'abha') {
      if (!validateABHA(abhaInput)) {
        setError(
          t.enterValidAbha || 'Please enter a valid 14-digit ABHA ID.'
        );
        return;
      }
      setLoading(true);
      try {
        const res = await sendOTP(abhaInput);
        setMaskedTarget(res.maskedTarget);
        setOtpInput('');
        setStage('otp');
        setOtpResendCountdown(30);
        speak(
          t.otpSentNotice || 'OTP sent to the mobile number registered with your ABHA ID.',
          lang
        );
      } catch {
        setError(
          t.otpSendFail || 'Could not send OTP. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    } else if (mode === 'new') {
      if (!validateAadhaar(aadhaarInput)) {
        setError(
          t.enterValidAadhaar || 'Please enter a valid 12-digit Aadhaar number.'
        );
        return;
      }
      if (!validateMobile(mobileInput)) {
        setError(
          t.enterValidMobile || 'Please enter 10-digit mobile number linked to Aadhaar.'
        );
        return;
      }
      setLoading(true);
      try {
        const res = await sendOTP(mobileInput);
        setMaskedTarget(res.maskedTarget);
        setOtpInput('');
        setStage('otp');
        setOtpResendCountdown(30);
        speak(
          t.otpSentNotice || '6-digit OTP sent to your Aadhaar-linked mobile number.',
          lang
        );
      } catch {
        setError(
          t.otpSendFail || 'Could not send OTP. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!validateOTP(otpInput)) {
      setError(
        t.enterValidOtp || 'Please enter the 6-digit OTP.'
      );
      return;
    }

    setError('');
    setLoading(true);
    try {
      const isValid = await verifyOTP(otpInput);
      if (!isValid) {
        setError(
          t.otpInvalid || 'Invalid OTP. Please check and try again.'
        );
        setLoading(false);
        return;
      }

      if (mode === 'abha') {
        const record = await fetchABHAPatient(abhaInput);
        setPatient(record);
        setStage('verified');
        speak(
          `Welcome, ${record.name}. Your ABHA ID is verified.`,
          lang
        );
      } else if (mode === 'mobile') {
        const patientData = {
          mobile: mobileInput,
          name: t.patientNameOptional?.split(' ')[0] || 'Patient',
          patientId: generatePatientId(),
          isNew: false,
          isVerified: true,
        };
        speak(
          'Mobile number successfully verified.',
          lang
        );
        onNext(patientData);
      } else if (mode === 'new') {
        const newRecord = await registerNewPatientWithAadhaar({
          aadhaar: aadhaarInput,
          mobile: mobileInput,
          name: newName,
        });
        speak(
          'Registration successful! Your new ABHA ID is generated.',
          lang
        );
        onNext(newRecord);
      }
    } catch {
      setError(
        t.verificationFailed || 'Verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpResendCountdown > 0) return;
    setError('');
    setLoading(true);
    try {
      const target = mode === 'abha' ? abhaInput : mobileInput;
      await sendOTP(target);
      setOtpResendCountdown(30);
      speak(
        'A new OTP has been dispatched.',
        lang
      );
    } catch {
      setError(
        t.otpSendFail || 'Could not resend OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyboardSubmit = useCallback(() => {
    if (stage === 'otp') {
      handleVerifyOTP();
    } else {
      handleRequestOTP();
    }
  }, [stage, otpInput, mobileInput, abhaInput, aadhaarInput, mode]);

  // Physical keyboard support for kiosk hardware
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === 'INPUT' &&
        e.target.type === 'text' &&
        mode === 'new' &&
        activeNewField === 'name'
      ) {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleKeyboardSubmit();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigitPress, handleBackspace, handleKeyboardSubmit, handleClear, mode, activeNewField, stage]);

  // Auto-submit OTP when 6 digits are reached
  useEffect(() => {
    if (stage === 'otp' && otpInput.length === 6 && !loading) {
      const timer = setTimeout(() => {
        handleVerifyOTP();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [otpInput, stage]);

  // Validation state for submit button
  const isSubmitDisabled = useMemo(() => {
    if (stage === 'otp') {
      return otpInput.length !== 6;
    }
    if (mode === 'mobile') {
      return mobileInput.length !== 10;
    }
    if (mode === 'abha') {
      return abhaInput.length !== 14;
    }
    if (mode === 'new') {
      return aadhaarInput.length !== 12 || mobileInput.length !== 10;
    }
    return true;
  }, [mode, stage, otpInput, mobileInput, abhaInput, aadhaarInput]);

  const keypadSubmitLabel = useMemo(() => {
    if (stage === 'otp') {
      return langCode === 'hi' ? 'ओटीपी सत्यापित करें' : 'Verify OTP';
    }
    if (mode === 'mobile') {
      return langCode === 'hi' ? 'ओटीपी प्राप्त करें' : 'Get OTP & Login';
    }
    if (mode === 'abha') {
      return langCode === 'hi' ? 'ओटीपी प्राप्त करें' : 'Get ABHA OTP';
    }
    return langCode === 'hi' ? 'आधार ओटीपी प्राप्त करें' : 'Get Aadhaar OTP';
  }, [stage, mode, langCode]);

  // Verified Patient Profile Screen (for ABHA)
  if (stage === 'verified' && patient) {
    return (
      <div className="screen-container animate-slide-up">
        <div className="patient-card">
          <div className="patient-avatar">
            <span style={{ fontSize: '3rem' }}>👤</span>
          </div>
          <div className="patient-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h2 className="patient-name">{patient.name}</h2>
              <span className="abha-verified-badge">
                <CheckCircle2 size={16} />
                <span>{t.verifiedAbha || 'ABDM Verified'}</span>
              </span>
            </div>
            <div className="patient-details-grid">
              <div className="pd-item">
                <span className="pd-label">{t.patientAge}</span>
                <span>{patient.age} {t.yearsOld}</span>
              </div>
              <div className="pd-item">
                <span className="pd-label">{t.patientGender}</span>
                <span>{patient.gender}</span>
              </div>
              <div className="pd-item">
                <span className="pd-label">{t.patientBlood}</span>
                <span className="blood-badge">{patient.bloodGroup}</span>
              </div>
              <div className="pd-item">
                <span className="pd-label">📱 {t.phoneLabel || 'Registered Mobile'}</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                  +91 {patient.mobile}
                </span>
              </div>
              <div className="pd-item pd-full">
                <span className="pd-label">{t.abhaNumberLabel}</span>
                <span className="abha-id-display">{patient.abhaId}</span>
              </div>
              <div className="pd-item pd-full">
                <span className="pd-label">{t.patientAddress}</span>
                <span>{patient.address}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => {
              setPatient(null);
              setStage('input');
              setOtpInput('');
              setError('');
            }}
          >
            ← {t.changeNumber || 'Change Number'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-large"
            style={{ flex: 2 }}
            onClick={() => onNext(patient)}
          >
            {t.confirmProceed || 'Confirm & Proceed →'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container screen-wide id-screen-wide animate-slide-up">
      {/* Top Bar with Back and Screen Title */}
      <div className="id-screen-topbar">
        <button
          type="button"
          className="back-btn"
          onClick={() => {
            if (stage === 'otp') {
              setStage('input');
              setOtpInput('');
              setError('');
            } else {
              onBack();
            }
          }}
          aria-label="Back"
        >
          <ArrowLeft size={16} />
          <span>{stage === 'otp' ? (t.backChangeNumber || '← Change Number') : t.backBtn}</span>
        </button>

        <div className="id-screen-heading">
          <h2 className="screen-title">
            {stage === 'otp'
              ? t.otpVerificationTitle || 'OTP Verification'
              : t.idTitle || 'Patient Identification'}
          </h2>
          <p className="screen-subtitle">
            {stage === 'otp'
              ? `${t.otpSentTo || 'Enter 6-digit OTP sent to'} ${maskedTarget}`
              : t.idSubtitle || 'Enter your details via touch keypad or speaking'}
          </p>
        </div>

        {/* Input Method Selector (Keypad / Voice / Both) */}
        <div className="id-input-modes-bar" role="group" aria-label="Input Method Selection">
          <span className="id-mode-bar-label">
            {t.inputModeLabel || 'Input Mode:'}
          </span>
          <button
            type="button"
            className={`id-input-mode-pill ${inputMethod === 'both' ? 'active' : ''}`}
            onClick={() => setInputMethod('both')}
            title="Both Touch Keypad and Voice Mic active"
          >
            <Layers size={14} />
            <span>{t.inputBothPill || 'Both (Tap + Voice)'}</span>
          </button>
          <button
            type="button"
            className={`id-input-mode-pill ${inputMethod === 'touch' ? 'active' : ''}`}
            onClick={() => setInputMethod('touch')}
            title="Manual Touchscreen Keypad Only"
          >
            <Smartphone size={14} />
            <span>{t.inputTouchPill || 'Touch Keypad'}</span>
          </button>
          <button
            type="button"
            className={`id-input-mode-pill ${inputMethod === 'voice' ? 'active' : ''}`}
            onClick={() => setInputMethod('voice')}
            title="Voice Speech Input Only"
          >
            <Mic size={14} />
            <span>{t.inputVoicePill || 'Tap to Speak'}</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs (Visible during input stage) */}
      {stage === 'input' && (
        <div className="id-mode-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'mobile'}
            className={`id-mode-tab ${mode === 'mobile' ? 'active' : ''}`}
            onClick={() => {
              setMode('mobile');
              setError('');
            }}
          >
            <Phone size={18} />
            <div className="id-tab-text">
              <span className="id-tab-title">{t.phoneLabel || 'Mobile Number'}</span>
              <span className="id-tab-sub">{t.tenDigitMobile || '10-Digit Mobile'}</span>
            </div>
            {mobileInput.length === 10 && <span className="id-tab-badge">✓</span>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'abha'}
            className={`id-mode-tab ${mode === 'abha' ? 'active' : ''}`}
            onClick={() => {
              setMode('abha');
              setError('');
            }}
          >
            <CreditCard size={18} />
            <div className="id-tab-text">
              <span className="id-tab-title">{t.abhaNumberLabel || 'ABDM Health ID'}</span>
              <span className="id-tab-sub">{t.fourteenDigitAbha || '14-Digit ABHA ID'}</span>
            </div>
            {abhaInput.length === 14 && <span className="id-tab-badge">✓</span>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'new'}
            className={`id-mode-tab ${mode === 'new' ? 'active' : ''}`}
            onClick={() => {
              setMode('new');
              setActiveNewField('aadhaar');
              setError('');
            }}
          >
            <UserPlus size={18} />
            <div className="id-tab-text">
              <span className="id-tab-title">{t.newAbha || 'Quick New Registration'}</span>
              <span className="id-tab-sub">{t.aadhaarPlusMobile || 'Aadhaar + Mobile ID'}</span>
            </div>
            {aadhaarInput.length === 12 && mobileInput.length === 10 && <span className="id-tab-badge">✓</span>}
          </button>
        </div>
      )}

      {/* Main Kiosk Layout: Left Form & Mic + Right Corner Numeric Keypad */}
      <div className="id-kiosk-layout">
        {/* Left Column: Input Displays, Segmented Progress, Speech Recognition */}
        <div className="id-left-column">
          {/* ========================================================
              STAGE 1: INITIAL DATA ENTRY (Mobile, ABHA, or Aadhaar+Mobile)
              ======================================================== */}
          {stage === 'input' && (
            <>
              {/* MOBILE NUMBER MODE */}
              {mode === 'mobile' && (
                <div className="id-display-card">
                  <div className="id-card-header">
                    <div className="id-card-tag">
                      <Phone size={16} />
                      <span>{t.mobileVerification || 'Mobile Number Verification'}</span>
                    </div>
                    <span className="id-digit-counter">
                      {mobileInput.length} / 10 {t.digitsCount || 'digits'}
                    </span>
                  </div>

                  <div className="id-input-label-row">
                    <span className="id-input-label">{t.phoneLabel || 'Mobile Number'}</span>
                    <span className="id-input-hint">
                      {inputMethod === 'voice'
                        ? t.speakDigitsHint || 'Tap mic and speak 10 digits'
                        : t.typeDigitsHint || 'Type 10 digits or speak'}
                    </span>
                  </div>

                  {/* Formatted mobile display */}
                  <div className={`id-number-display ${mobileInput.length === 10 ? 'is-complete' : ''}`}>
                    <span className="id-number-prefix">🇮🇳 +91</span>
                    <span className="id-number-value">
                      {mobileInput.length > 0 ? (
                        mobileInput.replace(/(\d{5})(\d{1,5})/, '$1 $2')
                      ) : (
                        <span className="id-number-placeholder">XXXXX XXXXX</span>
                      )}
                    </span>
                    {mobileInput.length > 0 && (
                      <button
                        type="button"
                        className="id-clear-inline"
                        onClick={handleClear}
                        title="Clear input"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Digit progress dots */}
                  <div className="id-digit-dots">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`id-digit-dot ${i < mobileInput.length ? 'filled' : ''} ${
                          i === mobileInput.length ? 'active-dot' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ABHA 14-DIGIT ID MODE */}
              {mode === 'abha' && (
                <div className="id-display-card">
                  <div className="id-card-header">
                    <div className="id-card-tag">
                      <ShieldCheck size={16} />
                      <span>{t.fourteenDigitAbha || 'ABDM Health ID (ABHA)'}</span>
                    </div>
                    <span className="id-digit-counter">
                      {abhaInput.length} / 14 {t.digitsCount || 'digits'}
                    </span>
                  </div>

                  <div className="id-input-label-row">
                    <span className="id-input-label">{t.abhaNumberLabel || '14-Digit ABHA ID'}</span>
                    <span className="id-input-hint">
                      {t.tapMicSpeakAbha || 'Type or speak 14 digits'}
                    </span>
                  </div>

                  {/* Formatted display box */}
                  <div className={`id-number-display ${abhaInput.length === 14 ? 'is-complete' : ''}`}>
                    <span className="id-number-icon">🪪</span>
                    <span className="id-number-value">
                      {abhaInput.length > 0 ? (
                        formatABHA(abhaInput)
                      ) : (
                        <span className="id-number-placeholder">91-XXXX-XXXX-XXXX</span>
                      )}
                    </span>
                    {abhaInput.length > 0 && (
                      <button
                        type="button"
                        className="id-clear-inline"
                        onClick={handleClear}
                        title="Clear input"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Digit progress dots */}
                  <div className="id-digit-dots">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div
                        key={i}
                        className={`id-digit-dot ${i < abhaInput.length ? 'filled' : ''} ${
                          i === abhaInput.length ? 'active-dot' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* QUICK NEW REGISTRATION (Aadhaar + Mobile) */}
              {mode === 'new' && (
                <div className="id-display-card">
                  <div className="id-card-header">
                    <div className="id-card-tag">
                      <UserPlus size={16} />
                      <span>{t.quickNewReg || 'Quick New Registration'}</span>
                    </div>
                    <span className="id-digit-counter">
                      {activeNewField === 'aadhaar'
                        ? `${aadhaarInput.length} / 12`
                        : `${mobileInput.length} / 10`} {t.digitsCount || 'digits'}
                    </span>
                  </div>

                  <div className="id-new-patient-fields">
                    {/* Aadhaar Field */}
                    <div
                      className={`id-field-block id-mobile-tap-box ${
                        activeNewField === 'aadhaar' ? 'is-active-target' : ''
                      }`}
                      onClick={() => setActiveNewField('aadhaar')}
                    >
                      <div className="id-input-label-row">
                        <label className="id-input-label">
                          🪪 {t.twelveDigitSub || '12-Digit Aadhaar ID'}
                        </label>
                        <span className="id-active-badge">
                          {activeNewField === 'aadhaar' ? '● Active for Keypad / Mic' : 'Tap to select'}
                        </span>
                      </div>

                      <div className={`id-number-display ${aadhaarInput.length === 12 ? 'is-complete' : ''}`}>
                        <span className="id-number-icon">🏛️</span>
                        <span className="id-number-value">
                          {aadhaarInput.length > 0 ? (
                            formatAadhaar(aadhaarInput)
                          ) : (
                            <span className="id-number-placeholder">XXXX-XXXX-XXXX</span>
                          )}
                        </span>
                        {aadhaarInput.length > 0 && (
                          <button
                            type="button"
                            className="id-clear-inline"
                            onClick={() => setAadhaarInput('')}
                            title="Clear"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Aadhaar-Linked Mobile Field */}
                    <div
                      className={`id-field-block id-mobile-tap-box ${
                        activeNewField === 'mobile' ? 'is-active-target' : ''
                      }`}
                      onClick={() => setActiveNewField('mobile')}
                    >
                      <div className="id-input-label-row">
                        <label className="id-input-label">
                          📱 {t.tenDigitSub || 'Mobile Linked to Aadhaar'}
                        </label>
                        <span className="id-active-badge">
                          {activeNewField === 'mobile' ? '● Active for Keypad / Mic' : 'Tap to select'}
                        </span>
                      </div>

                      <div className={`id-number-display ${mobileInput.length === 10 ? 'is-complete' : ''}`}>
                        <span className="id-number-prefix">🇮🇳 +91</span>
                        <span className="id-number-value">
                          {mobileInput.length > 0 ? (
                            mobileInput.replace(/(\d{5})(\d{1,5})/, '$1 $2')
                          ) : (
                            <span className="id-number-placeholder">XXXXX XXXXX</span>
                          )}
                        </span>
                        {mobileInput.length > 0 && (
                          <button
                            type="button"
                            className="id-clear-inline"
                            onClick={() => setMobileInput('')}
                            title="Clear"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Patient Name (Optional) */}
                    <div className="id-field-block">
                      <label className="id-input-label">
                        👤 {t.patientNameOptional || 'Patient Full Name (Optional)'}
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Ramesh Sharma"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onFocus={() => setActiveNewField('name')}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========================================================
              STAGE 2: 6-DIGIT OTP VERIFICATION
              ======================================================== */}
          {stage === 'otp' && (
            <div className="id-display-card otp-verification-card">
              <div className="id-card-header">
                <div className="id-card-tag otp-tag">
                  <KeyRound size={16} />
                  <span>{t.securityOtp || '6-Digit Security OTP'}</span>
                </div>
                <span className="id-digit-counter">
                  {otpInput.length} / 6 {t.digitsCount || 'digits'}
                </span>
              </div>

              <div className="otp-info-banner">
                <p className="otp-info-text">
                  {`${t.otpSentTo || 'Verification code sent to'} ${maskedTarget}. ${t.enterOtpSub || 'Please enter or speak the 6-digit OTP.'}`}
                </p>
              </div>

              {/* Segmented 6-Box OTP Display */}
              <div className="otp-boxes-wrapper">
                {Array.from({ length: 6 }).map((_, idx) => {
                  const val = otpInput[idx] || '';
                  const isCurrent = idx === otpInput.length;
                  return (
                    <div
                      key={idx}
                      className={`otp-digit-box ${val ? 'has-val' : ''} ${isCurrent ? 'is-active' : ''}`}
                    >
                      {val ? '•' : ''}
                    </div>
                  );
                })}
              </div>

              {/* Resend and Countdown Controls */}
              <div className="otp-action-row">
                <button
                  type="button"
                  className="btn btn-secondary otp-resend-btn"
                  onClick={handleResendOTP}
                  disabled={otpResendCountdown > 0 || loading}
                >
                  <RefreshCw size={14} className={loading ? 'spin' : ''} />
                  <span>
                    {otpResendCountdown > 0
                      ? `${t.resendIn || 'Resend in'} ${otpResendCountdown}s`
                      : t.resendOtpBtn || 'Resend OTP'}
                  </span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary otp-change-btn"
                  onClick={() => {
                    setStage('input');
                    setOtpInput('');
                    setError('');
                  }}
                >
                  ← {t.changeNumber || 'Change Number'}
                </button>
              </div>
            </div>
          )}

          {/* Validation or API Error Alert */}
          {error && (
            <div className="id-error-alert animate-shake" role="alert">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* ========================================================
              INTEGRATED TAP-TO-SPEAK VOICE SECTION (When 'both' or 'voice' selected)
              ======================================================== */}
          {(inputMethod === 'both' || inputMethod === 'voice') && (
            <div className={`id-voice-capture-panel ${isListening ? 'listening-active' : ''}`}>
              <div className="id-voice-capture-header">
                <div className="id-voice-title-wrap">
                  <span className="voice-mic-icon">🎙️</span>
                  <div>
                    <h4 className="id-voice-title">
                      {t.speakNumberTitle || 'Speak Your Number'}
                    </h4>
                    <span className="id-voice-sub">
                      {stage === 'otp'
                        ? t.tapMicSpeakOtp || 'Tap mic and speak 6-digit OTP'
                        : mode === 'mobile'
                        ? t.tapMicSpeakMobile || 'Tap mic and speak 10-digit mobile'
                        : mode === 'abha'
                        ? t.tapMicSpeakAbha || 'Tap mic and speak 14-digit ABHA'
                        : t.tapMicSpeakAadhaar || 'Tap mic and speak Aadhaar/Mobile'}
                    </span>
                  </div>
                </div>

                <span className="id-lang-pill">🌐 {language?.nativeName || 'Language'}</span>
              </div>

              {/* Modern Studio Microphone Action */}
              <div className="id-voice-mic-wrap">
                <ModernMic
                  isListening={isListening}
                  onToggle={handleMicToggle}
                  onClick={handleMicToggle}
                  error={micError}
                  labelIdle={t.micIdle || 'Tap to speak numbers'}
                  labelListening={t.micListening || 'Listening... Speak digits clearly'}
                  labelSpeaking={t.micProcessing || 'Processing...'}
                  compact={true}
                />
              </div>

              {/* Real-time speech transcript feedback */}
              {(liveVoiceTranscript || lastSpokenTranscript) && (
                <div className="id-speech-transcript animate-fade-in">
                  <span className="transcript-label">{t.heard || 'Heard:'}</span>
                  <span className="transcript-text">"{liveVoiceTranscript || lastSpokenTranscript}"</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Dedicated Kiosk Touch Number Pad */}
        <div className={`id-right-column ${inputMethod === 'voice' ? 'visually-soft' : ''}`}>
          <KioskNumericKeypad
            onKeyPress={handleDigitPress}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onSubmit={handleKeyboardSubmit}
            disabled={loading}
            submitDisabled={isSubmitDisabled}
            submitLabel={keypadSubmitLabel}
            submitLoading={loading}
            clearLabel={t.keypadClear || 'Clear'}
            deleteLabel={t.keypadDelete || 'Delete'}
            title={
              stage === 'otp'
                ? t.otpKeypadTitle || 'OTP Keypad'
                : t.touchKeypadTitle || 'Touch Keypad'
            }
            subtitle={
              stage === 'otp'
                ? t.enterOtpSub || 'Enter 6-digit OTP'
                : mode === 'mobile'
                ? t.tenDigitSub || '10-digit mobile number'
                : mode === 'abha'
                ? t.fourteenDigitSub || '14-digit ABHA ID'
                : activeNewField === 'aadhaar'
                ? t.twelveDigitSub || '12-digit Aadhaar ID'
                : t.tenDigitSub || '10-digit mobile number'
            }
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(IdentificationScreen);
