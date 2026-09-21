# Ayush Document OCR Engine
### OpenCV (Image Processing) & PaddleOCR (Text Extraction)

This service provides state-of-the-art document processing for clinical prescriptions, lab reports, and hospital discharge summaries.

## Architecture

```
                       ┌──────────────────────────────┐
                       │  Uploaded Medical Document   │
                       └──────────────┬───────────────┘
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       1. OpenCV 4.x Image Preprocessing          │
             ├──────────────────────────────────────────────────┤
             │ • Grayscale Conversion (cv2.cvtColor)            │
             │ • Hough Transform / MinAreaRect Auto-Deskewing   │
             │ • Gaussian & Bilateral Denoising Filter          │
             │ • CLAHE Contrast Limited Adaptive Equalization   │
             │ • Adaptive Gaussian Binarization                 │
             └────────────────────────┬─────────────────────────┘
                                      │ Cleaned & Binarized Image
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │         2. PaddleOCR v4 Text Extraction          │
             ├──────────────────────────────────────────────────┤
             │ • DBNet (Differentiable Binarization) Detection  │
             │ • MobileNet Orientation / Angle Classifier       │
             │ • Multilingual SVTR / CRNN Text Recognizer       │
             │ • Character Bounding Boxes & Confidence Scores   │
             └────────────────────────┬─────────────────────────┘
                                      │ Extracted Text Lines
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │        3. Clinical Entity Parser & FHIR          │
             ├──────────────────────────────────────────────────┤
             │ • Diagnoses (ICD-10)                             │
             │ • Medications & Dosages                          │
             │ • Lab Values & Abnormal Flags                    │
             │ • ABDM / FHIR R4 JSON Payload                    │
             └──────────────────────────────────────────────────┘
```

## Setup & Running the Python Service

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the FastAPI Server**:
   ```bash
   python ocr_service.py
   # or
   uvicorn ocr_service:app --reload --port 8000
   ```

3. **Kiosk Auto-Discovery**:
   The Ayush frontend automatically queries `http://localhost:8000/api/ocr/process`. If the service is running, it uses live inference; otherwise, it seamlessly uses the client-side OpenCV Canvas + PaddleOCR pipeline.
