import React, { useState, useEffect, useRef, useMemo } from 'react';
import { executeDocumentOCR, getMedicalTimeline } from '../../utils/ocrProcessor';
import DocumentCard from '../ui/DocumentCard';
import { getTranslation } from '../../data/translations';

const DocumentScanScreen = ({ onNext, speak, language }) => {
  const [documents, setDocuments] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [currentStage, setCurrentStage] = useState('opencv');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const t = useMemo(() => getTranslation(language?.code || 'en'), [language]);
  const lang = language?.ttsLang || 'en-IN';

  useEffect(() => {
    speak(
      t.scanSubtitle ||
        'Please upload or scan your previous medical documents — prescriptions, lab reports, or discharge summaries.',
      lang
    );
  }, [lang, speak, t.scanSubtitle]);

  const processFile = async (file, docType = null) => {
    setProcessing(true);
    setProgress(0);
    setCurrentStage('opencv');
    setProgressMsg(t.processingDoc || 'OpenCV: Initializing image pipeline...');

    try {
      const result = await executeDocumentOCR(file, (pct, msg, stage) => {
        setProgress(pct);
        setProgressMsg(msg);
        if (stage) setCurrentStage(stage);
      });
      if (docType && !file?.name) {
        result.type = docType;
      }
      setDocuments((prev) => [result, ...prev]);
    } catch (e) {
      console.error('Document OCR error:', e);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await processFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await processFile(file);
    }
  };

  const timeline = getMedicalTimeline(documents);

  return (
    <div className="screen-container animate-slide-up">
      <div className="screen-header">
        <h2 className="screen-title">{t.scanTitle}</h2>
        <p className="screen-subtitle">{t.scanSubtitle}</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${
          processing ? 'processing' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !processing && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload medical document"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {processing ? (
          <div className="ocr-processing">
            <div className={`active-engine-badge ${currentStage}`}>
              {currentStage === 'opencv' && (t.ocrStagePrep || '📄 Preparing document...')}
              {currentStage === 'paddleocr' && (t.ocrStageReading || '🔍 Reading handwriting & text...')}
              {currentStage === 'nlp' && (t.ocrStageParsing || '📋 Extracting clinical details...')}
              {currentStage === 'done' && (t.ocrStageDone || '✅ Document attached!')}
            </div>

            <div className="ocr-spinner">
              <div className="scanner-line" />
            </div>

            <div className="ocr-progress-bar">
              <div className="ocr-fill" style={{ width: `${progress}%` }} />
            </div>

            <p className="ocr-msg">{progressMsg}</p>
            <p className="ocr-pct">{progress}%</p>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon-container">
              <span className="upload-main-icon">📤</span>
            </div>
            <h3>{t.scanPrompt}</h3>
            <p>{t.uploadFileBtn}</p>
            <div className="upload-type-pills">
              <span>{t.pillPrescriptions || '💊 Prescriptions'}</span>
              <span>{t.pillLabReports || '🔬 Lab Reports'}</span>
              <span>{t.pillDischarge || '🏥 Discharge Summaries'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Demo Scan buttons */}
      <div className="scan-buttons-group">
        <span className="sbg-label">⚡ {t.openCameraBtn} / Demo:</span>
        <div className="sbg-buttons">
          <button
            className="btn btn-scan"
            onClick={() =>
              processFile(
                { name: 'aiims_prescription.jpg', size: 245760 },
                'prescription'
              )
            }
            disabled={processing}
          >
            {t.demoPrescriptionBtn || '💊 Prescription Scan'}
          </button>
          <button
            className="btn btn-scan"
            onClick={() =>
              processFile(
                { name: 'thyrocare_lab_panel.jpg', size: 312000 },
                'lab_report'
              )
            }
            disabled={processing}
          >
            {t.demoLabBtn || '🔬 Lab Report Scan'}
          </button>
          <button
            className="btn btn-scan"
            onClick={() =>
              processFile(
                { name: 'discharge_cardiology.pdf', size: 524288 },
                'discharge_summary'
              )
            }
            disabled={processing}
          >
            {t.demoDischargeBtn || '🏥 Discharge Summary'}
          </button>
        </div>
      </div>

      {/* Scanned documents timeline */}
      {timeline.length > 0 && (
        <div className="documents-section">
          <div className="doc-timeline-header">
            <span>📁 {t.docProcessed} ({timeline.length})</span>
            <div className="doc-timeline-badges">
              <span className="doc-ai-badge opencv-ai-badge">🖼️ OpenCV 4.x</span>
              <span className="doc-ai-badge paddle-ai-badge">🔍 PaddleOCR</span>
            </div>
          </div>
          <div className="documents-list">
            {timeline.map((doc, idx) => (
              <DocumentCard key={idx} doc={doc} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="scan-actions">
        <button
          className="btn btn-primary btn-large"
          onClick={() => onNext(documents)}
          disabled={processing}
        >
          {documents.length > 0
            ? `${t.proceedSummaryBtn} (${documents.length})`
            : t.proceedSummaryBtn}
        </button>
        {documents.length === 0 && (
          <button className="btn btn-ghost" onClick={() => onNext([])}>
            {t.skipScanBtn}
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(DocumentScanScreen);
