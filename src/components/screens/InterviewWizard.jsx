import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import useGeminiLive from '../../hooks/useGeminiLive';
import ModernMic from '../ui/ModernMic';
import { getTranslation } from '../../data/translations';
import { checkRedFlags, evaluateChestPainRisk } from '../../data/redFlagRules';
import { CHIEF_COMPLAINTS } from '../../data/questions';
import {
  getInitialComplaintQuestion,
  getNextFollowUpQuestion,
  getPathwayForComplaint,
} from '../../utils/clinicalFollowUpEngine';

const NUMBER_WORDS_MAP = {
  // English
  'one': 1, 'first': 1, '1': 1,
  'two': 2, 'second': 2, '2': 2,
  'three': 3, 'third': 3, '3': 3,
  'four': 4, 'fourth': 4, '4': 4,
  'five': 5, 'fifth': 5, '5': 5,
  'six': 6, 'sixth': 6, '6': 6,
  'seven': 7, 'seventh': 7, '7': 7,
  'eight': 8, 'eighth': 8, '8': 8,
  'nine': 9, 'ninth': 9, '9': 9,
  'ten': 10, 'tenth': 10, '10': 10,
  // Hindi
  'एक': 1, 'पहला': 1, 'दो': 2, 'दूसरा': 2, 'तीन': 3, 'तीसरा': 3,
  'चार': 4, 'चौथा': 4, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'सात': 7,
  'आठ': 8, 'नौ': 9, 'दस': 10,
  // Marathi
  'दोन': 2, 'दुसरा': 2, 'पाच': 5, 'सहा': 6, 'दहा': 10,
  // Bengali
  'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5, 'ছয়': 6, 'দশ': 10,
  // Tamil
  'ஒன்று': 1, 'இரண்டு': 2, 'மூன்று': 3, 'நான்கு': 4, 'ஐந்து': 5, 'பத்து': 10,
  // Telugu
  'ఒకటి': 1, 'రెండు': 2, 'మూడు': 3, 'నాలుగు': 4, 'ఐదు': 5, 'పది': 10,
  // Kannada
  'ಒಂದು': 1, 'ಎರಡು': 2, 'ಮೂರು': 3, 'ನಾಲ್ಕು': 4, 'ಐದು': 5, 'ಹತ್ತು': 10,
  // Gujarati
  'એક': 1, 'બે': 2, 'ત્રણ': 3, 'ચાર': 4, 'પાંચ': 5, 'છ': 6, 'દસ': 10,
};

const COMPLAINT_KEYWORDS = {
  fever_cough: [
    'fever', 'cough', 'cold', 'flu', 'shivering', 'phlegm',
    'बुखार', 'खांसी', 'जुकाम', 'कफ', 'ताप', 'खोकला', 'सर्दी',
    'காய்ச்சல்', 'இருமல்', 'சளி', 'జ్వరం', 'దగ్గు', 'ರೊಂಪ',
    'ಜ್ವರ', 'ಕೆಮ್ಮು', 'ನೆಗಡಿ', 'জ্বর', 'কাশি', 'સર્દિ', 'તાવ', 'ખાંસી',
  ],
  chest_pain: [
    'chest', 'heart', 'angina', 'tightness',
    'छाती', 'दर्द', 'छातीत', 'धड़कन', 'सीने',
    'நெஞ்சு', 'இதயம்', 'గుండె', 'ఛాతీ',
    'ಎದೆ', 'বুকে ব্যথা', 'છાતી',
  ],
  abdominal_pain: [
    'stomach', 'abdomen', 'belly', 'gut', 'cramps',
    'पेट', 'पोट', 'मरोड़', 'उल्टी', 'വയറു',
    'கడుపు', 'ಹೊಟ್ಟೆ', 'পেট', 'પેટ',
  ],
  headache: [
    'headache', 'head', 'migraine', 'dizzy', 'dizziness',
    'सिर', 'सिरदर्द', 'चक्कर', 'डोके', 'डोकेदुखी',
    'தலைவலி', 'తలనొప్పి', 'ತಲೆನೋವು', 'মাথাব্যথা', 'માથાનો દુખાવો',
  ],
  joint_pain: [
    'joint', 'knee', 'bone', 'back', 'spine', 'muscle', 'arthritis',
    'जोड़ों', 'घुटना', 'कमर', 'पीठ', 'सांधे', 'गुडघे',
    'மூட்டு', 'முதுகு', 'కీళ్ల', 'ನಡುಮು', 'ಕೀಲು', 'হাঁটু', 'સાંધા',
  ],
  skin: [
    'skin', 'rash', 'itch', 'itching', 'allergy', 'boil',
    'त्वचा', 'खुजली', 'खाज', 'தோல்', 'చర్మం', 'ಚರ್ಮ', 'ত্বক', 'ચામડી',
  ],
  diabetes_bp: [
    'diabetes', 'sugar', 'bp', 'pressure', 'hypertension',
    'शुगर', 'बीपी', 'मधुमेह', 'रक्तदाब', 'சர்க்கரை', 'షుగర్', 'ಮಧುಮೇಹ',
  ],
  women_health: [
    'period', 'pregnancy', 'menses', 'menstrual', 'pelvic',
    'महिला', 'मासिक', 'स्त्री', 'गर्भ', 'मासिक पाळी', 'கர்ப்பம்',
  ],
  eye_ear: [
    'eye', 'ear', 'vision', 'hearing', 'throat',
    'आंख', 'कान', 'गला', 'डोळे', 'घसा', 'கண்', 'కాது',
  ],
  urinary: [
    'urine', 'kidney', 'burning urine', 'bladder',
    'पेशाब', 'मूत्र', 'जलन', 'लघवी', 'சிறுநீர்', 'మూత్రం',
  ],
  mental_health: [
    'stress', 'sleep', 'anxiety', 'depression', 'insomnia',
    'तनाव', 'चिंता', 'नींद', 'झोप', 'மன அழுத்தம்', 'ఒత్తిడి',
  ],
};

const InterviewWizard = ({
  sessionId,
  language,
  opdMode = 'allopathy',
  onComplete,
  onRedFlag,
  speak,
}) => {
  const langCode = language?.code || 'en';
  const lang = language?.ttsLang || 'en-IN';
  const t = useMemo(() => getTranslation(langCode), [langCode]);

  // Initial Question (Chief Complaint Inquiry)
  const initialQText = useMemo(() => getInitialComplaintQuestion(langCode), [langCode]);

  // Unified Question State: Spoken AI Question & Displayed Screen Question are ALWAYS IDENTICAL
  const [currentQuestion, setCurrentQuestion] = useState({
    text: initialQText,
    options: CHIEF_COMPLAINTS.map((c) => ({
      id: c.id,
      label: t.complaints?.[c.id] || c.label,
      emoji: c.emoji,
      color: c.color,
    })),
    type: 'complaints',
    stageIndex: 0,
    isComplete: false,
    field: 'chief_complaint',
  });

  const [selectedComplaintKey, setSelectedComplaintKey] = useState(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [painRating, setPainRating] = useState(5);
  const [recordedEntities, setRecordedEntities] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [typedText, setTypedText] = useState('');

  const selectedComplaintKeyRef = useRef(null);
  const stageIndexRef = useRef(0);
  const prevLangCodeRef = useRef(null);
  const sendUserMessageRef = useRef(null);
  const lastSpokenTextRef = useRef('');

  // Add summary badge
  const addEntityBadge = useCallback((key, value) => {
    const iconMap = {
      chief_complaint: '🎯',
      onset: '⏱️',
      severity: '⚡',
      character: '🔍',
      radiation: '➡️',
      associated_symptoms: '🩺',
      current_medications: '💊',
      past_conditions: '📂',
      past_history: '📂',
      typed_query: '💬',
    };
    const icon = iconMap[key] || '📋';
    const label = `${key.replace(/_/g, ' ')}: ${value}`;
    setRecordedEntities((prev) => {
      const filtered = prev.filter((b) => !b.label.startsWith(`${key.replace(/_/g, ' ')}:`));
      return [...filtered, { icon, label }];
    });
  }, []);

  // Guarantee AI Voice Speaks the Exact Question Shown on Screen
  const speakCurrentQuestion = useCallback(
    (textToSpeak) => {
      if (!textToSpeak || textToSpeak === lastSpokenTextRef.current) return;
      lastSpokenTextRef.current = textToSpeak;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      speak?.(textToSpeak, lang);
    },
    [lang, speak]
  );

  // Initialize ONCE on mount or when language code changes
  useEffect(() => {
    if (prevLangCodeRef.current === langCode) return;
    prevLangCodeRef.current = langCode;

    const initQ = getInitialComplaintQuestion(langCode);
    setCurrentQuestion({
      text: initQ,
      options: CHIEF_COMPLAINTS.map((c) => ({
        id: c.id,
        label: t.complaints?.[c.id] || c.label,
        emoji: c.emoji,
        color: c.color,
      })),
      type: 'complaints',
      stageIndex: 0,
      isComplete: false,
      field: 'chief_complaint',
    });
    setStageIndex(0);
    stageIndexRef.current = 0;
    selectedComplaintKeyRef.current = null;
    setSelectedComplaintKey(null);
    lastSpokenTextRef.current = '';

    const timer = setTimeout(() => {
      speakCurrentQuestion(initQ);
    }, 150);
    return () => clearTimeout(timer);
  }, [langCode, speakCurrentQuestion, t.complaints]);

  // Complete Interview
  const handleFinishInterview = useCallback(
    (finalAnswers = answers) => {
      const activeKey = selectedComplaintKeyRef.current || selectedComplaintKey;
      const ccName = activeKey
        ? t.complaints?.[activeKey] || activeKey
        : finalAnswers.chief_complaint || 'General Consultation';

      let triagePriority = 'ROUTINE';
      let riskAnalysis = null;
      if (activeKey === 'chest_pain') {
        riskAnalysis = evaluateChestPainRisk(finalAnswers);
        triagePriority = riskAnalysis?.triagePriority || 'ROUTINE';
      }

      const mergedAnswers = {
        ...finalAnswers,
        chief_complaint: ccName,
        complaintKey: activeKey,
        severity: finalAnswers.severity || `${painRating}/10`,
        triagePriority,
        chestRisk: riskAnalysis,
        patient_queries: finalAnswers.patient_queries || answers.patient_queries || [],
        patient_notes: finalAnswers.patient_notes || answers.patient_notes || '',
      };

      onComplete?.({
        ...mergedAnswers,
        clinicalRecord: {
          ...mergedAnswers,
        },
      });
    },
    [answers, onComplete, painRating, selectedComplaintKey, t.complaints]
  );

  // Advance to Next Dynamic Symptom-Based Question
  const advanceToNextQuestion = useCallback(
    (answerValue, updatedAnswers = answers) => {
      const nextStageIdx = stageIndexRef.current + 1;
      stageIndexRef.current = nextStageIdx;
      setStageIndex(nextStageIdx);

      const activeKey = selectedComplaintKeyRef.current || selectedComplaintKey || 'fever_cough';

      // Determine follow-up question strictly according to patient's symptoms
      const nextQ = getNextFollowUpQuestion({
        stageIndex: nextStageIdx - 1, // pathway stages 0, 1, 2...
        complaintKey: activeKey,
        userText: answerValue,
        langCode,
        clinicalRecord: updatedAnswers,
      });

      if (nextQ.isComplete) {
        setCurrentQuestion({
          text: nextQ.questionText,
          options: [],
          type: 'completed',
          stageIndex: nextStageIdx,
          isComplete: true,
          field: 'complete',
        });
        speakCurrentQuestion(nextQ.questionText);
        return;
      }

      // Format options
      const formattedOptions = (nextQ.options || []).map((opt) => ({
        id: typeof opt === 'string' ? opt : opt.id || opt.label,
        label: typeof opt === 'string' ? opt : opt.label,
      }));

      const newQState = {
        text: nextQ.questionText,
        options: formattedOptions,
        type: nextQ.questionType || 'options',
        stageIndex: nextStageIdx,
        isComplete: false,
        field: nextQ.field,
      };

      setCurrentQuestion(newQState);
      // Synchronously speak the identical question shown on screen!
      speakCurrentQuestion(nextQ.questionText);
    },
    [answers, langCode, selectedComplaintKey, speakCurrentQuestion]
  );

  // Record Answer & Trigger Follow-Up
  const handleRecordAnswer = useCallback(
    (value, customField = null) => {
      if (!value) return;
      const valString = Array.isArray(value) ? value.join(', ') : String(value).trim();
      if (!valString) return;

      // 1. Immediate Multilingual Red Flag Emergency Check
      const detectedFlags = checkRedFlags(valString);
      if (detectedFlags && detectedFlags.length > 0) {
        onRedFlag?.(detectedFlags);
      }

      // 2. Identify Field to update
      const fieldKey = customField || currentQuestion.field || `step_${stageIndex}`;
      const newAnswers = { ...answers, [fieldKey]: valString };
      setAnswers(newAnswers);
      addEntityBadge(fieldKey, valString);

      if (fieldKey === 'severity') {
        const num = parseInt(valString, 10);
        if (!isNaN(num)) setPainRating(num);
      }

      // 2b. Evaluate Chest Pain emergency criteria only when relevant follow-up data is present
      const activeComplaintKey = selectedComplaintKeyRef.current || selectedComplaintKey;
      if (activeComplaintKey === 'chest_pain') {
        const chestRisk = evaluateChestPainRisk(newAnswers);
        if (chestRisk && chestRisk.isRedFlag) {
          onRedFlag?.([chestRisk.rule]);
        }
      }

      // 3. Inform live conversational backend
      sendUserMessageRef.current?.(valString);

      // 4. Progress to next dynamic question
      advanceToNextQuestion(valString, newAnswers);
    },
    [
      addEntityBadge,
      advanceToNextQuestion,
      answers,
      currentQuestion.field,
      onRedFlag,
      selectedComplaintKey,
      stageIndex,
    ]
  );

  // Handle Chief Complaint Card Selection (Turn 0)
  const handleSelectComplaintCard = useCallback(
    (complaintItem) => {
      const cKey = typeof complaintItem === 'string' ? complaintItem : complaintItem.id;
      const cLabel =
        typeof complaintItem === 'string'
          ? t.complaints?.[complaintItem] || complaintItem
          : complaintItem.label;

      selectedComplaintKeyRef.current = cKey;
      setSelectedComplaintKey(cKey);
      setAnswers((prev) => ({ ...prev, chief_complaint: cLabel }));
      addEntityBadge('chief_complaint', cLabel);

      // Do NOT trigger immediate red flag here on card selection!
      // Clinical triage for chest pain analyzes severity and follow-up indicators first.

      sendUserMessageRef.current?.(cLabel);
      stageIndexRef.current = 1;
      setStageIndex(1);

      // Fetch first symptom-specific follow-up question
      const firstFollowUp = getNextFollowUpQuestion({
        stageIndex: 0,
        complaintKey: cKey,
        userText: cLabel,
        langCode,
        clinicalRecord: { chief_complaint: cLabel },
      });

      const formattedOpts = (firstFollowUp.options || []).map((opt) => ({
        id: typeof opt === 'string' ? opt : opt.id || opt.label,
        label: typeof opt === 'string' ? opt : opt.label,
      }));

      const newQ = {
        text: firstFollowUp.questionText,
        options: formattedOpts,
        type: firstFollowUp.questionType || 'options',
        stageIndex: 1,
        isComplete: false,
        field: firstFollowUp.field,
      };

      setCurrentQuestion(newQ);
      speakCurrentQuestion(firstFollowUp.questionText);
    },
    [addEntityBadge, langCode, onRedFlag, speakCurrentQuestion, t.complaints]
  );

  // Handle Typed Query / Response (for patients who prefer typing instead of speaking in a crowd)
  const handleTypedSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      const query = typedText.trim();
      if (!query) return;

      // 1. Immediate Multilingual Red Flag Emergency Check
      const detectedFlags = checkRedFlags(query);
      if (detectedFlags && detectedFlags.length > 0) {
        onRedFlag?.(detectedFlags);
      }

      const newQueryItem = {
        question: currentQuestion.text,
        query,
        field: currentQuestion.field || `step_${stageIndex}`,
        stageIndex,
        timestamp: new Date().toISOString(),
      };

      const updatedQueries = [...(answers.patient_queries || []), newQueryItem];

      // Stage 0: Chief Complaint selection via typing
      if (currentQuestion.type === 'complaints') {
        let matchedKey = null;
        for (const [key, keywords] of Object.entries(COMPLAINT_KEYWORDS)) {
          if (keywords.some((kw) => query.toLowerCase().includes(kw.toLowerCase()))) {
            matchedKey = key;
            break;
          }
        }
        const finalKey = matchedKey || getPathwayForComplaint('other', query);
        selectedComplaintKeyRef.current = finalKey;
        setSelectedComplaintKey(finalKey);

        const newAnswers = {
          ...answers,
          chief_complaint: query,
          complaintKey: finalKey,
          patient_queries: updatedQueries,
          patient_notes: answers.patient_notes ? `${answers.patient_notes}; ${query}` : query,
        };
        setAnswers(newAnswers);
        addEntityBadge('chief_complaint', query);
        addEntityBadge('typed_query', query);

        sendUserMessageRef.current?.(query);
        setTypedText('');

        stageIndexRef.current = 1;
        setStageIndex(1);

        const firstFollowUp = getNextFollowUpQuestion({
          stageIndex: 0,
          complaintKey: finalKey,
          userText: query,
          langCode,
          clinicalRecord: newAnswers,
        });

        const formattedOpts = (firstFollowUp.options || []).map((opt) => ({
          id: typeof opt === 'string' ? opt : opt.id || opt.label,
          label: typeof opt === 'string' ? opt : opt.label,
        }));

        const newQ = {
          text: firstFollowUp.questionText,
          options: formattedOpts,
          type: firstFollowUp.questionType || 'options',
          stageIndex: 1,
          isComplete: false,
          field: firstFollowUp.field,
        };

        setCurrentQuestion(newQ);
        speakCurrentQuestion(firstFollowUp.questionText);
        return;
      }

      // Follow-up question stages
      const fieldKey = currentQuestion.field || `step_${stageIndex}`;
      const newAnswers = {
        ...answers,
        [fieldKey]: query,
        patient_queries: updatedQueries,
        patient_notes: answers.patient_notes ? `${answers.patient_notes}; ${query}` : query,
      };
      setAnswers(newAnswers);
      addEntityBadge(fieldKey, query);
      addEntityBadge('typed_query', query);

      if (fieldKey === 'severity') {
        const num = parseInt(query, 10);
        if (!isNaN(num)) setPainRating(num);
      }

      const activeComplaintKey = selectedComplaintKeyRef.current || selectedComplaintKey;
      if (activeComplaintKey === 'chest_pain') {
        const chestRisk = evaluateChestPainRisk(newAnswers);
        if (chestRisk && chestRisk.isRedFlag) {
          onRedFlag?.([chestRisk.rule]);
        }
      }

      sendUserMessageRef.current?.(query);
      setTypedText('');

      advanceToNextQuestion(query, newAnswers);
    },
    [
      addEntityBadge,
      advanceToNextQuestion,
      answers,
      currentQuestion.field,
      currentQuestion.text,
      currentQuestion.type,
      langCode,
      onRedFlag,
      selectedComplaintKey,
      speakCurrentQuestion,
      stageIndex,
      typedText,
    ]
  );

  // Handle Voice Input
  const handleVoiceInput = useCallback(
    (spokenText) => {
      if (!spokenText || !spokenText.trim()) return;
      const clean = spokenText.trim().toLowerCase();

      // Check red flags immediately
      const flags = checkRedFlags(spokenText);
      if (flags && flags.length > 0) {
        onRedFlag?.(flags);
      }

      // Stage 0: Chief Complaint selection via voice
      if (currentQuestion.type === 'complaints') {
        for (const [key, keywords] of Object.entries(COMPLAINT_KEYWORDS)) {
          if (keywords.some((kw) => clean.includes(kw.toLowerCase()))) {
            handleSelectComplaintCard(key);
            return;
          }
        }
        // Custom free-form symptom
        const customComplaint = spokenText.trim();
        const detectedPathway = getPathwayForComplaint('other', customComplaint);
        setSelectedComplaintKey(detectedPathway);
        handleSelectComplaintCard({ id: detectedPathway, label: customComplaint });
        return;
      }

      // Scale Questions (1-10 severity)
      if (currentQuestion.type === 'scale') {
        const digitMatch = clean.match(/\b([1-9]|10)\b/);
        if (digitMatch) {
          const num = parseInt(digitMatch[1], 10);
          setPainRating(num);
          handleRecordAnswer(`${num}/10`);
          return;
        }

        for (const [w, n] of Object.entries(NUMBER_WORDS_MAP)) {
          if (clean.includes(w)) {
            setPainRating(n);
            handleRecordAnswer(`${n}/10`);
            return;
          }
        }

        if (clean.includes('हल्का') || clean.includes('mild') || clean.includes('कम') || clean.includes('सौम्य')) {
          setPainRating(3);
          handleRecordAnswer('3/10 (Mild)');
          return;
        }
        if (clean.includes('मध्यम') || clean.includes('moderate')) {
          setPainRating(5);
          handleRecordAnswer('5/10 (Moderate)');
          return;
        }
        if (
          clean.includes('तेज') || clean.includes('severe') || clean.includes('तीव्र') ||
          clean.includes('असहनीय') || clean.includes('भयंकर')
        ) {
          setPainRating(8);
          handleRecordAnswer('8/10 (Severe)');
          return;
        }
      }

      // Option Matching
      if (currentQuestion.options && currentQuestion.options.length > 0) {
        // Ordinal matching (1, 2, 3...)
        for (const [kw, num] of Object.entries(NUMBER_WORDS_MAP)) {
          const idx = num - 1;
          if (clean === kw || clean === `${num}` || clean.startsWith(kw + ' ')) {
            if (currentQuestion.options[idx]) {
              handleRecordAnswer(currentQuestion.options[idx].label);
              return;
            }
          }
        }

        // Substring / Keyword matching
        for (const opt of currentQuestion.options) {
          const optLabel = opt.label.toLowerCase();
          if (optLabel.includes(clean) || clean.includes(optLabel)) {
            handleRecordAnswer(opt.label);
            return;
          }
        }
      }

      // Natural speech response as clinical answer
      handleRecordAnswer(spokenText.trim());
    },
    [currentQuestion.options, currentQuestion.type, handleRecordAnswer, handleSelectComplaintCard, onRedFlag]
  );

  // Synchronize Backend AI Turn with UI to prevent question mismatch
  const handleAiTurnResponse = useCallback(
    (turnData) => {
      setIsAiThinking(false);
      if (!turnData) return;

      // If backend detected red flags, trigger alert
      if (turnData.detected_red_flags && turnData.detected_red_flags.length > 0) {
        onRedFlag?.(turnData.detected_red_flags);
      }

      // If backend generated a personalized follow-up with options, synchronize it!
      if (turnData.question && turnData.options && Array.isArray(turnData.options) && turnData.options.length > 0) {
        const formattedOpts = turnData.options.map((opt) => ({
          id: typeof opt === 'string' ? opt : opt.id || opt.label,
          label: typeof opt === 'string' ? opt : opt.label,
        }));

        setCurrentQuestion((prev) => ({
          ...prev,
          text: turnData.question,
          options: formattedOpts,
          type: turnData.question_type || prev.type || 'options',
        }));

        // Spoken question and screen tap question are 100% synchronized!
        speakCurrentQuestion(turnData.question);
      }
    },
    [onRedFlag, speakCurrentQuestion]
  );

  const {
    isAiSpeaking,
    isListening,
    aiSpeechText,
    userSpeechText,
    error: liveError,
    startListening,
    stopListening,
    sendUserMessage,
  } = useGeminiLive({
    sessionId,
    languageCode: langCode,
    opdMode,
    onRedFlag,
    onUserSpeech: handleVoiceInput,
    onAiTurnResponse: handleAiTurnResponse,
    speakFallback: speakCurrentQuestion,
  });

  useEffect(() => {
    sendUserMessageRef.current = sendUserMessage;
  }, [sendUserMessage]);

  const handleMicToggle = () => {
    if (isAiSpeaking || (typeof window !== 'undefined' && window.speechSynthesis?.speaking)) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cancel errors
      }
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getEmojiForSeverity = (val) => {
    if (val <= 2) return '😊';
    if (val <= 4) return '😐';
    if (val <= 6) return '🙁';
    if (val <= 8) return '😣';
    return '😭';
  };

  const totalExpectedSteps = 5;
  const progressPercent = Math.min(Math.round((stageIndex / totalExpectedSteps) * 100), 100);

  return (
    <div className="screen-container screen-wide interview-screen-wrap animate-slide-up">
      {/* 2-Column Responsive Layout: Left = Unified Tap Question & Options, Right = Live Voice Mic */}
      <div className="interview-grid-layout">
        {/* ========================================================
            LEFT COLUMN: TAP QUESTION & SYMPTOM-TAILORED OPTIONS
            ======================================================== */}
        <div className="interview-left-col">
          {/* Progress Bar & Stage Indicator */}
          <div className="interview-progress">
            <div className="ip-track">
              <div className="ip-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="ip-label">
              {stageIndex === 0
                ? t.ccTitle || 'Primary Concern'
                : `Step ${stageIndex} of ${totalExpectedSteps}`}
            </span>
          </div>

          {/* MAIN UNIFIED QUESTION BANNER: Spoken by AI & Read on Screen */}
          <div className="screen-header" style={{ marginBottom: '1.25rem' }}>
            <span className="interview-ai-badge">
              🤖 AI Clinical Intake · {language?.nativeName || 'Multilingual'}
            </span>
            <h2 className="question-text" style={{ fontSize: '1.45rem', lineHeight: '1.4', marginTop: '0.4rem' }}>
              {currentQuestion.text}
            </h2>
            <p className="screen-subtitle" style={{ fontSize: '0.9rem', color: '#6B7280', marginTop: '0.3rem' }}>
              {currentQuestion.type === 'complaints'
                ? t.ccSubtitle || 'Tap your main health concern or speak into the microphone'
                : 'Tap an answer below or speak directly into the microphone.'}
            </p>
          </div>

          {/* ========================================================
              TAP OPTIONS CONTAINER (MATCHES THE CURRENT QUESTION)
              ======================================================== */}
          <div className="interview-tap-options-wrap">
            {/* VARIANT 0: CHIEF COMPLAINT CARDS */}
            {currentQuestion.type === 'complaints' && (
              <div className="complaint-grid">
                {currentQuestion.options.map((item) => (
                  <button
                    key={item.id}
                    className="complaint-card"
                    style={{ '--cc-color': item.color || '#3B82F6' }}
                    onClick={() => handleSelectComplaintCard(item)}
                  >
                    <span className="cc-emoji">{item.emoji}</span>
                    <span className="cc-label">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* VARIANT 1: 1-10 PAIN / SEVERITY SLIDER & QUICK PILLS */}
            {currentQuestion.type === 'scale' && (
              <div className="scale-container card" style={{ padding: '1.25rem' }}>
                <div className="scale-emojis">
                  <span className={`scale-emoji ${painRating <= 2 ? 'active-emoji' : ''}`}>😊</span>
                  <span className={`scale-emoji ${painRating > 2 && painRating <= 4 ? 'active-emoji' : ''}`}>😐</span>
                  <span className={`scale-emoji ${painRating > 4 && painRating <= 6 ? 'active-emoji' : ''}`}>🙁</span>
                  <span className={`scale-emoji ${painRating > 6 && painRating <= 8 ? 'active-emoji' : ''}`}>😣</span>
                  <span className={`scale-emoji ${painRating > 8 ? 'active-emoji' : ''}`}>😭</span>
                </div>

                <input
                  type="range"
                  className="pain-slider"
                  min="1"
                  max="10"
                  value={painRating}
                  onChange={(e) => setPainRating(Number(e.target.value))}
                />

                <div className="scale-labels">
                  <span>{t.severityMild || 'Mild (1)'}</span>
                  <span className="scale-value-display">
                    {getEmojiForSeverity(painRating)} {painRating} / 10
                  </span>
                  <span>{t.severitySevere || 'Severe (10)'}</span>
                </div>

                {/* Quick Tap Number Pills 1 to 10 */}
                <div className="pain-pills-row">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      className={`pain-pill-btn ${painRating === num ? 'selected' : ''}`}
                      onClick={() => {
                        setPainRating(num);
                        handleRecordAnswer(`${num}/10`);
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Contextual Severity Options */}
                {currentQuestion.options && currentQuestion.options.length > 0 && (
                  <div className="options-list" style={{ marginTop: '0.75rem' }}>
                    {currentQuestion.options.map((opt, idx) => (
                      <button
                        key={idx}
                        className="option-btn"
                        onClick={() => handleRecordAnswer(opt.label)}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ marginTop: '1rem', width: '100%', minHeight: '44px' }}
                  onClick={() => handleRecordAnswer(`${painRating}/10`)}
                >
                  {t.confirmSeverity || 'Confirm Severity →'}
                </button>
              </div>
            )}

            {/* VARIANT 2: DYNAMIC CONTEXTUAL OPTIONS LIST */}
            {currentQuestion.type === 'options' && (
              <div className={`options-list ${currentQuestion.options?.length > 3 ? 'options-grid-2col' : ''}`}>
                {currentQuestion.options?.map((opt, idx) => (
                  <button
                    key={idx}
                    className="option-btn"
                    onClick={() => handleRecordAnswer(opt.label)}
                  >
                    <span className="opt-bullet">👉</span>
                    <span style={{ fontWeight: 600 }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* VARIANT 3: INTAKE COMPLETED SCREEN */}
            {currentQuestion.type === 'completed' && (
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                <h3 style={{ color: '#166534', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  Clinical Intake Complete
                </h3>
                <p style={{ color: '#374151', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                  All your symptoms and answers have been securely recorded for the attending doctor.
                </p>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', padding: '0.85rem' }}
                  onClick={() => handleFinishInterview()}
                >
                  {t.completeInterviewBtn || 'Proceed to Medical Documents →'}
                </button>
              </div>
            )}
          </div>

          {/* Option to Type Query / Answer Instead of Speaking in Crowd */}
          {currentQuestion.type !== 'completed' && (
            <div className="interview-type-input-card animate-fade-in">
              <div className="type-card-header">
                <div className="type-card-title-wrap">
                  <span className="type-card-icon">⌨️</span>
                  <div>
                    <span className="type-card-title">
                      {t.typeOptionTitle || 'Type Your Answer / Query'}
                    </span>
                    <span className="type-card-sub">
                      {t.typeOptionSub || 'In a crowded area? Type your symptoms or query privately here.'}
                    </span>
                  </div>
                </div>
              </div>
              <form onSubmit={handleTypedSubmit} className="type-card-form">
                <div className="type-input-wrap">
                  <input
                    type="text"
                    className="type-text-input"
                    value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    placeholder={t.typePlaceholder || 'Type your query or answer here...'}
                    aria-label={t.typeOptionTitle || 'Type your query or answer here'}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-type-submit"
                    disabled={!typedText.trim()}
                  >
                    <span>{t.submitTypeBtn || 'Submit Query →'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Real-time Recorded Entity Badges */}
          {recordedEntities.length > 0 && (
            <div className="interview-badges-summary" style={{ marginTop: '1.25rem' }}>
              <span className="badges-title">📋 {t.clinicalDetailsRecorded || 'Recorded Clinical Details:'}</span>
              <div className="badges-wrap">
                {recordedEntities.map((badge, idx) => (
                  <span key={idx} className="clinical-badge animate-fade-in">
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Early Completion Option */}
          {stageIndex >= 2 && currentQuestion.type !== 'completed' && (
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                onClick={() => handleFinishInterview()}
              >
                {t.completeInterviewBtn || 'Done Describing Symptoms → Proceed'}
              </button>
            </div>
          )}
        </div>

        {/* ========================================================
            RIGHT COLUMN: STICKY RIGHT-CORNER LIVE MIC PANEL
            ======================================================== */}
        <div className="interview-right-col">
          <div
            className={`interview-voice-panel ${
              isAiSpeaking ? 'ai-active' : isListening ? 'user-active' : ''
            }`}
          >
            <div className="live-status-indicator">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="live-pulse-dot" />
                <span className="live-status-text">
                  {isAiSpeaking
                    ? t.aiSpeaking || 'AI Doctor is speaking...'
                    : isListening
                    ? t.listening || 'Listening to your voice...'
                    : t.voiceHint || 'Tap mic to speak naturally'}
                </span>
              </div>
              <span className="live-lang-tag">🌐 {language?.nativeName}</span>
            </div>

            {/* Conversation Stream Dialogue */}
            <div className="live-conversation-stream">
              <div className="live-ai-bubble animate-fade-in">
                <span className="bubble-speaker">👨‍⚕️ Dr. Ayush</span>
                <p className="bubble-text">{currentQuestion.text}</p>
              </div>

              {userSpeechText && (
                <div className="live-user-bubble animate-fade-in">
                  <span className="bubble-speaker">👤 {language?.nativeName || 'Patient'}</span>
                  <p className="bubble-text">"{userSpeechText}"</p>
                </div>
              )}
            </div>

            {/* Centered Modern Studio Mic */}
            <ModernMic
              isListening={isListening}
              isAiSpeaking={isAiSpeaking}
              onToggle={handleMicToggle}
              onClick={handleMicToggle}
              error={liveError}
              labelIdle={t.tapToSpeak || 'Tap to speak'}
              labelListening={t.listening || 'Listening... Speak now'}
              labelSpeaking={t.aiSpeaking || 'AI Doctor is speaking...'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InterviewWizard);
