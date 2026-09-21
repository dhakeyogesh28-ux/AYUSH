import React, { useState, useMemo, useEffect } from 'react';
import { getTranslation } from '../../data/translations';

const RedFlagAlert = ({ flags, language, onDismiss, onConfirmEmergency }) => {
  const [dismissedFlags, setDismissedFlags] = useState(null);
  const t = useMemo(() => getTranslation(language?.code || 'en'), [language]);

  const hasFlags = Boolean(flags && flags.length > 0);
  const isVisible = hasFlags && dismissedFlags !== flags;
  const topFlag = flags?.[0];
  const isCritical = topFlag?.priority === 'CRITICAL';

  // Sound alert beep when emergency modal pops up
  useEffect(() => {
    if (isVisible && topFlag && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch {
        // Ignore audio auto-play policy error
      }
    }
  }, [isVisible, topFlag]);

  if (!isVisible || !topFlag) return null;

  return (
    <div
      className="red-flag-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-label={t.emergencyTitle || 'EMERGENCY ALERT'}
    >
      <div className={`red-flag-modal ${isCritical ? 'critical' : 'high'}`}>
        {/* Pulsing beacon */}
        <div className="red-flag-beacon">
          <div className="beacon-ring" />
          <div className="beacon-ring delay-1" />
          <div className="beacon-core">🚨</div>
        </div>

        <div className="red-flag-badge">
          {t.emergencyTitle || 'EMERGENCY ALERT DETECTED / आपातकालीन चेतावनी'}
        </div>

        <h2 className="red-flag-title">{topFlag.title}</h2>
        <p className="red-flag-description">{topFlag.description}</p>

        <div className="red-flag-action-box">
          <span className="action-label">
            {t.emergencySub || 'Immediate Triage Protocol / आवश्यक आपातकालीन कार्रवाई:'}
          </span>
          <p>{topFlag.action}</p>
        </div>

        {flags.length > 1 && (
          <div className="red-flag-additional">
            <span>+{flags.length - 1} additional emergency indicator(s) detected</span>
          </div>
        )}

        <div className="red-flag-buttons">
          <button
            className="rfb-emergency"
            onClick={() => {
              onConfirmEmergency?.(topFlag);
              setDismissedFlags(flags);
            }}
          >
            {t.notifyEmergencyBtn || '🚨 Alert Emergency Team / आपातकालीन टीम को सूचित करें'}
          </button>
          <button
            className="rfb-continue"
            onClick={() => {
              setDismissedFlags(flags);
              onDismiss?.();
            }}
          >
            {t.continueNotEmergencyBtn || 'Continue Consultation (Not Emergency)'}
          </button>
        </div>

        <p className="red-flag-timestamp">
          Detected at: {new Date().toLocaleTimeString('en-IN')} | Ayush AI Clinical Safety Guard
        </p>
      </div>
    </div>
  );
};

export default React.memo(RedFlagAlert);
