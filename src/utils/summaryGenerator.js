// Generates structured physician-ready clinical summary and patient-friendly native language paragraph from interview answers

export const LANGUAGE_DISPLAY_NAMES = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  bn: 'বাংলা (Bengali)',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
  kn: 'ಕನ್ನಡ (Kannada)',
  mr: 'मराठी (Marathi)',
  gu: 'ગુજરાતી (Gujarati)',
};

/**
 * Normalizes patient responses from any of the 8 Indian languages into standardized Medical English.
 */
export const normalizeToEnglishClinicalTerm = (val, field = '', complaintKey = '') => {
  if (!val) return 'None reported';
  const str = (Array.isArray(val) ? val.join(' ') : String(val)).toLowerCase().trim();
  if (!str || str === 'none' || str === 'none of these' || str === 'not specified') {
    return 'None reported';
  }

  // --- 1. CHIEF COMPLAINT NORMALIZATION ---
  if (field === 'chief_complaint' || field === 'cc') {
    if (str.includes('chest') || str.includes('सीने') || str.includes('छाती') || str.includes('বুক') || str.includes('நெஞ்சு') || str.includes('ఛాతీ') || str.includes('ಎದೆ') || str.includes('છાતી')) {
      return 'Chest Pain / Discomfort (Retrosternal chest distress)';
    }
    if (str.includes('fever') || str.includes('cough') || str.includes('बुखार') || str.includes('खांसी') || str.includes('ताप') || str.includes('खोकला') || str.includes('জ্বর') || str.includes('কাশি') || str.includes('காய்ச்சல்') || str.includes('இருமல்') || str.includes('జ్వరం') || str.includes('దగ్గు') || str.includes('ಜ್ವರ') || str.includes('ಕೆಮ್ಮು') || str.includes('તાવ') || str.includes('ખાંસી')) {
      return 'Acute Febrile Illness & Cough (Upper/Lower Respiratory symptoms)';
    }
    if (str.includes('abdomen') || str.includes('stomach') || str.includes('belly') || str.includes('पेट') || str.includes('पोट') || str.includes('পেট') || str.includes('வயிறு') || str.includes('కడుపు') || str.includes('ಹೊಟ್ಟೆ') || str.includes('પેટ')) {
      return 'Abdominal Pain / Gastrointestinal Distress';
    }
    if (str.includes('headache') || str.includes('सिरदर्द') || str.includes('डोकेदुखी') || str.includes('মাথাব্যথা') || str.includes('தலைவலி') || str.includes('తలనొప్పి') || str.includes('ತಲೆನೋವು') || str.includes('માથાનો દુખાવો')) {
      return 'Cephalea / Acute Headache';
    }
    if (str.includes('joint') || str.includes('घुटने') || str.includes('जोड़ों') || str.includes('सांधे') || str.includes('গাঁট') || str.includes('மூட்டு') || str.includes('కీళ్ల') || str.includes('ಕೀಲು') || str.includes('સાંધા')) {
      return 'Arthralgia / Joint Pain';
    }
    if (str.includes('weakness') || str.includes('fatigue') || str.includes('कमजोरी') || str.includes('थकान') || str.includes('अशक्तपणा') || str.includes('দুর্বলতা') || str.includes('சோர்வு') || str.includes('నీరసం') || str.includes('ಆಯಾಸ') || str.includes('નબળાઈ')) {
      return 'Generalized Asthenia / Malaise & Fatigue';
    }
    if (str.includes('skin') || str.includes('rash') || str.includes('खुजली') || str.includes('त्वचा') || str.includes('চুলকানি') || str.includes('தோல்') || str.includes('చర్మం') || str.includes('ಚರ್ಮ') || str.includes('ચામડી')) {
      return 'Dermatological Rash / Pruritus';
    }
    return val;
  }

  // --- 2. ONSET & DURATION ---
  if (field === 'onset') {
    if (str.includes('past 1-2 hours') || str.includes('1-2 घंटे') || str.includes('1-2 तासात') || str.includes('১-২ ঘণ্টা') || str.includes('1-2 மணி') || str.includes('1-2 గంట') || str.includes('1-2 ಗಂಟೆ') || str.includes('૧-૨ કલાક')) {
      return 'Hyperacute onset (< 2 hours prior to presentation)';
    }
    if (str.includes('today') || str.includes('morning') || str.includes('आज') || str.includes('सुबह') || str.includes('सकाळ') || str.includes('আজ') || str.includes('இன்று') || str.includes('ఈ రోజే') || str.includes('ಇಂದು') || str.includes('આજે')) {
      return 'Acute onset today (since morning)';
    }
    if (str.includes('1-2 day') || str.includes('1-2 दिन') || str.includes('1-2 दिवस') || str.includes('১-২ দিন') || str.includes('1-2 நாள்') || str.includes('1-2 రోజు') || str.includes('1-2 ದಿನ') || str.includes('૧-૨ દિવસ')) {
      return 'Acute onset (1-2 days duration)';
    }
    if (str.includes('3-5 day') || str.includes('3-5 दिन') || str.includes('3-5 दिवस') || str.includes('৩-৫ দিন') || str.includes('3-5 நாள்') || str.includes('3-5 రోజు') || str.includes('3-5 ದಿನ') || str.includes('૩-૫ દિવસ')) {
      return 'Subacute onset (3-5 days duration)';
    }
    if (str.includes('week') || str.includes('हफ्ते') || str.includes('आठवड') || str.includes('সপ্তাহ') || str.includes('வாரம்') || str.includes('వారం') || str.includes('ವಾರ') || str.includes('અઠવાડિ')) {
      return 'Prolonged / persistent duration (> 1 week)';
    }
    if (str.includes('stairs') || str.includes('walking') || str.includes('सीढ़ी') || str.includes('चलने') || str.includes('पायऱ्या') || str.includes('হাঁটার') || str.includes('நடக்கும்') || str.includes('నడుస్తున్న') || str.includes('ಮೆಟ್ಟಿಲು') || str.includes('ચાલતા')) {
      return 'Exertional onset precipitated by physical exertion / stair climbing';
    }
    if (str.includes('continuous') || str.includes('लगातार') || str.includes('सतत') || str.includes('একটানা') || str.includes('தொடர்') || str.includes('నిరంతరం') || str.includes('ನಿರಂತರ') || str.includes('સતત')) {
      return 'Constant, persistent continuous ache';
    }
  }

  // --- 3. CHARACTER / RADIATION ---
  if (field === 'radiation' || field === 'character') {
    if (str.includes('left arm') || str.includes('jaw') || str.includes('shoulder') || str.includes('बाएं हाथ') || str.includes('जबड़े') || str.includes('डाव्या हात') || str.includes('जबड') || str.includes('বাঁ হাত') || str.includes('চোয়াল') || str.includes('இடது கை') || str.includes('தாடை') || str.includes('ఎడమ చేయి') || str.includes('దవడ') || str.includes('ಎಡಗೈ') || str.includes('ದವಡೆ') || str.includes('ડાબા હાથ') || str.includes('જડબા')) {
      return 'Radiating to left upper extremity and mandibular/jaw region (High-risk cardiac distribution)';
    }
    if (str.includes('crushing') || str.includes('heavy pressure') || str.includes('भारी दबाव') || str.includes('जकड़न') || str.includes('तीव्र दाब') || str.includes('கடுமையான அழுத்தம்') || str.includes('తీవ్రమైన ఒత్తిడి') || str.includes('ಭಾರವಾದ ಒತ್ತಡ') || str.includes('ભારે દબાણ')) {
      return 'Retrosternal crushing constriction with central tightness';
    }
    if (str.includes('burning') || str.includes('gas') || str.includes('acidity') || str.includes('जलन') || str.includes('गैस') || str.includes('जळजळ') || str.includes('গ্যাস') || str.includes('நெஞ்செரிச்சல்') || str.includes('ఎసిడిటీ') || str.includes('ಉರಿ') || str.includes('એસિડિટી')) {
      return 'Retrosternal burning sensation suggestive of gastroesophageal reflux / dyspepsia';
    }
    if (str.includes('localized') || str.includes('touching') || str.includes('छूने') || str.includes('दाबल्यावर') || str.includes('এক জায়গাতেই') || str.includes('ஒரே இடத்தில்') || str.includes('ఒకే చోట') || str.includes('ಒಂದೇ ಕಡೆ') || str.includes('એક જ જગ્યાએ')) {
      return 'Well-localized focal tenderness on palpation (musculoskeletal chest wall pain)';
    }
    if (str.includes('no radiation') || str.includes('कहीं नहीं') || str.includes('कुठेही नाही') || str.includes('ছড়িয়ে পড়ছে না') || str.includes('பரவவில்லை') || str.includes('వ్యాపించడం లేదు') || str.includes('ಎಲ್ಲೂ ಇಲ್ಲ') || str.includes('ક્યાંય નથી')) {
      return 'Non-radiating; isolated to primary anatomical site';
    }
    if (str.includes('dry') || str.includes('सूखी') || str.includes('कोरडा') || str.includes('শুকনো') || str.includes('வறட்டு') || str.includes('పొడి') || str.includes('ಒಣ') || str.includes('સૂકી')) {
      return 'Dry, non-productive irritating cough';
    }
    if (str.includes('phlegm') || str.includes('mucus') || str.includes('कफ') || str.includes('बलगम') || str.includes('সளி') || str.includes('కఫం') || str.includes('ಕಫ') || str.includes('કફ')) {
      return 'Productive cough with mucopurulent expectoration';
    }
    if (str.includes('sore throat') || str.includes('खराश') || str.includes('गले') || str.includes('घशात') || str.includes('গলায়') || str.includes('தொண்டை') || str.includes('గొంతు') || str.includes('ಗಂಟಲು') || str.includes('ગળામાં')) {
      return 'Pharyngeal erythema with odynophagia / severe sore throat';
    }
    if (str.includes('breathless') || str.includes('सांस फूल') || str.includes('दम') || str.includes('শ্বাসকষ্ট') || str.includes('மூச்சுத் திணறல்') || str.includes('ఆయాసం') || str.includes('ಉಸಿರಾಟ') || str.includes('શ્વાસ ચડવો')) {
      return 'Shortness of breath on mild exertion (dyspnea)';
    }
  }

  // --- 4. SEVERITY ---
  if (field === 'severity') {
    const numMatch = str.match(/\b([1-9]|10)\b/);
    const num = numMatch ? parseInt(numMatch[1], 10) : null;
    if (num !== null) {
      if (num >= 9) return `${num}/10 (Critical / Severe Unbearable Pain)`;
      if (num >= 7) return `${num}/10 (Severe Gripping Discomfort - Impairing Activity)`;
      if (num >= 4) return `${num}/10 (Moderate Ache / Distress)`;
      return `${num}/10 (Mild Discomfort)`;
    }
    if (str.includes('severe') || str.includes('तेज') || str.includes('तीव्र') || str.includes('असहनीय') || str.includes('ভীষণ') || str.includes('கடுமையான') || str.includes('తీవ్ర') || str.includes('ತೀವ್ರ') || str.includes('અતિશય')) {
      return '8/10 (Severe Pain)';
    }
    if (str.includes('moderate') || str.includes('मध्यम') || str.includes('মাঝারি') || str.includes('மிதமான') || str.includes('మోస్తరు') || str.includes('ಮಧ್ಯಮ') || str.includes('મધ્યમ')) {
      return '5/10 (Moderate Pain)';
    }
    if (str.includes('mild') || str.includes('हल्का') || str.includes('सौम्य') || str.includes('হালকা') || str.includes('லேசான') || str.includes('తేలికపాటి') || str.includes('ಸಾಧಾರಣ') || str.includes('હળવું')) {
      return '3/10 (Mild Pain)';
    }
  }

  // --- 5. PAST MEDICAL HISTORY ---
  if (field === 'past_history' || field === 'past_conditions') {
    const findings = [];
    if (str.includes('bp') || str.includes('pressure') || str.includes('बीपी') || str.includes('রক্তচাপ') || str.includes('இரத்த அழுத்தம்') || str.includes('రక్తపోటు') || str.includes('ರಕ್ತದೊತ್ತಡ') || str.includes('હાઈ બીપી')) {
      findings.push('Systemic Hypertension');
    }
    if (str.includes('sugar') || str.includes('diabetes') || str.includes('शुगर') || str.includes('मधुमेह') || str.includes('ডায়াবেটিস') || str.includes('சர்க்கரை') || str.includes('డయాబెటిస్') || str.includes('ಮಧುಮೇಹ') || str.includes('ડાયાબિટીસ')) {
      findings.push('Type 2 Diabetes Mellitus');
    }
    if (str.includes('stent') || str.includes('bypass') || str.includes('स्टेंट') || str.includes('स्टंट') || str.includes('স্টেন্ট') || str.includes('ஸ்டென்ட்') || str.includes('స్టెంట్') || str.includes('ಸ್ಟೆಂಟ್') || str.includes('સ્ટેન્ટ')) {
      findings.push('Prior Percutaneous Coronary Intervention (PCI / Stent placement)');
    }
    if (str.includes('heart') || str.includes('कार्डियक') || str.includes('दिल') || str.includes('हृदय') || str.includes('হার্ট') || str.includes('இதயம்') || str.includes('గుండె') || str.includes('ಹೃದಯ')) {
      findings.push('Known Ischemic Heart Disease / Cardiovascular History');
    }
    if (findings.length > 0) return findings.join(', ');
    if (str.includes('no prior') || str.includes('नहीं') || str.includes('नाही') || str.includes('না') || str.includes('இல்லை') || str.includes('లేదు') || str.includes('ಇಲ್ಲ') || str.includes('ના')) {
      return 'No known prior chronic medical comorbidities';
    }
  }

  // --- 6. MEDICATIONS ---
  if (field === 'medications' || field === 'current_medications') {
    if (str.includes('paracetamol') || str.includes('पैरासिटामोल') || str.includes('প্যারাসিটামল') || str.includes('பாராசிட்டமால்') || str.includes('పారాసిటమాల్') || str.includes('ಪ್ಯಾರಸಿಟಮಲ್') || str.includes('પેરાસીટામોલ')) {
      return 'Oral Paracetamol (temporary antipyretic / analgesic effect reported)';
    }
    if (str.includes('antibiotic') || str.includes('एंटीबायोटिक') || str.includes('অ্যান্টিবায়োটিক') || str.includes('ஆன்டிபயாடிக்') || str.includes('యాంటీబయాటిక్స్') || str.includes('ಆಂಟಿಬಯೋಟಿಕ್')) {
      return 'Recent course of oral antibiotics';
    }
    if (str.includes('tea') || str.includes('herbal') || str.includes('काढ़ा') || str.includes('काढा') || str.includes('ক্বাথ') || str.includes('கஷாயம்') || str.includes('కషాయం') || str.includes('ಉಕಾಡೊ')) {
      return 'Indigenous herbal decoctions / traditional home remedies';
    }
    if (str.includes('bp') || str.includes('heart') || str.includes('दवाएं') || str.includes('औषधे') || str.includes('మందులు') || str.includes('ದವಾ')) {
      return 'Regular antihypertensive / cardioprotective pharmacotherapy';
    }
    if (str.includes('no medicines') || str.includes('कोई दवा नहीं') || str.includes('ঔষধ নেইনি') || str.includes('எந்த மருந்தும்') || str.includes('ఏ మందులు') || str.includes('ಯಾವುದೇ ಔಷಧಿ') || str.includes('કોઈ દવા નથી')) {
      return 'Nil regular medications reported prior to intake';
    }
  }

  return val;
};

export const generateSummary = (
  rawAnswers = {},
  mode = 'allopathy',
  langCode = 'en',
  patient = null,
  documents = []
) => {
  const clinicalRecord =
    (rawAnswers && (rawAnswers.clinicalRecord || rawAnswers.clinical_record)) || {};
  const answers = {
    ...clinicalRecord,
    ...(rawAnswers || {}),
  };

  const toSafeString = (val, fallback = 'None') => {
    if (val === null || val === undefined || val === '') return fallback;
    if (typeof val === 'string') return val.trim() || fallback;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (Array.isArray(val)) {
      const filtered = val.filter((x) => x && x !== 'None' && x !== 'None of these');
      return filtered.length > 0
        ? filtered.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(', ')
        : fallback;
    }
    if (typeof val === 'object') {
      const entries = Object.entries(val)
        .filter(([, v]) => v != null && v !== 'None')
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
      return entries.length > 0 ? entries.join('; ') : fallback;
    }
    return String(val);
  };

  const rawCC = answers.chief_complaint || clinicalRecord.chief_complaint;
  const cc = normalizeToEnglishClinicalTerm(rawCC, 'chief_complaint');

  const rawOnset = answers.onset || clinicalRecord.onset;
  const onset = normalizeToEnglishClinicalTerm(rawOnset, 'onset');

  let rawSev = answers.severity !== undefined ? answers.severity : clinicalRecord.severity;
  const severity = normalizeToEnglishClinicalTerm(rawSev, 'severity');

  const rawCharacter = answers.character || clinicalRecord.character;
  const character = normalizeToEnglishClinicalTerm(rawCharacter, 'character');

  const rawRadiation = answers.radiation || clinicalRecord.radiation;
  const radiation = normalizeToEnglishClinicalTerm(rawRadiation, 'radiation');

  const aggravating = toSafeString(answers.aggravating || clinicalRecord.aggravating, 'None reported');
  const relieving = toSafeString(answers.relieving || clinicalRecord.relieving, 'None reported');
  const associated = toSafeString(
    answers.associated_symptoms || clinicalRecord.associated_symptoms || answers.associated,
    'None reported'
  );

  const rawPastConditions = answers.past_conditions || answers.past_history || clinicalRecord.past_history;
  const pastConditions = normalizeToEnglishClinicalTerm(rawPastConditions, 'past_history');

  const rawCurrentMeds = answers.current_medications || clinicalRecord.current_medications;
  const currentMeds = normalizeToEnglishClinicalTerm(rawCurrentMeds, 'medications');

  const rawAllergies = answers.allergies || clinicalRecord.allergies;
  const allergies = toSafeString(
    rawAllergies && Array.isArray(rawAllergies) && rawAllergies.length === 0
      ? 'No known drug allergies (NKDA)'
      : rawAllergies,
    'No known drug allergies (NKDA)'
  );

  const familyHx = toSafeString(answers.family_history || clinicalRecord.family_history, 'None reported');

  const rosResp = toSafeString(answers.ros_respiratory, 'No significant symptoms');
  const rosGI = toSafeString(answers.ros_gi, 'No significant symptoms');
  const rosNeuro = toSafeString(answers.ros_neuro, 'No significant symptoms');

  // Determine Triage Category
  let triagePriority = answers.triagePriority || 'ROUTINE';
  if (answers.chestRisk && answers.chestRisk.triagePriority) {
    triagePriority = answers.chestRisk.triagePriority;
  } else if (String(rawSev).includes('8') || String(rawSev).includes('9') || String(rawSev).includes('10')) {
    triagePriority = 'CRITICAL';
  } else if (String(rawSev).includes('5') || String(rawSev).includes('6') || String(rawSev).includes('7')) {
    triagePriority = 'URGENT';
  }

  const ayushSection = mode === 'ayush' || mode === 'both' ? generateAyushSummary(answers) : null;
  const normalizedLang = (langCode || 'en').toLowerCase().slice(0, 2);

  // Generate patient paragraph in their selected language
  const patientParagraph = generatePatientParagraph(
    answers,
    normalizedLang,
    patient,
    mode,
    documents
  );

  // Generate physician narrative summary in standard medical English
  const physicianNarrative = generatePhysicianNarrative(answers, mode, {
    cc,
    onset,
    severity,
    character,
    radiation,
    aggravating,
    relieving,
    associated,
    pastConditions,
    currentMeds,
    allergies,
    rosResp,
    rosGI,
    rosNeuro,
    triagePriority,
    ayushSection,
  });

  const { differentials, physicianActions } = getClinicalDifferentialsAndActions(cc);

  return {
    patientSummaryParagraph: patientParagraph,
    patientSummaryLanguage: {
      code: normalizedLang,
      name: LANGUAGE_DISPLAY_NAMES[normalizedLang] || 'English',
    },
    doctorReadySummaryEnglish: physicianNarrative,
    triagePriority,
    chiefComplaint: cc,
    differentials,
    physicianActions,
    hpi: {
      onset,
      severity,
      character,
      radiation,
      aggravating,
      relieving,
      associated,
    },
    pastHistory: {
      medicalConditions: pastConditions,
      surgicalHistory: toSafeString(
        answers.past_surgery || answers.surgical_history,
        'No prior surgeries reported'
      ),
      hospitalizations: toSafeString(answers.hospitalizations, 'None'),
    },
    drugAllergyHistory: {
      currentMedications: currentMeds,
      allergies: allergies,
    },
    familyHistory: familyHx,
    personalHistory: {
      smoking: toSafeString(answers.smoking, 'Not specified'),
      alcohol: toSafeString(answers.alcohol, 'Not specified'),
      diet: toSafeString(answers.diet, 'Not specified'),
      exercise: toSafeString(answers.exercise, 'Not specified'),
      occupation: toSafeString(answers.occupation, 'Not specified'),
    },
    reviewOfSystems: {
      respiratory: rosResp,
      gastrointestinal: rosGI,
      neurological: rosNeuro,
    },
    patientQueries: answers.patient_queries || [],
    patientNotes: answers.patient_notes || '',
    ayush: ayushSection,
    generatedAt: new Date().toISOString(),
    mode,
  };
};

/**
 * Generate a friendly, empathetic, jargon-free summary in paragraph format
 * in the patient's selected native language.
 */
export const generatePatientParagraph = (
  answers = {},
  langCode = 'en',
  patient = null,
  mode = 'allopathy',
  documents = []
) => {
  const patientName = patient?.name?.trim() ? patient.name.trim() : '';

  const defaultCCMap = {
    en: 'general health concern',
    hi: 'स्वास्थ्य संबंधी समस्या',
    mr: 'आरोग्य समस्या',
    bn: 'স্বাস্থ্য সম্পর্কিত সমস্যা',
    ta: 'சுகாதார பிரச்சனை',
    te: 'ఆరోగ్య సమస్య',
    kn: 'ಆರೋಗ್ಯ ಸಮಸ್ಯೆ',
    gu: 'સ્વાસ્થ્ય સમસ્યા',
  };
  const defaultCC = defaultCCMap[langCode] || 'general health concern';

  const cc = (
    answers.chief_complaint ||
    answers.complaint ||
    answers.symptom ||
    defaultCC
  ).toString().trim();

  const onset = answers.onset ? String(answers.onset).trim() : '';
  const severityRaw = answers.severity !== undefined ? String(answers.severity).replace('/10', '').trim() : '';
  const severity = severityRaw ? `${severityRaw}/10` : '';
  const character = answers.character ? String(answers.character).trim() : '';
  const aggravating = answers.aggravating && answers.aggravating !== 'None' ? String(answers.aggravating).trim() : '';
  const relieving = answers.relieving && answers.relieving !== 'None' ? String(answers.relieving).trim() : '';
  const associated = answers.associated_symptoms || answers.associated;
  const associatedStr = Array.isArray(associated) ? associated.filter(Boolean).join(', ') : (associated && associated !== 'None' ? String(associated) : '');

  const pastConditions = answers.past_conditions || answers.past_history;
  const pastStr = Array.isArray(pastConditions) ? pastConditions.join(', ') : (pastConditions && pastConditions !== 'None reported' && pastConditions !== 'None' ? String(pastConditions) : '');

  const meds = answers.current_medications;
  const medsStr = Array.isArray(meds) ? meds.join(', ') : (meds && meds !== 'None' ? String(meds) : '');

  const allergies = answers.allergies;
  const allergyStr = Array.isArray(allergies) ? allergies.join(', ') : (allergies && !String(allergies).toLowerCase().includes('no known') && allergies !== 'None' ? String(allergies) : '');

  const docsCount = Array.isArray(documents) ? documents.length : 0;
  const ayushPrakriti = (mode === 'ayush' || mode === 'both') ? extractPrakritiType(answers) : '';

  const typedQueries = Array.isArray(answers.patient_queries)
    ? answers.patient_queries.map((q) => (typeof q === 'string' ? q : q.query)).filter(Boolean)
    : answers.patient_notes
    ? [answers.patient_notes]
    : [];
  const queriesStr = typedQueries.join('; ');

  switch (langCode) {
    case 'hi': {
      const greeting = patientName ? `नमस्ते ${patientName} जी।` : 'नमस्ते।';
      const onsetText = onset ? ` जो लगभग ${onset} से अनुभव हो रही है` : '';
      const sevText = severity ? ` (तकलीफ की तीव्रता: 10 में से ${severity.replace('/10', '')})` : '';
      const charText = character ? `। दर्द का स्वरूप "${character}" जैसा है` : '';
      
      let factorText = '';
      if (aggravating && relieving) {
        factorText = `। यह समस्या ${aggravating} पर बढ़ सकती है तथा ${relieving} से कुछ आराम मिलता है`;
      } else if (aggravating) {
        factorText = `। यह समस्या विशेष रूप से ${aggravating} पर बढ़ती है`;
      } else if (relieving) {
        factorText = `। ${relieving} से इसमें कुछ राहत मिलती है`;
      }

      const assocText = associatedStr ? `। साथ ही ${associatedStr} के लक्षण भी दर्ज हैं` : '';
      const pastText = pastStr ? ` पिछली बीमारियों में ${pastStr} का इतिहास दर्ज है` : ' किसी गंभीर पिछली बीमारी का इतिहास दर्ज नहीं है';
      const medText = medsStr ? ` और आप वर्तमान में ${medsStr} का सेवन कर रहे हैं` : '';
      const allgText = allergyStr ? ` ध्यान दें: आपको ${allergyStr} से एलर्जी दर्ज है।` : ' किसी दवा या पदार्थ से कोई ज्ञात एलर्जी नहीं है।';
      const ayushText = ayushPrakriti && ayushPrakriti !== 'Not assessed' ? ` आयुष मूल्यांकन के अनुसार आपकी शारीरिक प्रकृति ${ayushPrakriti} पायी गई है।` : '';
      const docText = docsCount > 0 ? ` आपके ${docsCount} पुराने मेडिकल दस्तावेज़ भी सफलतापूर्वक संलग्न कर दिए गए हैं।` : '';
      const queryText = queriesStr ? ` आपके द्वारा टाइप किए गए विशेष प्रश्न/टिप्पणी: "${queriesStr}" भी डॉक्टर साहब के समक्ष प्रस्तुत किए जाएंगे।` : '';

      return `${greeting} आपके स्वास्थ्य परामर्श का संक्षिप्त विवरण: आप मुख्य रूप से "${cc}" की समस्या के लिए उपस्थित हुए हैं${onsetText}${sevText}${charText}${factorText}${assocText}।${pastText}${medText}।${allgText}${ayushText}${docText}${queryText} आपकी यह सारी जानकारी डॉक्टर साहब के पास सुरक्षित रूप से पहुंच चुकी है। कृपया डॉक्टर से प्रत्यक्ष परीक्षण करवाकर उनकी सलाह अनुसार अपनी दिनचर्या और दवाएं जारी रखें।`;
    }

    case 'mr': {
      const greeting = patientName ? `नमस्कार ${patientName} जी.` : 'नमस्कार.';
      const onsetText = onset ? ` जो साधारणतः ${onset} पासून जाणवत आहे` : '';
      const sevText = severity ? ` (त्रासाची तीव्रता: 10 पैकी ${severity.replace('/10', '')})` : '';
      const charText = character ? `. त्रासाचे स्वरूप "${character}" प्रकारात नोंदवले गेले आहे` : '';
      
      let factorText = '';
      if (aggravating && relieving) {
        factorText = `. ${aggravating} मुळे त्रास वाढतो व ${relieving} मुळे थोडा आराम मिळतो`;
      } else if (aggravating) {
        factorText = `. ${aggravating} मुळे हा त्रास अधिक जाणवतो`;
      } else if (relieving) {
        factorText = `. ${relieving} मुळे थोडे बरे वाटते`;
      }

      const assocText = associatedStr ? `. सोबतच ${associatedStr} ही लक्षणे जाणवत आहेत` : '';
      const pastText = pastStr ? ` तुमच्या आधीच्या वैद्यकीय इतिहासात ${pastStr} नोंदवले गेले आहे` : ' कोणत्याही जुन्या गंभीर आजाराची नोंद नाही';
      const medText = medsStr ? ` आणि सध्या तुम्ही ${medsStr} घेत आहात` : '';
      const allgText = allergyStr ? ` महत्त्वाची सूचना: तुम्हाला ${allergyStr} ची ऍलर्जी आहे.` : ' कोणत्याही औषधाची ज्ञात ऍलर्जी नाही.';
      const ayushText = ayushPrakriti && ayushPrakriti !== 'Not assessed' ? ` आयुष मूल्यांकनानुसार तुमची प्रकृती ${ayushPrakriti} आढळली आहे.` : '';
      const docText = docsCount > 0 ? ` तुमचे ${docsCount} वैद्यकीय अहवाल प्रणालीत जोडले गेले आहेत.` : '';
      const queryText = queriesStr ? ` तुम्ही टाईप केलेले प्रश्न/नोंद: "${queriesStr}" डॉक्टरांच्या निदर्शनास आणून दिले जातील.` : '';

      return `${greeting} तुमच्या तपासणीचा सारांश: तुम्ही प्रामुख्याने "${cc}" या समस्येसाठी सल्लामसलत केली आहे${onsetText}${sevText}${charText}${factorText}${assocText}.${pastText}${medText}.${allgText}${ayushText}${docText}${queryText} तुमची सर्व माहिती डॉक्टरांच्या स्क्रीनवर पाठवली आहे. कृपया डॉक्टरांचा सल्ला घेऊन योग्य औषधोपचार सुरू करा.`;
    }

    case 'bn': {
      const greeting = patientName ? `নমস্কার ${patientName} বাবু/দেবী।` : 'নমস্কার।';
      const onsetText = onset ? ` যা প্রায় ${onset} থেকে অনুভূত হচ্ছে` : '';
      const sevText = severity ? ` (কষ্টের মাত্রা ১০-এর মধ্যে ${severity.replace('/10', '')})` : '';
      const pastText = pastStr ? ` পূর্ববর্তী স্বাস্থ্যে ${pastStr}-এর বিবরণ রয়েছে` : ' পূর্বে কোনো বড় রোগের ইতিহাস নেই';
      const medText = medsStr ? ` এবং বর্তমানে আপনি ${medsStr} গ্রহণ করছেন` : '';
      const allgText = allergyStr ? ` সতর্কতা: আপনার ${allergyStr}-এ অ্যালার্জি নথিভুক্ত রয়েছে।` : ' কোনো ওষুধে জানা অ্যালার্জি নেই।';
      const ayushText = ayushPrakriti && ayushPrakriti !== 'Not assessed' ? ` আয়ুশ নিরীক্ষায় আপনার প্রকৃতি ${ayushPrakriti} নির্ণয় হয়েছে।` : '';
      const queryText = queriesStr ? ` আপনার টাইপ করা প্রশ্ন/মন্তব্য: "${queriesStr}" ডাক্তারের কাছে পাঠানো হয়েছে।` : '';

      return `${greeting} আপনার স্বাস্থ্য পরামর্শের সংক্ষিপ্ত সারসংক্ষেপ: আপনি মূলত "${cc}"-এর অসুবিধার জন্য এসেছেন${onsetText}${sevText}।${pastText}${medText}।${allgText}${ayushText}${queryText} আপনার সমস্ত তথ্য ডাক্তারের কাছে পৌঁছে গেছে। দয়া করে ডাক্তারের পরামর্শ মেনে চলুন।`;
    }

    case 'ta': {
      const greeting = patientName ? `வணக்கம் ${patientName}.` : 'வணக்கம்.';
      const onsetText = onset ? ` இது சுமார் ${onset} காலமாக உள்ளது` : '';
      const sevText = severity ? ` (வலி/சிரம அளவு: 10-ல் ${severity.replace('/10', '')})` : '';
      const pastText = pastStr ? ` முந்தைய மருத்துவ வரலாற்றில் ${pastStr} குறிப்பிடப்பட்டுள்ளது` : ' முந்தைய தீவிர நோய்கள் ஏதுமில்லை';
      const medText = medsStr ? ` மற்றும் தற்போது ${medsStr} எடுத்துக்கொள்கிறீர்கள்` : '';
      const allgText = allergyStr ? ` ஒவ்வாமை குறிப்பு: உங்களுக்கு ${allergyStr} ஒவ்வாமை உள்ளது.` : ' மருந்து ஒவ்வாமை எதுவும் பதிவு செய்யப்படவில்லை.';
      const queryText = queriesStr ? ` நீங்கள் தட்டச்சு செய்த கேள்விகள்/குறிப்புகள்: "${queriesStr}" மருத்துவருக்கு அனுப்பப்பட்டுள்ளன.` : '';

      return `${greeting} உங்கள் மருத்துவ ஆலோசனையின் சுருக்கம்: நீங்கள் "${cc}" பிரச்சனைக்காக பதிவு செய்துள்ளீர்கள்${onsetText}${sevText}.${pastText}${medText}.${allgText}${queryText} உங்கள் அறிகுறிகள் மருத்துவருக்கு அனுப்பப்பட்டுள்ளன. மருத்துவரின் ஆலோசனைப்படி மருந்து மாத்திரைகளை உட்கொள்ளவும்.`;
    }

    case 'te': {
      const greeting = patientName ? `నమస్కారం ${patientName} గారు.` : 'నమస్కారం.';
      const onsetText = onset ? ` ఇది దాదాపు ${onset} నుండి ప్రారంభమైంది` : '';
      const sevText = severity ? ` (తీవ్రత: 10 కి ${severity.replace('/10', '')})` : '';
      const pastText = pastStr ? ` మునుపటి చరిత్రలో ${pastStr} ఉంది` : ' మునుపటి తీవ్ర అనారోగ్య సమస్యలు లేవు';
      const medText = medsStr ? ` మరియు ప్రస్తుతం మీరు ${medsStr} వాడుతున్నారు` : '';
      const allgText = allergyStr ? ` అలెర్జీ గమనిక: మీకు ${allergyStr} అలెర్జీ ఉంది.` : ' మందుల అలెర్జీలు ఏమీ లేవు.';
      const queryText = queriesStr ? ` మీరు టైప్ చేసిన ప్రశ్నలు/వ్యాఖ్యలు: "${queriesStr}" డాక్టర్‌కు పంపబడ్డాయి.` : '';

      return `${greeting} మీ ఆరోగ్య సారాంశం: మీరు ప్రధానంగా "${cc}" సమస్య కోసం వచ్చారు${onsetText}${sevText}.${pastText}${medText}.${allgText}${queryText} మీ వివరాలు డాక్టర్‌కు పంపబడ్డాయి. దయచేసి డాక్టర్ పరీక్ష చేయించుకుని వారి సూచనలు పాటించండి.`;
    }

    case 'kn': {
      const greeting = patientName ? `ನಮಸ್ಕಾರ ${patientName} ಅವರೇ.` : 'ನಮಸ್ಕಾರ.';
      const onsetText = onset ? ` ಇದು ಸುಮಾರು ${onset} ರಿಂದ ಕಾಣಿಸಿಕೊಂಡಿದೆ` : '';
      const sevText = severity ? ` (ತೀವ್ರತೆ: 10 ರಲ್ಲಿ ${severity.replace('/10', '')})` : '';
      const pastText = pastStr ? ` ಹಿಂದಿನ ಇತಿಹಾಸದಲ್ಲಿ ${pastStr} ದಾಖಲಾಗಿದೆ` : ' ಯಾವುದೇ ಹಳೆಯ ಗಂಭೀರ ಕಾಯಿಲೆಗಳಿಲ್ಲ';
      const medText = medsStr ? ` ಮತ್ತು ಪ್ರಸ್ತುತ ${medsStr} ಸೇವಿಸುತ್ತಿದ್ದೀರಿ` : '';
      const allgText = allergyStr ? ` ಎಚ್ಚರಿಕೆ: ನಿಮಗೆ ${allergyStr} ಅಲರ್ಜಿ ಇದೆ.` : ' ಯಾವುದೇ ಔಷಧಿ ಅಲರ್ಜಿ ಇಲ್ಲ.';
      const queryText = queriesStr ? ` ನೀವು ಟೈಪ್ ಮಾಡಿದ ಪ್ರಶ್ನೆಗಳು/ಟಿಪ್ಪಣಿಗಳು: "${queriesStr}" ವೈದ್ಯರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.` : '';

      return `${greeting} ನಿಮ್ಮ ಸಮಾಲೋಚನಾ ಸಾರಾಂಶ: ನೀವು ಪ್ರಮುಖವಾಗಿ "${cc}" ಸಮಸ್ಯೆಗೆ ಬಂದಿದ್ದೀರಿ${onsetText}${sevText}.${pastText}${medText}.${allgText}${queryText} ನಿಮ್ಮ ವಿವರಗಳನ್ನು ವೈದ್ಯರ ಪರದೆಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ ಸೂಕ್ತ ಚಿಕಿತ್ಸೆ ಪಡೆಯಿರಿ.`;
    }

    case 'gu': {
      const greeting = patientName ? `નમસ્તે ${patientName} ભાઈ/બહેન.` : 'નમસ્તે.';
      const onsetText = onset ? ` જે આશરે ${onset} થી જણાય છે` : '';
      const sevText = severity ? ` (તકલીફની તીવ્રતા: 10 માંથી ${severity.replace('/10', '')})` : '';
      const pastText = pastStr ? ` અગાઉની બીમારીઓમાં ${pastStr} નોંધાયેલ છે` : ' અગાઉની કોઈ ગંભીર બીમારી નોંધાયેલ નથી';
      const medText = medsStr ? ` અને હાલમાં તમે ${medsStr} દવાઓ લઈ રહ્યા છો` : '';
      const allgText = allergyStr ? ` નોંધ: તમને ${allergyStr} ની એલર્જી છે.` : ' કોઈ દવાની એલર્જી નોંધાયેલ નથી.';
      const ayushText = ayushPrakriti && ayushPrakriti !== 'Not assessed' ? ` આયુષ મૂલ્યાંકન મુજબ તમારી પ્રકૃતિ ${ayushPrakriti} છે.` : '';
      const queryText = queriesStr ? ` તમે ટાઇપ કરેલ પ્રશ્ન/નોંધ: "${queriesStr}" ડૉક્ટરના ધ્યાન માટે નોંધવામાં આવ્યા છે.` : '';

      return `${greeting} તમારા સ્વાસ્થ્ય પરામર્શનો સારાંશ: તમે મુખ્યત્વે "${cc}" ની તકલીફ માટે આવ્યા છો${onsetText}${sevText}.${pastText}${medText}.${allgText}${ayushText}${queryText} આ બધી વિગતો ડૉક્ટર પાસે પહોંચી ગઈ છે. કૃપા કરીને ડૉક્ટરની સલાહ મુજબ કાળજી લો.`;
    }

    case 'en':
    default: {
      const greeting = patientName ? `Hello ${patientName}.` : 'Hello.';
      const onsetText = onset ? ` with an onset of approximately ${onset}` : '';
      const sevText = severity ? ` (discomfort rated at ${severity} on a 1-10 scale)` : '';
      const charText = character ? `, described as feeling ${character}` : '';

      let factorText = '';
      if (aggravating && relieving) {
        factorText = `. Symptoms worsen with ${aggravating} and find partial relief with ${relieving}`;
      } else if (aggravating) {
        factorText = `. Symptoms are aggravated by ${aggravating}`;
      } else if (relieving) {
        factorText = `. Discomfort improves with ${relieving}`;
      }

      const assocText = associatedStr ? `. Associated symptoms include ${associatedStr}` : '';
      const pastText = pastStr ? ` Past medical history notes ${pastStr}` : ' No significant prior chronic conditions were reported';
      const medText = medsStr ? `, and you are currently taking ${medsStr}` : '';
      const allgText = allergyStr ? ` Important: Documented allergy to ${allergyStr}.` : ' No known drug or environmental allergies reported.';
      const ayushText = ayushPrakriti && ayushPrakriti !== 'Not assessed' ? ` AYUSH assessment indicates ${ayushPrakriti}.` : '';
      const docText = docsCount > 0 ? ` ${docsCount} medical document(s) and reports are attached.` : '';
      const queryText = queriesStr ? ` Specific remarks/queries you typed: "${queriesStr}" have been forwarded to the doctor.` : '';

      return `${greeting} Here is a clear summary of your consultation intake: You presented primarily for "${cc}"${onsetText}${sevText}${charText}${factorText}${assocText}.${pastText}${medText}.${allgText}${ayushText}${docText}${queryText} All clinical details have been securely transmitted to the attending physician. Please consult directly with the doctor for physical examination and customized treatment guidance.`;
    }
  }
};

export const getClinicalDifferentialsAndActions = (cc = '') => {
  const ccLower = String(cc).toLowerCase();
  let differentials = [];
  let physicianActions = [];

  if (ccLower.includes('chest') || ccLower.includes('cardiac') || ccLower.includes('सीने') || ccLower.includes('छाती') || ccLower.includes('বুক') || ccLower.includes('நெஞ்சு') || ccLower.includes('ఛాతీ') || ccLower.includes('ಎದೆ')) {
    differentials = [
      'Acute Coronary Syndrome (Unstable Angina / NSTEMI / STEMI)',
      'Gastroesophageal Reflux Disease (GERD) / Severe Dyspepsia',
      'Musculoskeletal Chest Wall Pain / Costochondritis',
      'Pleuritis / Pulmonary Embolism (rule out if acute dyspnea present)',
    ];
    physicianActions = [
      'Stat 12-lead Electrocardiogram (ECG) within 10 minutes of presentation.',
      'Check Serum High-Sensitivity Troponin I / T and basic metabolic panel.',
      'Continuous SpO2 and non-invasive blood pressure monitoring; establish peripheral IV line.',
      'Aspirin 300mg / antiplatelet loading if clinical suspicion of ACS is confirmed by attending.',
    ];
  } else if (ccLower.includes('fever') || ccLower.includes('cough') || ccLower.includes('respiratory') || ccLower.includes('बुखार') || ccLower.includes('खांसी') || ccLower.includes('ताप') || ccLower.includes('জ্বর') || ccLower.includes('কাশি') || ccLower.includes('காய்ச்சல்') || ccLower.includes('இருமல்') || ccLower.includes('జ్వరం') || ccLower.includes('దగ్గు') || ccLower.includes('ಜ್ವರ') || ccLower.includes('તાવ')) {
    differentials = [
      'Acute Upper Respiratory Tract Infection (Viral / Bacterial Pharyngitis)',
      'Acute Bronchitis / Lower Respiratory Tract Infection (Community-Acquired Pneumonia)',
      'Reactive Airway Disease / Bronchial Asthma Exacerbation',
      'Endemic Tropical Infection (Dengue, Malaria, Typhoid depending on fever duration)',
    ];
    physicianActions = [
      'Document vital signs: SpO2, Respiratory Rate, Core Body Temperature, Pulse.',
      'Chest auscultation for crackles, rhonchi, bronchial breath sounds, or prolonged expiratory phase.',
      'Order Complete Blood Count (CBC) with differential, ESR/CRP.',
      'Consider Chest X-Ray (PA view) if abnormal auscultation or tachypnea observed.',
    ];
  } else if (ccLower.includes('abdomen') || ccLower.includes('stomach') || ccLower.includes('belly') || ccLower.includes('पेट') || ccLower.includes('पोट') || ccLower.includes('পেট') || ccLower.includes('வயிறு') || ccLower.includes('కడుపు') || ccLower.includes('ಹೊಟ್ಟೆ') || ccLower.includes('પેટ')) {
    differentials = [
      'Acute Gastritis / Peptic Ulcer Disease / Hyperacidity',
      'Acute Gastroenteritis / Enterocolitis',
      'Acute Appendicitis / Cholecystitis / Diverticulitis',
      'Renal / Ureteric Colic',
    ];
    physicianActions = [
      'Systematic abdominal palpation for peritoneal signs (guarding, rigidity, rebound tenderness).',
      'Assess hydration status and hemodynamic stability.',
      'Order Ultrasound Abdomen and Pelvis; Serum Lipase/Amylase, LFTs, and Routine Urine examination.',
      'Initiate targeted fluid resuscitation and symptom-directed antispasmodics/antiemetics.',
    ];
  } else if (ccLower.includes('headache') || ccLower.includes('cephalea') || ccLower.includes('सिरदर्द') || ccLower.includes('डोकेदुखी') || ccLower.includes('মাথাব্যথা') || ccLower.includes('தலைவலி') || ccLower.includes('తలనొప్పి') || ccLower.includes('ತಲೆನೋವು') || ccLower.includes('માથાનો દુખાવો')) {
    differentials = [
      'Tension-Type Cephalea',
      'Migraine (with or without aura)',
      'Acute Rhinosinusitis',
      'Secondary headache (rule out intracranial pathology or hypertensive crisis if BP elevated)',
    ];
    physicianActions = [
      'Measure bilateral blood pressure and assess for hypertensive urgency.',
      'Complete neurological examination: cranial nerves, fundoscopy, pupillary reflexes, gait.',
      'Evaluate for meningeal signs (nuchal rigidity, Kernig / Brudzinski signs).',
      'Non-contrast CT Brain stat if "thunderclap" onset, neurological deficit, or altered mentation.',
    ];
  } else {
    differentials = [
      'Symptomatic presentation under active diagnostic evaluation',
      'Musculoskeletal / Functional etiology',
    ];
    physicianActions = [
      'Conduct complete physical and targeted system examination.',
      'Correlate clinical presentation with baseline laboratory profile.',
    ];
  }

  return { differentials, physicianActions };
};

/**
 * Generate a professional, physician-ready structured clinical intake report in standard medical English
 */
export const generatePhysicianNarrative = (answers = {}, mode = 'allopathy', structured = {}) => {
  const cc = structured.cc || answers.chief_complaint || 'General consultation request';
  const onset = structured.onset || answers.onset || 'Unspecified onset';
  const severity = structured.severity || answers.severity || 'Unspecified';
  const character = structured.character || answers.character || 'Unspecified character';
  const radiation = structured.radiation || answers.radiation || 'None reported';
  const aggravating = structured.aggravating || answers.aggravating || 'None reported';
  const relieving = structured.relieving || answers.relieving || 'None reported';
  const associated = structured.associated || answers.associated_symptoms || 'None reported';
  const pastConditions = structured.pastConditions || answers.past_conditions || 'Nil significant';
  const meds = structured.currentMeds || answers.current_medications || 'Nil regular medications';
  const allergies = structured.allergies || answers.allergies || 'No known drug allergies (NKDA)';
  const triagePriority = structured.triagePriority || answers.triagePriority || 'ROUTINE';
  const ayush = structured.ayushSection;

  const { differentials, physicianActions } = getClinicalDifferentialsAndActions(cc);

  const lines = [
    'CLINICAL INTAKE & TRIAGE REPORT (PHYSICIAN COPY)',
    `Triage Category: [${triagePriority.toUpperCase()}] | Facility: AYUSH Holistic OPD | Date: ${new Date().toLocaleDateString('en-IN')}`,
    '--------------------------------------------------------------------------------',
    `PRIMARY CHIEF COMPLAINT:`,
    `  ${cc}`,
    '',
    'HISTORY OF PRESENT ILLNESS (HPI - SOCRATES PROTOCOL):',
    `  • Onset & Timeline    : ${onset}`,
    `  • Character & Nature  : ${character}`,
    `  • Radiation / Spread  : ${radiation}`,
    `  • Severity Rating     : ${severity}`,
    `  • Aggravating Factors : ${aggravating}`,
    `  • Relieving Factors   : ${relieving}`,
    `  • Associated Symptoms : ${associated}`,
    '',
    'PAST MEDICAL & MEDICATION HISTORY:',
    `  • Comorbidities       : ${pastConditions}`,
    `  • Current Medications : ${meds}`,
    `  • Allergies (NKDA)    : ${allergies}`,
    '',
    'PROVISIONAL CLINICAL DIFFERENTIALS:',
    ...differentials.map((d, i) => `  ${i + 1}. ${d}`),
    '',
    'RECOMMENDED IMMEDIATE PHYSICIAN ORDERS & ACTIONS:',
    ...physicianActions.map((a) => `  [ ] ${a}`),
  ];

  const typedQueries = Array.isArray(answers.patient_queries)
    ? answers.patient_queries.map((q) => (typeof q === 'string' ? q : q.query)).filter(Boolean)
    : answers.patient_notes
    ? [answers.patient_notes]
    : [];

  if (typedQueries.length > 0) {
    lines.push(
      '',
      'PATIENT DIRECT INTAKE REMARKS / TYPED QUERIES:',
      '  (Patient opted for private on-screen typing in kiosk environment)',
      ...typedQueries.map((q, i) => `  [Query ${i + 1}]: "${q}"`)
    );
  }

  if (ayush && typeof ayush === 'object') {
    lines.push(
      '',
      'AYUSH DASHAVIDHA PARIKSHA ASSESSMENT:',
      `  • Prakriti Assessment : ${ayush.prakriti || 'Not assessed'}`,
      `  • Agni / Appetite     : ${ayush.ahara_shakti || 'Samagni'}`,
      `  • Koshtha             : ${ayush.koshtha || 'Madhyama'}`
    );
  }

  lines.push(
    '--------------------------------------------------------------------------------',
    'CONFIDENTIAL CLINICAL RECORD - Requires attending physician validation and sign-off.'
  );

  return lines.join('\n');
};

const generateAyushSummary = (answers) => {
  const toSafeStr = (val, fallback = 'Not assessed') => {
    if (val === null || val === undefined || val === '') return fallback;
    if (typeof val === 'string') return val.trim() || fallback;
    if (Array.isArray(val)) {
      const filtered = val.filter((x) => x && x !== 'None of these');
      return filtered.length > 0
        ? filtered.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join('; ')
        : fallback;
    }
    if (typeof val === 'object') {
      return JSON.stringify(val);
    }
    return String(val);
  };

  return {
    prakriti: extractPrakritiType(answers),
    vikriti: toSafeStr(answers.vikriti_current),
    sara: toSafeStr(answers.sara_assessment),
    samhanana: toSafeStr(answers.samhanana_body),
    satmya: toSafeStr(answers.satmya_food),
    sattva: toSafeStr(answers.sattva_mental),
    ahara_shakti: toSafeStr(answers.ahara_appetite),
    koshtha: toSafeStr(answers.koshtha),
    vyayama_shakti: toSafeStr(answers.vyayama_capacity),
    vaya: toSafeStr(answers.vaya_stage),
    nidana: toSafeStr(answers.nidana),
    ahara_vihara: toSafeStr(answers.ahara_vihara),
  };
};

const extractPrakritiType = (answers) => {
  const toText = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.join(' ');
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const bodyType = toText(answers.prakriti_body_type);
  const skin = toText(answers.prakriti_skin);
  const mind = toText(answers.prakriti_mind);

  const score = { Vata: 0, Pitta: 0, Kapha: 0 };
  [bodyType, skin, mind].forEach((ans) => {
    if (ans.includes('Vata') || ans.includes('वात')) score.Vata++;
    if (ans.includes('Pitta') || ans.includes('पित्त')) score.Pitta++;
    if (ans.includes('Kapha') || ans.includes('कफ')) score.Kapha++;
  });

  const dominant = Object.entries(score).sort((a, b) => b[1] - a[1]);
  if (dominant[0][1] === 0) return 'Not assessed';
  if (dominant[0][1] === dominant[1][1]) return `${dominant[0][0]}-${dominant[1][0]} (Dvandva)`;
  return `${dominant[0][0]} dominant (${dominant[0][0]}-Prakriti)`;
};
