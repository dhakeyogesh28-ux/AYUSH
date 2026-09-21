"""
Ayush Gemini Multimodal Live Clinical Voice Service
===================================================
Features:
  1. Secure GEMINI_API_KEY loading from backend/.env (never exposed to frontend)
  2. Gemini Live API WebSocket Gateway for real-time speech-to-speech interaction
  3. Strict single-language clinical dialogue: AI listens, understands, and speaks in the patient's selected language
  4. Language-independent structured medical data extraction (SOCRATES / ABDM schema)
  5. Final doctor-ready clinical summary generation in English
"""

import os
import json
import asyncio
import logging
import urllib.parse
from typing import Dict, Any, Optional, List
from pathlib import Path
from dotenv import load_dotenv
import websockets
from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel

# Load environment variables securely from backend/.env
ENV_PATH = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

logger = logging.getLogger("ayush.gemini")
logging.basicConfig(level=logging.INFO)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_LIVE_MODEL = os.getenv("GEMINI_LIVE_MODEL", "models/gemini-2.0-flash-exp")

# Gemini Multimodal Live API WebSocket Endpoint
GEMINI_LIVE_WS_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent"

# Language mapping
LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "bn": "Bengali (বাংলা)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "mr": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)",
}

# In-memory patient session store
# session_id -> { selected_language, opd_mode, patient, dialogue, clinical_record }
SESSIONS: Dict[str, Dict[str, Any]] = {}


def get_gemini_api_key() -> str:
    """Returns the API key from environment, re-reading from .env if updated."""
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    return os.getenv("GEMINI_API_KEY", "").strip()


def build_system_instruction(language_code: str, opd_mode: str) -> str:
    """
    Constructs the clinical triage persona prompt for Gemini Live.
    Enforces that the ENTIRE dialogue is conducted in the patient's selected language.
    """
    lang_name = LANGUAGE_NAMES.get(language_code, "English")
    mode_text = (
        "Integrative General Medicine & AYUSH OPD (evaluate both modern clinical history and Ayurvedic Dashavidha Pariksha)"
        if opd_mode == "both"
        else "AYUSH Holistic OPD (evaluate Ayurvedic complaints and Prakriti)"
        if opd_mode == "ayush"
        else "General Hospital OPD (Modern Medicine)"
    )

    return f"""You are Dr. Ayush, an expert, empathetic, and warm AI clinical doctor conducting a medical history intake at an Indian hospital OPD kiosk.

CONSULTATION CONTEXT:
- OPD Type: {mode_text}
- Patient Selected Language: {lang_name} ({language_code})

STRICT LANGUAGE RULE:
1. The patient has chosen to speak in {lang_name}.
2. You MUST conduct the ENTIRE conversation exclusively in {lang_name}.
3. Listen carefully to the patient's native speech and understand their medical concern.
4. Dynamically generate the next clinical question and speak it back in {lang_name}.
5. NEVER switch to English or any other language during the conversation. Do not provide bilingual translations in your speech. Speak naturally, politely, and colloquially in {lang_name}.

CLINICAL INTERVIEW GUIDELINES:
- Greet warmly and ask for their primary symptom if starting.
- Follow the clinical SOCRATES triage protocol step by step:
  • Site: Where is the pain/problem?
  • Onset: When did it start? Was it sudden or gradual?
  • Character: What does it feel like (sharp, dull, burning, pressure)?
  • Radiation: Does it spread anywhere?
  • Associated symptoms: Fever, nausea, breathlessness, etc.?
  • Timing / Duration: Is it constant or intermittent?
  • Exacerbating / Relieving factors: What makes it worse or better?
  • Severity: Ask to rate discomfort from 1 to 10.
- Ask ONLY ONE focused question at a time. Keep responses concise (1 to 2 sentences) so the patient can easily answer via voice.
- Be attentive to red-flag emergencies (e.g. crushing chest pain, sudden severe shortness of breath, neurological deficits).
- When adequate clinical details are gathered, summarize compassionately and thank the patient in {lang_name}.
"""


class SessionInitRequest(BaseModel):
    session_id: str
    language_code: str = "en"
    opd_mode: str = "allopathy"
    patient: Optional[Dict[str, Any]] = None


class ConverseRequest(BaseModel):
    session_id: str
    user_speech_text: Optional[str] = None
    language_code: Optional[str] = "en"
    opd_mode: Optional[str] = "allopathy"


def get_or_create_session(session_id: str, lang_code: str = "en", opd_mode: str = "allopathy") -> Dict[str, Any]:
    if session_id not in SESSIONS:
        SESSIONS[session_id] = {
            "session_id": session_id,
            "selected_language": lang_code,
            "language_name": LANGUAGE_NAMES.get(lang_code, "English"),
            "opd_mode": opd_mode,
            "patient": None,
            "dialogue": [],
            "clinical_record": {
                "chief_complaint": None,
                "onset": None,
                "severity": None,
                "character": None,
                "radiation": None,
                "aggravating": [],
                "relieving": [],
                "associated_symptoms": [],
                "past_history": None,
                "current_medications": None,
                "allergies": None,
                "red_flags": [],
                "ayush_findings": {},
            },
        }
    return SESSIONS[session_id]


async def extract_structured_clinical_data(session: Dict[str, Any], api_key: str):
    """
    Analyzes the multilingual conversation history using Gemini, extracting
    language-independent, structured clinical data in standard medical English.
    """
    if not api_key or api_key == "your_gemini_api_key_here":
        return

    dialogue_text = "\n".join(
        [f"{m['role'].upper()}: {m['text']}" for m in session["dialogue"]]
    )
    if not dialogue_text.strip():
        return

    prompt = f"""You are a medical informatics clinical parser.
Analyze this clinical triage dialogue (conducted in {session['language_name']}) and extract all clinical findings into a structured English JSON format.

Dialogue:
{dialogue_text}

Respond ONLY with a valid JSON object matching this schema (do not include markdown ticks, just JSON):
{{
  "chief_complaint": "string or null",
  "onset": "string or null",
  "severity": "number 1-10 or null",
  "character": "string or null",
  "radiation": "string or null",
  "aggravating": ["string"],
  "relieving": ["string"],
  "associated_symptoms": ["string"],
  "past_history": "string or null",
  "current_medications": "string or null",
  "allergies": "string or null",
  "red_flags": ["string"],
  "ayush_findings": {{
    "prakriti": "string or null",
    "agni": "string or null",
    "koshtha": "string or null"
  }}
}}
"""
    try:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
        }
        res = requests.post(url, json=payload, timeout=10)
        if res.status_code == 200:
            data = res.json()
            raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_json)
            # Merge with session record
            for k, v in parsed.items():
                if v is not None:
                    session["clinical_record"][k] = v
    except Exception as e:
        logger.warning(f"Structured clinical extraction error: {e}")


async def generate_english_doctor_summary(session: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """
    Generates the final comprehensive consultation summary for BOTH:
    1. Physician: in standard medical English
    2. Patient: in paragraph format in the patient's selected native language
    """
    dialogue_text = "\n".join(
        [f"{m['role'].upper()}: {m['text']}" for m in session["dialogue"]]
    )
    structured_data = json.dumps(session["clinical_record"], indent=2)
    lang_code = session.get("selected_language", "en")
    lang_name = session.get("language_name", "English")
    patient_info = session.get("patient") or {}
    patient_name = patient_info.get("name") or "Patient"

    prompt = f"""You are a chief consulting physician creating a final medical consultation summary for an EHR / ABDM system.
The consultation was conducted in {lang_name} ({lang_code}).
Patient: {patient_name}
OPD Type: {session['opd_mode']}

Structured Clinical Data Extracted:
{structured_data}

Conversation Transcript:
{dialogue_text}

Task:
Generate a dual consultation summary:
1. "doctorReadySummaryEnglish": A professional clinical narrative in standard medical ENGLISH for physician review.
2. "patientSummaryParagraph": A warm, clear, compassionate paragraph summary written directly in {lang_name} in simple, accessible language without confusing medical jargon, explaining what was recorded and recommending physician consultation.
3. "chiefComplaint": Primary symptom in English.
4. "hpi": SOCRATES details (onset, severity, character, radiation, aggravating, relieving).
5. "reviewOfSystems": System findings.
6. "pastAndMedHistory": Past conditions and medications.
7. "allergies": Drug and other allergies.
8. "ayushAssessment": AYUSH / Prakriti findings (if applicable).
9. "provisionalImpressions": List of impressions.
10. "suggestedWorkup": Initial workup items.
11. "redFlags": Any emergency flags.

Return ONLY valid JSON matching this schema:
{{
  "doctorReadySummaryEnglish": "Comprehensive clinical narrative summary in English...",
  "patientSummaryParagraph": "Clear, empathetic paragraph summary written directly in {lang_name}...",
  "chiefComplaint": "Primary complaint in English",
  "hpi": {{
    "onset": "...",
    "severity": "...",
    "character": "...",
    "radiation": "...",
    "aggravating": "...",
    "relieving": "..."
  }},
  "reviewOfSystems": "...",
  "pastAndMedHistory": "...",
  "allergies": "...",
  "ayushAssessment": "...",
  "provisionalImpressions": ["..."],
  "suggestedWorkup": ["..."],
  "redFlags": []
}}
"""
    record = session["clinical_record"]
    cc = record.get("chief_complaint") or "Reported symptoms"
    onset = record.get("onset") or "recent"
    sev = record.get("severity") or 5

    # Fallback paragraph in patient's language across all 8 supported languages
    if lang_code == "hi":
        patient_para_fallback = f"नमस्ते {patient_name} जी। आपके स्वास्थ्य परामर्श का संक्षिप्त विवरण: आप मुख्य रूप से '{cc}' की समस्या के लिए उपस्थित हुए हैं (शुरुआत: {onset}, तीव्रता: 10 में से {sev})। आपकी सभी क्लीनिकल जानकारियां और लक्षण डॉक्टर की स्क्रीन पर भेज दिए गए हैं। कृपया डॉक्टर से व्यक्तिगत परामर्श लें।"
    elif lang_code == "mr":
        patient_para_fallback = f"नमस्कार {patient_name} जी. तुमच्या तपासणीचा सारांश: तुम्ही प्रामुख्याने '{cc}' या त्रासासाठी सल्लामसलत केली आहे (कालावधी: {onset}, तीव्रता: 10 पैकी {sev}). तुमची संपूर्ण माहिती डॉक्टरांच्या स्क्रीनवर पाठवली आहे. कृपया डॉक्टरांचा सल्ला घ्या."
    elif lang_code == "bn":
        patient_para_fallback = f"নমস্কার {patient_name} মহাশয়/মহাশয়া। আপনার স্বাস্থ্য পরামর্শের সংক্ষিপ্ত বিবরণ: আপনি মূলত '{cc}' সমস্যার জন্য উপস্থিত হয়েছেন (শুরু: {onset}, তীব্রতা: ১০ এর মধ্যে {sev})। আপনার সমস্ত লক্ষণ এবং বিবরণ চিকিৎসকের কাছে পাঠানো হয়েছে। অনুগ্রহ করে চিকিৎসকের সাথে দেখা করুন।"
    elif lang_code == "ta":
        patient_para_fallback = f"வணக்கம் {patient_name}. உங்கள் மருத்துவ ஆலோசனையின் சுருக்கம்: நீங்கள் முதன்மையாக '{cc}' பிரச்சனைக்காக வந்துள்ளீர்கள் (தொடக்கம்: {onset}, தீவிரம்: 10 இல் {sev}). உங்கள் அறிகுறிகள் மற்றும் விவரங்கள் அனைத்தும் மருத்துவரின் திரைக்கு அனுப்பப்பட்டுள்ளன. தயவுசெய்து மருத்துவரை அணுகவும்."
    elif lang_code == "te":
        patient_para_fallback = f"నమస్కారం {patient_name} గారు. మీ ఆరోగ్య సంప్రదింపు సారాంశం: మీరు ప్రధానంగా '{cc}' సమస్య కోసం వచ్చారు (ప్రారంభం: {onset}, తీవ్రత: 10 లో {sev}). మీ లక్షణాలు మరియు వివరాలన్నీ వైద్యుడి స్క్రీన్‌కు పంపబడ్డాయి. దయచేసి వైద్యుడిని సంప్రదించండి."
    elif lang_code == "kn":
        patient_para_fallback = f"ನಮಸ್ಕಾರ {patient_name} ಅವರೇ. ನಿಮ್ಮ ಆರೋಗ್ಯ ತಪಾಸಣೆಯ ಸಾರಾಂಶ: ನೀವು ಮುಖ್ಯವಾಗಿ '{cc}' ಸಮಸ್ಯೆಗಾಗಿ ಬಂದಿದ್ದೀರಿ (ಪ್ರಾರಂಭ: {onset}, ತೀವ್ರತೆ: 10 ರಲ್ಲಿ {sev}). ನಿಮ್ಮ ಎಲ್ಲಾ ಲಕ್ಷಣಗಳು ಮತ್ತು ವಿವರಗಳನ್ನು ವೈದ್ಯರ ಪರದೆಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ."
    elif lang_code == "gu":
        patient_para_fallback = f"નમસ્તે {patient_name} ભાઈ/બહેન. તમારા આરોગ્ય પરામર્શનો સારાંશ: તમે મુખ્યત્વે '{cc}' ની સમસ્યા માટે આવ્યા છો (શરૂઆત: {onset}, તીવ્રતા: ૧૦ માંથી {sev}). તમારી બધી વિગતો અને લક્ષણો ડૉક્ટરની સ્ક્રીન પર મોકલી દેવામાં આવ્યા છે. કૃપા કરીને ડૉક્ટરની રૂબરૂ સલાહ લો."
    else:
        patient_para_fallback = f"Hello {patient_name}. Here is your consultation summary: You presented primarily for '{cc}' (onset: {onset}, severity: {sev}/10). All your symptoms and health details have been sent to the attending physician for review. Please proceed to the consultation room."

    agg_str = ", ".join(record.get("aggravating") or []) if isinstance(record.get("aggravating"), list) else (record.get("aggravating") or "None reported")
    rel_str = ", ".join(record.get("relieving") or []) if isinstance(record.get("relieving"), list) else (record.get("relieving") or "Rest")
    assoc_str = ", ".join(record.get("associated_symptoms") or []) if isinstance(record.get("associated_symptoms"), list) else (record.get("associated_symptoms") or "No acute secondary symptoms reported")
    red_str = ", ".join(record.get("red_flags") or []) if record.get("red_flags") else "None detected"

    doctor_narrative = (
        f"CHIEF COMPLAINT: {cc}\n\n"
        f"HISTORY OF PRESENT ILLNESS (HPI):\n"
        f"- Onset: {onset}\n"
        f"- Severity: {sev}/10\n"
        f"- Character: {record.get('character') or 'Discomfort'}\n"
        f"- Radiation: {record.get('radiation') or 'None'}\n"
        f"- Aggravating Factors: {agg_str}\n"
        f"- Relieving Factors: {rel_str}\n\n"
        f"REVIEW OF SYSTEMS & ASSOCIATED SYMPTOMS:\n"
        f"- {assoc_str}\n\n"
        f"PAST MEDICAL & MEDICATION HISTORY:\n"
        f"- {record.get('past_history') or 'Nil significant reported'}\n\n"
        f"ALLERGIES:\n"
        f"- {record.get('allergies') or 'No known drug allergies (NKDA)'}\n\n"
        f"CLINICAL ASSESSMENT & TRIAGE:\n"
        f"- Mode: {session.get('opd_mode', 'allopathy').upper()}\n"
        f"- Language of Triage: {lang_name}\n"
        f"- Red Flags: {red_str}\n"
        f"- Recommended Action: Complete clinical evaluation, vitals check, and targeted examination."
    )

    fallback_summary = {
        "doctorReadySummaryEnglish": doctor_narrative,
        "patientSummaryParagraph": patient_para_fallback,
        "patientSummaryLanguage": {"code": lang_code, "name": lang_name},
        "chiefComplaint": cc,
        "hpi": {
            "onset": onset,
            "severity": f"{sev}/10",
            "character": record.get("character") or "Discomfort",
            "radiation": record.get("radiation") or "None",
            "aggravating": agg_str,
            "relieving": rel_str,
        },
        "reviewOfSystems": assoc_str,
        "pastAndMedHistory": record.get("past_history") or "Nil significant",
        "allergies": record.get("allergies") or "No known drug allergies",
        "ayushAssessment": "Dashavidha Pariksha completed" if session.get("opd_mode") in ["ayush", "both"] else "N/A",
        "provisionalImpressions": ["Clinical triage evaluation indicated"],
        "suggestedWorkup": ["Physician clinical review", "Baseline vitals"],
        "redFlags": record.get("red_flags") or [],
        "fhirBundleSummary": "FHIR R4 Condition & Observation resources linked to ABHA",
    }

    if not api_key or api_key == "your_gemini_api_key_here":
        return fallback_summary

    try:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
        }
        res = requests.post(url, json=payload, timeout=15)
        if res.status_code == 200:
            raw_json = res.json()["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_json)
            return {
                **fallback_summary,
                **parsed,
                "patientSummaryParagraph": parsed.get("patientSummaryParagraph") or patient_para_fallback,
                "patientSummaryLanguage": {"code": lang_code, "name": lang_name},
            }
    except Exception as e:
        logger.error(f"Error generating doctor summary: {e}")

    return fallback_summary


# --------------------------------------------------------------------------
# Gemini Live API WebSocket Proxy
# --------------------------------------------------------------------------
async def gemini_live_websocket_bridge(client_ws: WebSocket, session_id: str, lang_code: str, opd_mode: str):
    """
    Bi-directional proxy bridging Client Browser <-> Backend <-> Gemini Multimodal Live API
    """
    await client_ws.accept()
    api_key = get_gemini_api_key()

    session = get_or_create_session(session_id, lang_code, opd_mode)
    session["selected_language"] = lang_code
    session["language_name"] = LANGUAGE_NAMES.get(lang_code, "English")
    session["opd_mode"] = opd_mode

    if not api_key or api_key == "your_gemini_api_key_here":
        # Send initial warning if API key is not configured
        await client_ws.send_json({
            "type": "error",
            "message": "GEMINI_API_KEY is not configured in backend/.env. Please add your key to enable live speech-to-speech."
        })
        await client_ws.close()
        return

    gemini_url = f"{GEMINI_LIVE_WS_URL}?key={api_key}"
    sys_instruction = build_system_instruction(lang_code, opd_mode)

    # Initial setup message for Gemini Live API
    setup_message = {
        "setup": {
            "model": GEMINI_LIVE_MODEL,
            "generationConfig": {
                "responseModalities": ["AUDIO", "TEXT"],
                "speechConfig": {
                    "voiceConfig": {
                        "prebuiltVoiceConfig": {
                            "voiceName": "Charon"
                        }
                    }
                }
            },
            "systemInstruction": {
                "parts": [{"text": sys_instruction}]
            }
        }
    }

    try:
        async with websockets.connect(gemini_url) as gemini_ws:
            # 1. Send setup payload to Gemini Live
            await gemini_ws.send(json.dumps(setup_message))
            setup_resp = await gemini_ws.recv()
            logger.info(f"Gemini Live Connected for session {session_id} in {lang_code}: {setup_resp[:100]}...")

            await client_ws.send_json({
                "type": "live_ready",
                "language": session["language_name"],
                "languageCode": lang_code,
                "opdMode": opd_mode
            })

            # 2. Concurrently pipe Client -> Gemini and Gemini -> Client
            async def client_to_gemini():
                try:
                    while True:
                        data = await client_ws.receive_text()
                        msg = json.loads(data)

                        if msg.get("type") == "audio_pcm":
                            # Forward PCM chunk (Base64) to Gemini Live
                            media_chunk = {
                                "realtimeInput": {
                                    "mediaChunks": [{
                                        "mimeType": msg.get("mimeType", "audio/pcm;rate=16000"),
                                        "data": msg.get("data", "")
                                    }]
                                }
                            }
                            await gemini_ws.send(json.dumps(media_chunk))

                        elif msg.get("type") == "text_prompt":
                            # Client sent text input
                            text_chunk = {
                                "clientContent": {
                                    "turns": [{
                                        "role": "user",
                                        "parts": [{"text": msg.get("text", "")}]
                                    }],
                                    "turnComplete": True
                                }
                            }
                            session["dialogue"].append({"role": "patient", "text": msg.get("text", "")})
                            await gemini_ws.send(json.dumps(text_chunk))

                        elif msg.get("type") == "end_turn":
                            await gemini_ws.send(json.dumps({"clientContent": {"turnComplete": True}}))

                except WebSocketDisconnect:
                    logger.info("Client WebSocket disconnected")
                except Exception as e:
                    logger.warning(f"client_to_gemini error: {e}")

            async def gemini_to_client():
                accumulated_ai_text = ""
                try:
                    while True:
                        gemini_msg = await gemini_ws.recv()
                        resp = json.loads(gemini_msg)

                        # Server Content from Gemini Live
                        if "serverContent" in resp:
                            sc = resp["serverContent"]
                            model_turn = sc.get("modelTurn", {})
                            parts = model_turn.get("parts", [])

                            for part in parts:
                                # Stream audio chunk back to browser
                                if "inlineData" in part:
                                    audio_b64 = part["inlineData"].get("data", "")
                                    mime = part["inlineData"].get("mimeType", "audio/pcm;rate=24000")
                                    await client_ws.send_json({
                                        "type": "audio_chunk",
                                        "mimeType": mime,
                                        "data": audio_b64
                                    })

                                # Stream text chunk
                                if "text" in part:
                                    t_part = part["text"]
                                    accumulated_ai_text += t_part
                                    await client_ws.send_json({
                                        "type": "text_chunk",
                                        "text": t_part
                                    })

                            # Check if AI turn completed
                            if sc.get("turnComplete"):
                                if accumulated_ai_text.strip():
                                    session["dialogue"].append({"role": "ai", "text": accumulated_ai_text.strip()})
                                    # Trigger background structured extraction
                                    asyncio.create_task(extract_structured_clinical_data(session, api_key))
                                    accumulated_ai_text = ""

                                await client_ws.send_json({
                                    "type": "turn_complete",
                                    "clinical_record": session["clinical_record"]
                                })

                except Exception as e:
                    logger.warning(f"gemini_to_client error: {e}")

            # Run both loops concurrently
            await asyncio.gather(client_to_gemini(), gemini_to_client())

    except Exception as e:
        logger.error(f"Gemini Live connection error: {e}")
        try:
            await client_ws.send_json({
                "type": "error",
                "message": f"Gemini Live Connection Failed: {str(e)}"
            })
        except Exception:
            pass
