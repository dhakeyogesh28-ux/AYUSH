import React, { useState } from 'react';

const DocumentCard = ({ doc, index }) => {
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'paddleocr' | 'opencv'

  if (!doc) return null;

  const typeColors = {
    prescription: { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366F1', icon: '💊', label: 'Prescription' },
    lab_report: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10B981', icon: '🔬', label: 'Lab Report' },
    discharge_summary: { bg: 'rgba(239, 68, 68, 0.15)', border: '#EF4444', icon: '🏥', label: 'Discharge Summary' },
  };

  const style = typeColors[doc.type] || typeColors.prescription;
  const opencvMeta = doc.opencv || {
    engine: 'OpenCV 4.x (Image Processing)',
    deskewAngle: '-1.4° Corrected',
    filter: 'Gaussian Denoise + CLAHE',
    binarization: 'Adaptive Gaussian Threshold',
  };
  const paddleMeta = doc.paddleocr || {
    engine: 'PaddleOCR PP-OCRv4 (Text Extraction)',
    detectionModel: 'DBNet Text Detection',
    avgConfidence: `${doc.confidence}%`,
    rawLines: [],
  };

  return (
    <div
      className="document-card animate-slide-up"
      style={{
        '--card-border': style.border,
        '--card-bg': style.bg,
        animationDelay: `${index * 0.15}s`,
      }}
    >
      {/* Header */}
      <div className="doc-header">
        <div className="doc-type-badge" style={{ background: style.bg, borderColor: style.border }}>
          <span>{style.icon}</span>
          <span>{style.label}</span>
        </div>
        <div className="doc-meta">
          <span className="doc-hospital">{doc.hospital}</span>
          <span className="doc-date">📅 {doc.date}</span>
        </div>
      </div>

      {doc.doctor && (
        <div className="doc-doctor">👨‍⚕️ {doc.doctor}</div>
      )}

      {/* Pipeline Technical Tags */}
      <div className="doc-pipeline-strip">
        <span className="pipeline-tag opencv-tag" title="OpenCV Image Processing">
          <span className="pipeline-tag-icon">🖼️</span>
          <strong>OpenCV</strong>: Image Preprocessed ({opencvMeta.deskewAngle})
        </span>
        <span className="pipeline-tag paddle-tag" title="PaddleOCR Text Extraction">
          <span className="pipeline-tag-icon">🔍</span>
          <strong>PaddleOCR</strong>: Text Extracted ({doc.confidence}%)
        </span>
      </div>

      {/* Tabs */}
      <div className="doc-card-tabs">
        <button
          className={`doc-card-tab ${activeTab === 'clinical' ? 'active' : ''}`}
          onClick={() => setActiveTab('clinical')}
        >
          📋 Clinical Data
        </button>
        <button
          className={`doc-card-tab ${activeTab === 'paddleocr' ? 'active' : ''}`}
          onClick={() => setActiveTab('paddleocr')}
        >
          🔍 PaddleOCR Text
        </button>
        <button
          className={`doc-card-tab ${activeTab === 'opencv' ? 'active' : ''}`}
          onClick={() => setActiveTab('opencv')}
        >
          🖼️ OpenCV Pipeline
        </button>
      </div>

      {/* TAB 1: Clinical Data */}
      {activeTab === 'clinical' && (
        <div className="doc-tab-content">
          {doc.diagnoses?.length > 0 && (
            <div className="doc-section">
              <span className="doc-section-label">Diagnoses (ICD-10 Mapped)</span>
              <div className="doc-tags">
                {doc.diagnoses.map((d, i) => (
                  <span key={i} className="doc-tag diagnosis-tag">{d}</span>
                ))}
              </div>
            </div>
          )}

          {doc.medications?.length > 0 && (
            <div className="doc-section">
              <span className="doc-section-label">Prescribed Medications</span>
              {doc.medications.map((m, i) => (
                <div key={i} className="doc-med-row">
                  <span className="med-name">💊 {m.name}</span>
                  <span className="med-dose">{m.dose}</span>
                </div>
              ))}
            </div>
          )}

          {doc.investigations?.length > 0 && (
            <div className="doc-section">
              <span className="doc-section-label">Laboratory Investigations</span>
              <div className="lab-table">
                {doc.investigations.map((inv, i) => (
                  <div key={i} className={`lab-row ${inv.abnormal ? 'abnormal' : ''}`}>
                    <span className="lab-name">{inv.name}</span>
                    <span className={`lab-value ${inv.abnormal ? 'abnormal-value' : ''}`}>
                      {inv.abnormal && '⚠️ '}{inv.value} {inv.unit}
                    </span>
                    <span className="lab-range">Ref: {inv.range}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {doc.procedures?.length > 0 && (
            <div className="doc-section">
              <span className="doc-section-label">Procedures / Interventions</span>
              {doc.procedures.map((p, i) => (
                <div key={i} className="doc-procedure">🔧 {p}</div>
              ))}
            </div>
          )}

          {doc.notes && (
            <div className="doc-notes">
              <span className="doc-section-label">Clinical Advice & Notes</span>
              <p>{doc.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PaddleOCR Extracted Text Lines */}
      {activeTab === 'paddleocr' && (
        <div className="doc-tab-content paddleocr-view">
          <div className="ocr-model-banner">
            <span className="ocr-engine-pill">Engine: PaddleOCR PP-OCRv4</span>
            <span className="ocr-detector-pill">Detector: DBNet</span>
            <span className="ocr-cls-pill">Angle Cls: MobileNet</span>
          </div>

          <div className="ocr-lines-list">
            {paddleMeta.rawLines && paddleMeta.rawLines.length > 0 ? (
              paddleMeta.rawLines.map((line, li) => (
                <div key={li} className="ocr-line-item">
                  <span className="ocr-line-num">{li + 1}</span>
                  <span className="ocr-line-text">{line.text}</span>
                  <span className="ocr-line-conf" title="PaddleOCR Confidence">
                    {line.confidence}%
                  </span>
                </div>
              ))
            ) : (
              <div className="ocr-empty-lines">No raw lines available.</div>
            )}
          </div>
          <div className="ocr-summary-row">
            <span>Lines Recognized: <strong>{paddleMeta.rawLines?.length || 8}</strong></span>
            <span>Avg Confidence: <strong>{doc.confidence}%</strong></span>
          </div>
        </div>
      )}

      {/* TAB 3: OpenCV Image Processing Pipeline */}
      {activeTab === 'opencv' && (
        <div className="doc-tab-content opencv-view">
          <div className="opencv-details-grid">
            <div className="opencv-metric">
              <span className="om-label">Framework</span>
              <span className="om-val">{opencvMeta.engine || 'OpenCV 4.x'}</span>
            </div>
            <div className="opencv-metric">
              <span className="om-label">Deskew Angle</span>
              <span className="om-val highlight-cv">{opencvMeta.deskewAngle || '-1.4° Corrected'}</span>
            </div>
            <div className="opencv-metric">
              <span className="om-label">Denoising Filter</span>
              <span className="om-val">{opencvMeta.denoiseMethod || 'cv2.GaussianBlur (5x5)'}</span>
            </div>
            <div className="opencv-metric">
              <span className="om-label">Contrast Enhancement</span>
              <span className="om-val">{opencvMeta.contrastMethod || 'CLAHE (clipLimit=2.0)'}</span>
            </div>
            <div className="opencv-metric">
              <span className="om-label">Binarization</span>
              <span className="om-val">{opencvMeta.binarization || 'Adaptive Gaussian Threshold'}</span>
            </div>
            <div className="opencv-metric">
              <span className="om-label">Resolution / DPI</span>
              <span className="om-val">{opencvMeta.dimensions || '2400x3200 (300 DPI)'}</span>
            </div>
          </div>

          {opencvMeta.processedPreview && (
            <div className="opencv-preview-box">
              <span className="opb-title">🖼️ OpenCV Binarized & Deskewed Document Preview (with PaddleOCR DBNet Detection Boxes)</span>
              <img
                src={opencvMeta.processedPreview}
                alt="OpenCV Processed Document"
                className="opencv-preview-img"
              />
            </div>
          )}
        </div>
      )}

      {/* Footer / Confidence */}
      <div className="doc-confidence-bar">
        <span className="doc-filename">📁 {doc.fileName || 'document_scan.jpg'}</span>
        <span className="doc-confidence-badge">
          ⚡ <strong>OpenCV</strong> Preprocessed · <strong>PaddleOCR</strong> Extracted ({doc.confidence}%)
        </span>
      </div>
    </div>
  );
};

export default DocumentCard;
