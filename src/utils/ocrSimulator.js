// Backward compatibility wrapper for executeDocumentOCR
import { executeDocumentOCR, getMedicalTimeline } from './ocrProcessor';

export const simulateOCR = async (file, onProgress) => {
  return executeDocumentOCR(file, onProgress);
};

export { getMedicalTimeline };
