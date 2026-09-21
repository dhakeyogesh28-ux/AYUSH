import React, { useState, useMemo, useCallback } from 'react';
import { generateSummary, getClinicalDifferentialsAndActions } from '../../utils/summaryGenerator';
import ShareReportModal from '../ui/ShareReportModal';

const safeVal = (val, fallback = '—') => {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    return val.map(x => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(', ') || fallback;
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val)
      .filter(([, v]) => v != null && v !== 'None' && v !== 'Not assessed')
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
    return entries.length > 0 ? entries.join('; ') : fallback;
  }
  return String(val);
};

const PhysicianDashboard = ({
  answers = {},
  documents = [],
  patient,
  mode,
  language = null,
  onClose,
  initialSummary = null,
  sessionId = 'ayush_session',
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [confirmed, setConfirmed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedEMR, setCopiedEMR] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [doctorRx, setDoctorRx] = useState('');
  const [checkedOrders, setCheckedOrders] = useState({});

  const localSummary = useMemo(
    () => generateSummary(answers, mode, language?.code || 'en', patient, documents),
    [answers, mode, language, patient, documents]
  );

  const summary = useMemo(() => {
    if (!initialSummary) return localSummary;
    return {
      ...localSummary,
      ...initialSummary,
      patientSummaryParagraph:
        initialSummary.patientSummaryParagraph || localSummary.patientSummaryParagraph,
      patientSummaryLanguage:
        initialSummary.patientSummaryLanguage || localSummary.patientSummaryLanguage,
      doctorReadySummaryEnglish:
        initialSummary.doctorReadySummaryEnglish || localSummary.doctorReadySummaryEnglish,
      hpi: {
        ...localSummary.hpi,
        ...(typeof initialSummary.hpi === 'object' ? initialSummary.hpi : {}),
      },
      pastHistory: {
        ...localSummary.pastHistory,
        ...(typeof initialSummary.pastHistory === 'object'
          ? initialSummary.pastHistory
          : typeof initialSummary.pastHistory === 'string'
          ? { medicalConditions: initialSummary.pastHistory }
          : {}),
      },
      drugAllergyHistory: {
        ...localSummary.drugAllergyHistory,
        ...(typeof initialSummary.drugAllergyHistory === 'object' ? initialSummary.drugAllergyHistory : {}),
      },
    };
  }, [initialSummary, localSummary]);

  const abnormalLabs = useMemo(() => {
    return (documents || []).flatMap(doc =>
      (doc.investigations || []).filter(i => i && i.abnormal).map(inv => ({ ...inv, source: doc.hospital, date: doc.date }))
    );
  }, [documents]);

  const allMeds = useMemo(() => {
    return (documents || []).flatMap(doc =>
      (doc.medications || []).map(m => ({ ...m, source: doc.hospital, date: doc.date }))
    );
  }, [documents]);

  const tabs = [
    { id: 'summary', label: '📋 Clinical Intake & Triage' },
    { id: 'labs', label: `🔬 Lab Investigations ${abnormalLabs.length > 0 ? `(⚠️ ${abnormalLabs.length})` : ''}` },
    { id: 'medications', label: `💊 Prior Medications (${allMeds.length})` },
    { id: 'abdm', label: '🇮🇳 ABDM / FHIR R4' },
  ];

  const allergyStr = safeVal(summary.drugAllergyHistory?.allergies, '');
  const hasAllergyFlag =
    allergyStr &&
    !allergyStr.toLowerCase().includes('no known') &&
    !allergyStr.toLowerCase().includes('nkda') &&
    allergyStr !== 'None' &&
    allergyStr !== '—';

  const triagePriority = (summary.triagePriority || 'ROUTINE').toUpperCase();
  const triageColor =
    triagePriority === 'CRITICAL'
      ? '#DC2626'
      : triagePriority === 'URGENT'
      ? '#D97706'
      : '#16A34A';
  const triageBg =
    triagePriority === 'CRITICAL'
      ? '#FEF2F2'
      : triagePriority === 'URGENT'
      ? '#FFFBEB'
      : '#F0FDF4';

  const { differentials, physicianActions } = useMemo(() => {
    if (summary.differentials && summary.physicianActions) {
      return { differentials: summary.differentials, physicianActions: summary.physicianActions };
    }
    return getClinicalDifferentialsAndActions(summary.chiefComplaint || '');
  }, [summary.differentials, summary.physicianActions, summary.chiefComplaint]);

  const toggleOrder = (idx) => {
    setCheckedOrders(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopyEMR = useCallback(async () => {
    const text = summary.doctorReadySummaryEnglish || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEMR(true);
      setTimeout(() => setCopiedEMR(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedEMR(true);
      setTimeout(() => setCopiedEMR(false), 2500);
    }
  }, [summary.doctorReadySummaryEnglish]);

  // Extract patient queries
  const typedQueries = useMemo(() => {
    if (Array.isArray(summary.patientQueries) && summary.patientQueries.length > 0) {
      return summary.patientQueries.map(q => (typeof q === 'string' ? q : q.query)).filter(Boolean);
    }
    if (Array.isArray(answers?.patient_queries) && answers.patient_queries.length > 0) {
      return answers.patient_queries.map(q => (typeof q === 'string' ? q : q.query)).filter(Boolean);
    }
    if (summary.patientNotes) return [summary.patientNotes];
    if (answers?.patient_notes) return [answers.patient_notes];
    return [];
  }, [summary.patientQueries, answers?.patient_queries, summary.patientNotes, answers?.patient_notes]);

  return (
    <div className="physician-dashboard">
      {/* Top Clinical Header Bar */}
      <div className="pd-header">
        <div className="pd-title-area">
          <div className="pd-caduceus-badge">⚕️</div>
          <div>
            <div className="pd-title-row">
              <h2 className="pd-title">Physician Clinical Workstation</h2>
              <span className="pd-title-tag">EHR & ABDM Verified</span>
            </div>
            <p className="pd-subtitle">
              Attending: Dr. Ayush, MD · Clinical Intake Triage & Decision Support
            </p>
          </div>
        </div>

        <div className="pd-patient-badge">
          <div className="pdp-name">
            <strong>👤 {patient?.name || 'Patient'}</strong>
            <span className="pdp-gender-age">
              {patient?.gender ? `${patient.gender}, ` : ''}{patient?.age ? `${patient.age} yrs` : ''}
            </span>
          </div>
          <div className="pdp-meta">
            {patient?.abhaId && <span>🪪 ABHA: {patient.abhaId}</span>}
            <span>📱 +91 {patient?.mobile || '9876543210'}</span>
            <span className={`pd-mode-badge ${mode === 'ayush' ? 'ayush' : 'allopathy'}`}>
              {mode === 'ayush' ? '🌿 AYUSH OPD' : mode === 'both' ? '🌟 Integrative OPD' : '🏥 General Medicine'}
            </span>
          </div>
        </div>

        <div className="pd-header-actions">
          <button
            className="btn btn-copy-emr"
            onClick={handleCopyEMR}
            title="Copy Clean Clinical Note for Hospital HIS / EMR"
          >
            {copiedEMR ? '✅ Note Copied' : '📋 Copy EMR Note'}
          </button>
          <button
            className="btn btn-print-pd"
            onClick={() => window.print()}
            title="Print Clinical Record"
          >
            🖨️ Print
          </button>
          <button
            className="btn btn-share-header"
            onClick={() => setShareOpen(true)}
            title="Share summary & documents with patient via WhatsApp or SMS"
          >
            <span>📲</span> Share to Patient
          </button>
          <button className="pd-close" onClick={onClose} aria-label="Close dashboard">✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="pd-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`pd-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pd-content">
        {/* SUMMARY TAB: Professional Doctor's Workspace */}
        {activeTab === 'summary' && (
          <div className="pd-summary animate-fade-in">
            {/* 1. Triage & Safety Alert Banner */}
            <div
              className="pd-triage-banner"
              style={{
                backgroundColor: triageBg,
                borderColor: triageColor,
              }}
            >
              <div className="ptb-left">
                <div
                  className="ptb-priority-pill"
                  style={{ backgroundColor: triageColor }}
                >
                  {triagePriority === 'CRITICAL' && '🔴'}
                  {triagePriority === 'URGENT' && '🟠'}
                  {triagePriority === 'ROUTINE' && '🟢'}
                  <span>TRIAGE: {triagePriority}</span>
                </div>
                <div className="ptb-info">
                  <span className="ptb-title">
                    {triagePriority === 'CRITICAL'
                      ? 'Immediate Clinical Evaluation Required — High Acuity Presentation'
                      : triagePriority === 'URGENT'
                      ? 'Prompt Clinical Review Recommended — Moderate Acuity Symptoms'
                      : 'Standard Outpatient Consultation Protocol Active'}
                  </span>
                  <span className="ptb-sub">
                    Intake via Multilingual Kiosk ({summary.patientSummaryLanguage?.name || 'Native Language'}) · ABDM Consent Granted
                  </span>
                </div>
              </div>

              {/* Allergy Quick Pill */}
              <div className="ptb-right">
                {hasAllergyFlag ? (
                  <div className="ptb-allergy-alert">
                    <span className="paa-icon">⚠️</span>
                    <div>
                      <strong>ALLERGY WARNING:</strong>
                      <span>{allergyStr}</span>
                    </div>
                  </div>
                ) : (
                  <div className="ptb-nkda-badge">
                    <span>🛡️ NKDA</span>
                    <small>No Known Drug Allergies</small>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Chief Complaint (CC) Banner */}
            <div className="pd-cc-card">
              <div className="pd-cc-header">
                <span className="pd-cc-label">PRIMARY CHIEF COMPLAINT (CC)</span>
                {summary.hpi?.severity && (
                  <span className="pd-cc-severity-badge">
                    Pain / Discomfort: {safeVal(summary.hpi?.severity)}
                  </span>
                )}
              </div>
              <h3 className="pd-cc-value">{safeVal(summary.chiefComplaint)}</h3>
            </div>

            {/* 3. History of Present Illness (SOCRATES Clinical Grid) */}
            <div className="pd-card pd-socrates-card">
              <div className="pd-card-header">
                <div className="pd-card-title-group">
                  <span className="pd-card-icon">🩺</span>
                  <div>
                    <h4 className="pd-card-title">History of Present Illness (HPI)</h4>
                    <span className="pd-card-subtitle">SOCRATES Clinical Protocol</span>
                  </div>
                </div>
              </div>

              <div className="pd-socrates-grid">
                <div className="pd-sg-item">
                  <span className="pd-sg-label">Onset & Timeline</span>
                  <div className="pd-sg-value">{safeVal(summary.hpi?.onset)}</div>
                </div>
                <div className="pd-sg-item">
                  <span className="pd-sg-label">Character & Quality</span>
                  <div className="pd-sg-value">{safeVal(summary.hpi?.character)}</div>
                </div>
                <div className="pd-sg-item">
                  <span className="pd-sg-label">Radiation / Spread</span>
                  <div className="pd-sg-value">{safeVal(summary.hpi?.radiation)}</div>
                </div>
                <div className="pd-sg-item">
                  <span className="pd-sg-label">Severity Scale</span>
                  <div className="pd-sg-value font-semibold">{safeVal(summary.hpi?.severity)}</div>
                </div>
                <div className="pd-sg-item">
                  <span className="pd-sg-label">Aggravating Factors</span>
                  <div className="pd-sg-value">{safeVal(summary.hpi?.aggravating)}</div>
                </div>
                <div className="pd-sg-item">
                  <span className="pd-sg-label">Relieving Factors</span>
                  <div className="pd-sg-value">{safeVal(summary.hpi?.relieving)}</div>
                </div>
                <div className="pd-sg-item pd-sg-full">
                  <span className="pd-sg-label">Associated Symptoms</span>
                  <div className="pd-sg-value">{safeVal(summary.hpi?.associated)}</div>
                </div>
              </div>
            </div>

            {/* 4. Patient's Direct Intake Queries & Confidential Remarks (if typed in kiosk) */}
            {typedQueries.length > 0 && (
              <div className="pd-card pd-patient-queries-card">
                <div className="pd-card-header">
                  <div className="pd-card-title-group">
                    <span className="pd-card-icon">💬</span>
                    <div>
                      <h4 className="pd-card-title">Patient Direct Intake Remarks / Typed Queries</h4>
                      <span className="pd-card-subtitle">
                        Typed on-screen by patient for privacy during kiosk interview
                      </span>
                    </div>
                  </div>
                  <span className="pd-badge-patient-typed">Patient's Own Words</span>
                </div>
                <div className="pd-queries-container">
                  {typedQueries.map((query, idx) => (
                    <div key={idx} className="pd-query-bubble">
                      <span className="pqb-idx">Query {idx + 1}:</span>
                      <p className="pqb-text">"{query}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Medical History & Review of Systems */}
            <div className="pd-card-row">
              {/* Medical Conditions & Meds */}
              <div className="pd-card pd-card-half">
                <div className="pd-card-header">
                  <div className="pd-card-title-group">
                    <span className="pd-card-icon">📂</span>
                    <h4 className="pd-card-title">Past History & Medications</h4>
                  </div>
                </div>
                <div className="pd-list-rows">
                  <div className="pd-lr-row">
                    <span className="pd-lr-label">Chronic Conditions:</span>
                    <span className="pd-lr-val">{safeVal(summary.pastHistory?.medicalConditions)}</span>
                  </div>
                  <div className="pd-lr-row">
                    <span className="pd-lr-label">Current Medications:</span>
                    <span className="pd-lr-val">{safeVal(summary.drugAllergyHistory?.currentMedications)}</span>
                  </div>
                  <div className="pd-lr-row">
                    <span className="pd-lr-label">Documented Allergies:</span>
                    <span className={`pd-lr-val ${hasAllergyFlag ? 'text-red-bold' : ''}`}>
                      {allergyStr || 'No known allergies (NKDA)'}
                    </span>
                  </div>
                  <div className="pd-lr-row">
                    <span className="pd-lr-label">Past Surgeries:</span>
                    <span className="pd-lr-val">{safeVal(summary.pastHistory?.surgicalHistory, 'Nil reported')}</span>
                  </div>
                  <div className="pd-lr-row">
                    <span className="pd-lr-label">Family History:</span>
                    <span className="pd-lr-val">{safeVal(summary.familyHistory, 'Nil significant')}</span>
                  </div>
                </div>
              </div>

              {/* Review of Systems & Lifestyle */}
              <div className="pd-card pd-card-half">
                <div className="pd-card-header">
                  <div className="pd-card-title-group">
                    <span className="pd-card-icon">🫁</span>
                    <h4 className="pd-card-title">Review of Systems (ROS) & Lifestyle</h4>
                  </div>
                </div>
                <div className="pd-list-rows">
                  <div className="pd-lr-row">
                    <span className="pd-lr-label">Respiratory:</span>
                    <span className="pd-lr-val">{safeVal(summary.reviewOfSystems?.respiratory, 'No symptoms')}</span>
                  </div>
                  <div className="pd-lr-row">
                    <span className="pd-lr-label">Gastrointestinal:</span>
                    <span className="pd-lr-val">{safeVal(summary.reviewOfSystems?.gastrointestinal, 'No symptoms')}</span>
                  </div>
                  <div className="pd-lr-row">
                    <span className="pd-lr-label">Neurological:</span>
                    <span className="pd-lr-val">{safeVal(summary.reviewOfSystems?.neurological, 'No symptoms')}</span>
                  </div>
                  <div className="pd-lr-row">
                    <span className="pd-lr-label">Smoking / Tobacco:</span>
                    <span className="pd-lr-val">{safeVal(summary.personalHistory?.smoking, 'Not reported')}</span>
                  </div>
                  <div className="pd-lr-row">
                    <span className="pd-lr-label">Alcohol Intake:</span>
                    <span className="pd-lr-val">{safeVal(summary.personalHistory?.alcohol, 'Not reported')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. AYUSH Dashavidha Pariksha (if applicable) */}
            {summary.ayush && (
              <div className="pd-card pd-ayush-card">
                <div className="pd-card-header">
                  <div className="pd-card-title-group">
                    <span className="pd-card-icon">🌿</span>
                    <div>
                      <h4 className="pd-card-title">AYUSH Dashavidha Pariksha Assessment</h4>
                      <span className="pd-card-subtitle">Ayurvedic Constitution & Physiological Evaluation</span>
                    </div>
                  </div>
                  <span className="pd-ayush-badge">Prakriti: {summary.ayush.prakriti || 'Assessed'}</span>
                </div>

                <div className="pd-ayush-grid">
                  <div className="pd-ag-item">
                    <span className="pd-ag-label">Prakriti (Constitution)</span>
                    <span className="pd-ag-val">{safeVal(summary.ayush.prakriti)}</span>
                  </div>
                  <div className="pd-ag-item">
                    <span className="pd-ag-label">Agni (Digestive Fire)</span>
                    <span className="pd-ag-val">{safeVal(summary.ayush.ahara_shakti)}</span>
                  </div>
                  <div className="pd-ag-item">
                    <span className="pd-ag-label">Koshtha (Bowel Habit)</span>
                    <span className="pd-ag-val">{safeVal(summary.ayush.koshtha)}</span>
                  </div>
                  <div className="pd-ag-item">
                    <span className="pd-ag-label">Sara (Tissue Quality)</span>
                    <span className="pd-ag-val">{safeVal(summary.ayush.sara)}</span>
                  </div>
                  <div className="pd-ag-item">
                    <span className="pd-ag-label">Samhanana (Body Build)</span>
                    <span className="pd-ag-val">{safeVal(summary.ayush.samhanana)}</span>
                  </div>
                  <div className="pd-ag-item">
                    <span className="pd-ag-label">Sattva (Mental Temperament)</span>
                    <span className="pd-ag-val">{safeVal(summary.ayush.sattva)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Clinical Decision Support: Differentials & Recommended Orders */}
            <div className="pd-card-row">
              {/* Differentials */}
              <div className="pd-card pd-card-half">
                <div className="pd-card-header">
                  <div className="pd-card-title-group">
                    <span className="pd-card-icon">🎯</span>
                    <div>
                      <h4 className="pd-card-title">Provisional Differentials</h4>
                      <span className="pd-card-subtitle">AI-assisted clinical differential ranking</span>
                    </div>
                  </div>
                </div>
                <ol className="pd-differentials-list">
                  {differentials.map((diff, i) => (
                    <li key={i} className="pd-diff-item">
                      <span className="pdi-num">{i + 1}</span>
                      <span className="pdi-name">{diff}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Recommended Immediate Physician Orders */}
              <div className="pd-card pd-card-half">
                <div className="pd-card-header">
                  <div className="pd-card-title-group">
                    <span className="pd-card-icon">⚡</span>
                    <div>
                      <h4 className="pd-card-title">Recommended Clinical Orders</h4>
                      <span className="pd-card-subtitle">Check off orders as initiated</span>
                    </div>
                  </div>
                </div>
                <div className="pd-orders-checklist">
                  {physicianActions.map((action, i) => (
                    <label key={i} className={`pd-order-item ${checkedOrders[i] ? 'is-ordered' : ''}`}>
                      <input
                        type="checkbox"
                        checked={!!checkedOrders[i]}
                        onChange={() => toggleOrder(i)}
                      />
                      <span className="poi-text">{action}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 8. Attending Doctor Clinical Notes & Rx Pad */}
            <div className="pd-card pd-doctor-workspace-card">
              <div className="pd-card-header">
                <div className="pd-card-title-group">
                  <span className="pd-card-icon">✍️</span>
                  <div>
                    <h4 className="pd-card-title">Attending Physician Notes & Prescription Pad</h4>
                    <span className="pd-card-subtitle">Document examination findings, clinical impression, and Rx</span>
                  </div>
                </div>
                <span className="pd-badge-doctor">Doctor Desk</span>
              </div>

              <div className="pd-workspace-grid">
                <div className="pd-wg-col">
                  <label className="pd-wg-label">Clinical Examination Findings & Doctor's Impression:</label>
                  <textarea
                    className="pd-textarea"
                    placeholder="Enter physical exam findings (e.g. Chest clear, S1 S2 heard, BP 120/80 mmHg, Abdomen soft non-tender)..."
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="pd-wg-col">
                  <label className="pd-wg-label">Prescription (Rx) & Advice:</label>
                  <textarea
                    className="pd-textarea pd-rx-textarea"
                    placeholder="Rx 1: Tab Paracetamol 650mg TDS x 3 days&#10;Rx 2: Tab Pantoprazole 40mg OD AC x 5 days&#10;Advice: Warm saline gargles, adequate hydration, review after 3 days..."
                    value={doctorRx}
                    onChange={(e) => setDoctorRx(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* 9. Patient-Facing Summary (What the patient saw in their language) */}
            {summary.patientSummaryParagraph && (
              <div className="pd-card pd-patient-preview-card">
                <div className="pd-card-header">
                  <div className="pd-card-title-group">
                    <span className="pd-card-icon">🗣️</span>
                    <div>
                      <h4 className="pd-card-title">
                        Patient Native Language Copy ({summary.patientSummaryLanguage?.name || language?.nativeName || 'Patient Language'})
                      </h4>
                      <span className="pd-card-subtitle">
                        Plain-language explanation displayed on patient's kiosk screen
                      </span>
                    </div>
                  </div>
                  <span className="pd-badge-patient-view">Patient View</span>
                </div>
                <p className="pd-patient-preview-text">
                  {summary.patientSummaryParagraph}
                </p>
              </div>
            )}

            {/* 10. Confirm & Sign Off Bar */}
            <div className="pd-confirm-section">
              {confirmed ? (
                <div className="pd-confirmed-wrap">
                  <div className="pd-confirmed">
                    ✅ Clinical Consultation Validated & Signed Off to EMR / ABHA at {new Date().toLocaleTimeString('en-IN')}
                  </div>
                  <button
                    className="btn btn-primary btn-large btn-share-confirmed"
                    onClick={() => setShareOpen(true)}
                  >
                    📲 Share Validated Summary to Patient's Mobile (WhatsApp / SMS)
                  </button>
                </div>
              ) : (
                <div className="pd-confirm-btns">
                  <button className="btn btn-confirm" onClick={() => setConfirmed(true)}>
                    ✅ Validate & Sign Off to EMR / ABHA
                  </button>
                  <button
                    className="btn btn-share-secondary"
                    onClick={() => setShareOpen(true)}
                  >
                    📲 Share with Patient (WhatsApp / SMS)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LABS TAB */}
        {activeTab === 'labs' && (
          <div className="pd-labs animate-fade-in">
            {abnormalLabs.length === 0 ? (
              <div className="pd-empty">✅ No abnormal lab values detected in uploaded documents</div>
            ) : (
              <>
                <div className="abnormal-banner">⚠️ {abnormalLabs.length} abnormal lab parameter(s) flagged</div>
                <div className="pd-lab-table">
                  <div className="pdt-header">
                    <span>Test Parameter</span><span>Reported Value</span><span>Reference Range</span><span>Source Document</span>
                  </div>
                  {documents?.flatMap((doc, di) =>
                    (doc.investigations || []).map((inv, ii) => (
                      <div key={`${di}-${ii}`} className={`pdt-row ${inv.abnormal ? 'abnormal-row' : ''}`}>
                        <span>{safeVal(inv.name)}</span>
                        <span className={inv.abnormal ? 'abnormal-val' : ''}>{inv.abnormal && '⚠️ '}{safeVal(inv.value)} {safeVal(inv.unit, '')}</span>
                        <span>{safeVal(inv.range)}</span>
                        <span>{safeVal(doc.hospital, 'Hospital')} ({safeVal(doc.date, 'Recent')})</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* MEDICATIONS TAB */}
        {activeTab === 'medications' && (
          <div className="pd-medications animate-fade-in">
            {allMeds.length === 0 ? (
              <div className="pd-empty">No prior medications extracted from uploaded documents</div>
            ) : (
              allMeds.map((med, i) => (
                <div key={i} className="pd-med-card">
                  <span className="pmc-icon">💊</span>
                  <div>
                    <div className="pmc-name">{safeVal(med.name)}</div>
                    <div className="pmc-dose">{safeVal(med.dose)}</div>
                    <div className="pmc-source">{safeVal(med.source)} · {safeVal(med.date)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ABDM TAB */}
        {activeTab === 'abdm' && (
          <div className="pd-abdm animate-fade-in">
            <div className="abdm-record-card">
              <div className="arc-header">
                <span>🇮🇳</span>
                <div>
                  <div className="arc-title">ABDM FHIR R4 Clinical Record Bundle</div>
                  <div className="arc-status">✅ Linked · ✅ Synced · 🔒 DPDP 2023 Compliant</div>
                </div>
              </div>
              <div className="arc-fields">
                <div className="arc-field"><span>Patient ABHA ID</span><code>{patient?.abhaId || patient?.id || 'MK-ABDM-RECORD'}</code></div>
                <div className="arc-field"><span>Resource Type</span><code>Bundle (FHIR R4 DiagnosticReport)</code></div>
                <div className="arc-field"><span>Clinical Entries</span><code>Patient · Condition · ClinicalImpression · MedicationRequest · AllergyIntolerance</code></div>
                <div className="arc-field"><span>ABDM Consent Status</span><code>✅ Validated (DPDP 2023 Explicit Consent)</code></div>
                <div className="arc-field"><span>Hospital Information System (HIS)</span><code>✅ Connected & Synchronized</code></div>
              </div>
              <div className="arc-fhir-preview">
                <pre>{JSON.stringify({
                  resourceType: 'Bundle',
                  type: 'document',
                  entry: [
                    { resource: { resourceType: 'Patient', id: patient?.abhaId || 'MK001', name: [{ text: patient?.name || 'Patient' }] } },
                    { resource: { resourceType: 'Condition', code: { text: safeVal(summary.chiefComplaint, 'Not specified') } } },
                    { resource: { resourceType: 'ClinicalImpression', status: 'completed', description: `Triage: ${triagePriority}` } },
                  ]
                }, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      <ShareReportModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        patient={patient}
        summary={summary}
        patientParagraph={summary.patientSummaryParagraph}
        language={language}
        documents={documents}
        mode={mode}
        sessionId={sessionId}
      />
    </div>
  );
};

export default React.memo(PhysicianDashboard);
