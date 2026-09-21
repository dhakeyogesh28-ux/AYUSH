import React, { useState, useCallback, useRef } from 'react';
import { Delete, RotateCcw, CheckCircle2, Volume2, VolumeX } from 'lucide-react';

// Lightweight Web Audio click sound for tactile kiosk touchscreen feedback
function playKioskTapSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  } catch {
    // AudioContext blocked or not supported - silently ignore
  }
}

const KEYS = [
  { val: '1', sub: ' ' },
  { val: '2', sub: 'ABC' },
  { val: '3', sub: 'DEF' },
  { val: '4', sub: 'GHI' },
  { val: '5', sub: 'JKL' },
  { val: '6', sub: 'MNO' },
  { val: '7', sub: 'PQRS' },
  { val: '8', sub: 'TUV' },
  { val: '9', sub: 'WXYZ' },
  { val: 'clear', label: 'C', sub: 'Clear', isSpecial: true },
  { val: '0', sub: '+' },
  { val: 'backspace', sub: 'Delete', isSpecial: true },
];

export default function KioskNumericKeypad({
  onKeyPress,
  onBackspace,
  onClear,
  onSubmit,
  disabled = false,
  submitDisabled = false,
  submitLabel = 'Verify & Proceed',
  submitLoading = false,
  title = 'Touch Number Pad',
  subtitle = 'Tap digits to enter number',
  clearLabel = 'Clear',
  deleteLabel = 'Delete',
}) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const backspaceTimerRef = useRef(null);

  const handleKey = useCallback(
    (key) => {
      if (disabled) return;
      if (soundEnabled) playKioskTapSound();

      if (key.val === 'clear') {
        onClear?.();
      } else if (key.val === 'backspace') {
        onBackspace?.();
      } else {
        onKeyPress?.(key.val);
      }
    },
    [disabled, soundEnabled, onClear, onBackspace, onKeyPress]
  );

  const handleBackspaceMouseDown = () => {
    if (disabled) return;
    handleKey({ val: 'backspace' });
    backspaceTimerRef.current = setInterval(() => {
      onBackspace?.();
    }, 120);
  };

  const handleBackspaceMouseUp = () => {
    if (backspaceTimerRef.current) {
      clearInterval(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    }
  };

  return (
    <div className="kiosk-keypad-panel">
      <div className="kiosk-keypad-header">
        <div className="kiosk-keypad-title-wrap">
          <span className="kiosk-keypad-icon">⌨️</span>
          <div>
            <h4 className="kiosk-keypad-title">{title}</h4>
            <span className="kiosk-keypad-sub">{subtitle}</span>
          </div>
        </div>
        <button
          type="button"
          className={`kiosk-sound-toggle ${soundEnabled ? 'active' : ''}`}
          onClick={() => setSoundEnabled((prev) => !prev)}
          title={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
          aria-label="Toggle keypad click sound"
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      <div className="kiosk-numpad-grid">
        {KEYS.map((k) => {
          if (k.val === 'backspace') {
            return (
              <button
                key="backspace"
                type="button"
                className="kiosk-num-key kiosk-key-backspace"
                disabled={disabled}
                onMouseDown={handleBackspaceMouseDown}
                onMouseUp={handleBackspaceMouseUp}
                onMouseLeave={handleBackspaceMouseUp}
                onTouchStart={handleBackspaceMouseDown}
                onTouchEnd={handleBackspaceMouseUp}
                aria-label="Backspace"
              >
                <Delete size={24} className="kiosk-key-icon" />
                <span className="kiosk-key-sub">{deleteLabel}</span>
              </button>
            );
          }

          if (k.val === 'clear') {
            return (
              <button
                key="clear"
                type="button"
                className="kiosk-num-key kiosk-key-clear"
                disabled={disabled}
                onClick={() => handleKey(k)}
                aria-label="Clear all"
              >
                <RotateCcw size={20} className="kiosk-key-icon" />
                <span className="kiosk-key-sub">{clearLabel}</span>
              </button>
            );
          }

          return (
            <button
              key={k.val}
              type="button"
              className="kiosk-num-key"
              disabled={disabled}
              onClick={() => handleKey(k)}
              aria-label={`Digit ${k.val}`}
            >
              <span className="kiosk-key-num">{k.val}</span>
              {k.sub && <span className="kiosk-key-sub">{k.sub}</span>}
            </button>
          );
        })}
      </div>

      {onSubmit && (
        <button
          type="button"
          className="kiosk-keypad-submit-btn"
          disabled={disabled || submitDisabled || submitLoading}
          onClick={() => {
            if (soundEnabled) playKioskTapSound();
            onSubmit?.();
          }}
        >
          {submitLoading ? (
            <span className="loading-spinner">⏳ Fetching...</span>
          ) : (
            <>
              <CheckCircle2 size={20} />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
