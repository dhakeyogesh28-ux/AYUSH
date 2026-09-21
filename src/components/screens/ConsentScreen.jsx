import React, { useEffect, useState, useMemo } from 'react';
import { getTranslation } from '../../data/translations';

const ConsentScreen = ({ onAgree, onDecline, speak, patient, language }) => {
  const [checkedAll, setCheckedAll] = useState(false);
  const [animIdx, setAnimIdx] = useState(0);

  const t = useMemo(() => getTranslation(language?.code || 'en'), [language]);
  const lang = language?.ttsLang || 'en-IN';
  const consentItems = t.consentItems || [];

  useEffect(() => {
    speak(
      t.consentSubtitle ||
        'We need your permission to record your health information securely. Please review the consent items.',
      lang
    );
    const timer = setInterval(() => {
      setAnimIdx((prev) => {
        if (prev >= consentItems.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 120);
    return () => clearInterval(timer);
  }, [consentItems.length, lang, speak, t.consentSubtitle]);

  return (
    <div className="screen-container animate-slide-up">
      <div className="screen-header">
        <div className="consent-shield">🛡️</div>
        <h2 className="screen-title">{t.consentTitle}</h2>
        <p className="screen-subtitle">
          {patient?.name ? `${patient.name}, ` : ''}
          {t.consentSubtitle}
        </p>
      </div>

      <div className="consent-legal-badge">
        <span>{t.consentLegal}</span>
      </div>

      <div className="consent-list">
        {consentItems.map((item, idx) => (
          <div
            key={idx}
            className={`consent-item ${idx <= animIdx ? 'visible' : ''}`}
            style={{ transitionDelay: `${idx * 0.1}s` }}
          >
            <span className="consent-item-icon">{item.icon}</span>
            <div className="consent-item-text">
              <div className="consent-item-title">{item.title}</div>
              <div className="consent-item-desc">{item.desc}</div>
            </div>
            <div className="consent-check">✓</div>
          </div>
        ))}
      </div>

      <div className="consent-toggle-row">
        <label className="toggle-label" htmlFor="consent-all">
          <input
            id="consent-all"
            type="checkbox"
            className="consent-checkbox"
            checked={checkedAll}
            onChange={(e) => setCheckedAll(e.target.checked)}
          />
          <span className="toggle-custom" />
          <span>{t.consentCheckAll}</span>
        </label>
      </div>

      <div className="consent-buttons">
        <button
          className="btn btn-primary btn-large"
          disabled={!checkedAll}
          onClick={onAgree}
        >
          {t.agreeConsentBtn}
        </button>
        <button className="btn btn-ghost" onClick={onDecline}>
          {t.declineConsentBtn}
        </button>
      </div>

      <p className="consent-note">{t.consentAudioNote}</p>
    </div>
  );
};

export default React.memo(ConsentScreen);
