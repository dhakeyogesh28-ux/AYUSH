import React, { memo } from 'react';

/**
 * ModernMic — Rock-Solid, Non-Fluctuating Clinical Microphone Component
 * Supports both onToggle and onClick handlers, handles error states gracefully,
 * and provides clear tactile feedback for kiosk patients.
 */
const ModernMic = ({
  isListening = false,
  isAiSpeaking = false,
  onToggle,
  onClick,
  disabled = false,
  error = null,
  labelIdle = 'Tap to speak',
  labelListening = 'Listening... Tap when done',
  labelSpeaking = 'AI Doctor is speaking...',
  compact = false,
}) => {
  const handleToggle = onToggle || onClick;

  const currentMode = error
    ? 'error'
    : isListening
    ? 'listening'
    : isAiSpeaking
    ? 'speaking'
    : 'idle';

  return (
    <div className={`solid-mic-wrapper mode-${currentMode} ${compact ? 'compact' : ''}`}>
      {/* Ambient Breathing Aura */}
      <div className={`mic-halo-ring ${currentMode}`}>
        <div className="mic-halo-inner" />
      </div>

      {/* Dynamic Soundwave Rings when listening */}
      {isListening && (
        <div className="mic-ripple-rings" aria-hidden="true">
          <span className="mic-ripple r1" />
          <span className="mic-ripple r2" />
          <span className="mic-ripple r3" />
        </div>
      )}

      {/* Main Microphone Action Button */}
      <button
        type="button"
        className={`solid-mic-button ${currentMode} ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-label={
          error
            ? error
            : isListening
            ? labelListening
            : isAiSpeaking
            ? labelSpeaking
            : labelIdle
        }
      >
        {/* Steady Crisp Studio Microphone Icon */}
        <svg
          className="solid-mic-svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>

        {/* Dynamic status beacon overlay */}
        {isListening && <span className="mic-live-beacon" />}
      </button>

      {/* High-Visibility State Pill */}
      <div className={`solid-mic-pill ${currentMode}`}>
        <span className={`pill-beacon ${currentMode}`} />
        <span className="pill-text">
          {error
            ? '⚠️ Mic error / tap to retry'
            : isListening
            ? labelListening
            : isAiSpeaking
            ? labelSpeaking
            : labelIdle}
        </span>
      </div>

      {/* Error message banner */}
      {error && (
        <div className="mic-error-bubble animate-fade-in" onClick={handleToggle} style={{ cursor: 'pointer' }}>
          <span>⚠️ {error} (Tap to retry)</span>
        </div>
      )}
    </div>
  );
};

export default memo(ModernMic);
