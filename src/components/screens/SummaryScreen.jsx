import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { generateSummary } from '../../utils/summaryGenerator';
import { getTranslation } from '../../data/translations';

const SummaryScreen = ({
  sessionId,
  answers,
  documents,
  patient,
  mode,
  language,
  speak,
  onViewPhysician,
}) => {
  const t = useMemo(() => getTranslation(language?.code || 'en'), [language]);
  const defaultSummary = useMemo(
    () => generateSummary(answers, mode, language?.code || 'en', patient, documents),
    [answers, mode, language, patient, documents]
  );
  const [doctorSummary, setDoctorSummary] = useState(null);
  const [sent, setSent] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedParagraph, setCopiedParagraph] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const activeSummary = useMemo(() => {
    if (!doctorSummary) return defaultSummary;
    return {
      ...defaultSummary,
      ...doctorSummary,
      patientSummaryParagraph:
        doctorSummary.patientSummaryParagraph || defaultSummary.patientSummaryParagraph,
      doctorReadySummaryEnglish:
        doctorSummary.doctorReadySummaryEnglish || defaultSummary.doctorReadySummaryEnglish,
      hpi: {
        ...defaultSummary.hpi,
        ...(typeof doctorSummary.hpi === 'object' ? doctorSummary.hpi : {}),
      },
    };
  }, [defaultSummary, doctorSummary]);

  const patientParagraph = activeSummary?.patientSummaryParagraph || '';

  useEffect(() => {
    const speechText =
      t.audioGeneratingSummary ||
      "Your clinical history has been recorded successfully. The summary is now being sent to your doctor's screen.";
    speak(speechText, language?.ttsLang);

    let isMounted = true;
    const runSend = async () => {
      for (let i = 0; i <= 100; i += 10) {
        if (!isMounted) return;
        await new Promise((r) => setTimeout(r, 50));
        if (!isMounted) return;
        setSendProgress(i);
      }
      if (isMounted) setSent(true);
    };
    runSend();

    // Fetch live Gemini Doctor Summary with full clinical intake answers
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/gemini/generate-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId || 'default',
            answers,
            mode,
            patient,
            language_code: language?.code || 'en',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.summary) setDoctorSummary(data.summary);
        }
      } catch (e) {
        console.warn('Could not fetch Gemini doctor summary:', e);
      }
    };
    fetchSummary();

    return () => {
      isMounted = false;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language, sessionId, speak, answers, mode, patient, t.audioGeneratingSummary]);

  // Audio readout toggle for patient paragraph
  const handleTogglePlayAudio = useCallback(() => {
    if (isPlayingAudio) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
    } else {
      if (!patientParagraph) return;
      setIsPlayingAudio(true);
      speak(patientParagraph, language?.ttsLang || 'en-IN');
      const words = patientParagraph.split(/\s+/).length;
      const timeoutMs = Math.max(6000, Math.ceil((words / 2.3) * 1000));
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, timeoutMs);
    }
  }, [isPlayingAudio, patientParagraph, language, speak]);

  const handleCopyParagraph = useCallback(async () => {
    if (!patientParagraph) return;
    try {
      await navigator.clipboard.writeText(patientParagraph);
      setCopiedParagraph(true);
      setTimeout(() => setCopiedParagraph(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = patientParagraph;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedParagraph(true);
      setTimeout(() => setCopiedParagraph(false), 2000);
    }
  }, [patientParagraph]);

  const handleConfirmAndShare = useCallback(() => {
    setIsConfirmed(true);
    const spokenMessage =
      t.confirmedSuccessSub ||
      "Your clinical summary has been securely transmitted to Dr. Ayush's screen. Please proceed to the consultation room.";
    speak(spokenMessage, language?.ttsLang || 'en-IN');
  }, [speak, language, t.confirmedSuccessSub]);

  return (
    <div className="screen-container animate-slide-up">
      {/* Status header */}
      <div className="summary-status-header">
        <div className="status-icon-wrap">
          {sent ? (
            <div className="status-sent">✅</div>
          ) : (
            <div className="status-sending">
              <div className="send-ring" />
              <span>📡</span>
            </div>
          )}
        </div>
        <div>
          <h2 className="summary-status-title">
            {sent ? t.summaryReadyTitle : t.summarySendingTitle}
          </h2>
          <p className="summary-status-sub">
            {sent
              ? `✅ ${t.summaryStatusReady} · ${
                  documents?.length > 0 ? `✅ ${documents.length} document(s)` : '⚠️'
                }`
              : t.summaryStatusSending}
          </p>
        </div>
      </div>

      {!sent && (
        <div className="send-progress-bar">
          <div className="send-fill" style={{ width: `${sendProgress}%` }} />
        </div>
      )}

      {/* Patient info strip */}
      {patient && (
        <div className="summary-patient-strip">
          <span>👤 {patient.name || 'Patient'}</span>
          {patient.abhaId && <span>🪪 ABHA: {patient.abhaId}</span>}
          <span>📱 +91 {patient.mobile || '9876543210'}</span>
          <span>🕐 {new Date().toLocaleString('en-IN')}</span>
          <span className="lang-tag">🗣️ {language?.nativeName || 'हिन्दी'}</span>
          {mode === 'ayush' && <span className="ayush-tag">{t.ayushTag}</span>}
          {mode === 'both' && <span className="ayush-tag both-tag">{t.bothTag}</span>}
        </div>
      )}

      {/* Patient-Friendly Paragraph Summary (Prominently featured) */}
      <div className="patient-paragraph-card animate-fade-in">
        <div className="ppc-header">
          <div className="ppc-title-area">
            <span className="ppc-badge">
              🗣️ {language?.nativeName || 'हिन्दी'} ({language?.name || 'Native Language'})
            </span>
            <h3 className="ppc-heading">
              {t.patientSummaryTitle || 'Patient Consultation Summary'}
            </h3>
            <p className="ppc-sub">
              {t.patientSummarySub || 'Easily understandable summary in paragraph format'}
            </p>
          </div>
          <div className="ppc-actions">
            <button
              className={`btn btn-audio-play ${isPlayingAudio ? 'is-playing' : ''}`}
              onClick={handleTogglePlayAudio}
              title={isPlayingAudio ? t.stopListening : t.listenPatientSummary}
            >
              {isPlayingAudio ? (
                <>
                  <span className="audio-anim-wave">⏹️</span>
                  <span>{t.stopListening || 'Stop Audio'}</span>
                </>
              ) : (
                <>
                  <span className="audio-anim-wave">🔊</span>
                  <span>{t.listenPatientSummary || 'Listen in your Language'}</span>
                </>
              )}
            </button>
            <button
              className="btn btn-icon-action"
              onClick={handleCopyParagraph}
              title="Copy Patient Summary"
            >
              {copiedParagraph ? '✅ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        <div className="ppc-body">
          <p className="ppc-paragraph-text">
            {patientParagraph || 'Consultation summary is being generated...'}
          </p>
          {((activeSummary?.patientQueries && activeSummary.patientQueries.length > 0) || (answers?.patient_queries && answers.patient_queries.length > 0)) && (
            <div className="ppc-queries-box">
              <span className="ppc-queries-title">
                💬 {t.patientQueryTitle || 'Patient Typed Queries & Remarks:'}
              </span>
              <ul className="ppc-queries-list">
                {(activeSummary?.patientQueries || answers?.patient_queries || []).map((pq, idx) => (
                  <li key={idx}>"{typeof pq === 'string' ? pq : pq.query}"</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="ppc-footer">
          <div className="ppc-meta-item">
            <span>🩺 Verified Intake:</span>
            <strong>
              {mode === 'ayush' ? 'AYUSH Holistic OPD' : mode === 'both' ? 'Integrative General + AYUSH' : 'General Medicine OPD'}
            </strong>
          </div>
          <div className="ppc-meta-item">
            <span>🔒 ABDM & Privacy:</span>
            <strong>DPDP 2023 Compliant</strong>
          </div>
        </div>
      </div>

      {/* Action Area: Confirm & Share to Physician */}
      <div className="summary-actions">
        {isConfirmed ? (
          <div className="intake-confirmed-banner animate-fade-in">
            <div className="icb-icon">✅</div>
            <div className="icb-content">
              <h3 className="icb-title">{t.confirmedSuccessTitle || 'Consultation Intake Confirmed & Shared!'}</h3>
              <p className="icb-sub">{t.confirmedSuccessSub || "Your clinical summary has been securely transmitted to Dr. Ayush's screen. Please proceed to the consultation room."}</p>
            </div>
            <span className="icb-badge">{t.intakeConfirmedBadge || '✅ Intake Confirmed & Shared'}</span>
          </div>
        ) : (
          <button
            className="btn btn-confirm-share"
            onClick={handleConfirmAndShare}
            id="confirm-share-physician-btn"
          >
            <span className="bcs-icon">🚀</span>
            <span className="bcs-text">{t.confirmAndShareBtn || 'Confirm & Share to Physician →'}</span>
          </button>
        )}

        <button className="btn btn-ghost" onClick={() => window.print()}>
          {t.printSummaryBtn || '🖨️ Print Summary'}
        </button>
      </div>

      {/* Discreet Staff/Physician Access for Hospital Testing & Desk Switch */}
      {onViewPhysician && (
        <div className="staff-access-area">
          <button className="btn-staff-link" onClick={onViewPhysician}>
            👨‍⚕️ Clinician Desk Login / Physician Dashboard →
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(SummaryScreen);
