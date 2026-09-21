// Red flag keyword mappings for emergency triage detection
// Triggers when patient speech or selected options contain any of these emergency indicators
// Supports multilingual keywords across 8 Indian languages (EN, HI, MR, BN, TA, TE, KN, GU)

export const RED_FLAG_RULES = [
  {
    id: 'cardiac',
    priority: 'CRITICAL',
    title: 'Possible Cardiac Emergency (हृदय आपातकाल)',
    description: 'Patient reports chest pain, pressure, or radiation to left arm/jaw. Immediate triage required.',
    color: '#EF4444',
    keywords: [
      // English (Specific acute cardiac emergency triggers only)
      'heart attack', 'crushing chest pain', 'chest pain radiating to left arm', 'chest pain radiating to jaw',
      'chest pain with sweating', 'severe crushing pain', 'chest tightness with breathlessness',
      // Hindi
      'दिल का दौरा', 'हार्ट अटैक', 'सीने में भयानक दर्द और पसीना', 'सीने में तीव्र दर्द और बाएं हाथ में', 'असहनीय सीने का दर्द',
      // Marathi
      'हृदयविकाराचा झटका', 'हार्ट अटॅक', 'छातीत तीव्र वेदना आणि घाम', 'छातीत असह्य वेदना',
      // Bengali
      'হার্ট অ্যাটাক', 'বুকে তীব্র অসহ্য ব্যথা ও ঘাম',
      // Tamil
      'மாரடைப்பு', 'தாங்க முடியாத நெஞ்சு வலி',
      // Telugu
      'గుండెపోటు', 'భరించలేని ఛాతీ నొప్పి',
      // Kannada
      'ಹಾರ್ಟ್ ಅಟ್ಯಾಕ್', 'ತಡೆಯಲಾಗದ ಎದೆ ನೋವು',
      // Gujarati
      'હાર્ટ એટેક', 'છાતીમાં અસહ્ય દુખાવો અને પરસેવો',
    ],
    action: 'Activate Code Blue / Acute Cardiac Protocol. Notify on-call cardiologist and prepare 12-lead ECG immediately.',
  },
  {
    id: 'stroke',
    priority: 'CRITICAL',
    title: 'Possible Acute Stroke / FAST Alert (पक्षाघात / लकवा)',
    description: 'Symptoms suggest acute cerebrovascular event. Time-critical emergency protocol required.',
    color: '#EF4444',
    keywords: [
      // English
      'face drooping', 'arm weakness', 'speech difficulty', 'slurred speech', 'sudden headache',
      'facial weakness', 'sudden vision loss', 'can\'t speak', 'paralysis', 'numbness one side', 'stroke',
      // Hindi
      'मुंह टेढ़ा', 'चेहरा टेढ़ा', 'हाथ में कमजोरी', 'बोलने में परेशानी', 'बोली लड़खड़ाना', 'लकवा', 'फालिज',
      'एक तरफ सुन्न', 'आधा शरीर सुन्न', 'बोल नहीं पा रहे', 'अचानक अंधापन',
      // Marathi
      'तोंड वाकडे', 'हात अशक्त', 'बोलण्यात अडचण', 'अर्धांगवायू', 'लकवा', 'एका बाजूला बधिरता', 'बोलता येत नाही',
      // Bengali
      'মুখ বেঁকে যাওয়া', 'পক্ষাঘাত', 'প্যারালাইসিস', 'এক পাশ অবশ', 'কথা জড়িয়ে যাওয়া', 'কথা বলতে পারছি না',
      // Tamil
      'முகம் கோணுதல்', 'பக்கவாதம்', 'கை பலவீனம்', 'பேச முடியவில்லை', 'ஒரு பக்கம் மரத்துப்போதல்',
      // Telugu
      'ముఖం వంకరపోవడం', 'పక్షవాతం', 'చేయి బలహీనత', 'మాట్లాడలేకపోవడం', 'ఒక వైపు తిమ్मिరి',
      // Kannada
      'ಮುಖ ವಕ್ರವಾಗುವುದು', 'ಪಾರ್ಶ್ವವಾಯು', 'ಕೈ ದೌರ್ಬಲ್ಯ', 'ಮಾತನಾಡಲು ಕಷ್ಟ', 'ಒಂದು ಬದಿ ಮರಗಟ್ಟುವುದು',
      // Gujarati
      'મોં વાંકું થવું', 'લકવો', 'પક્ષાઘાત', 'હાથમાં નબળાઈ', 'બોલવામાં તકલીફ', 'એક તરફ સુન્ન',
    ],
    action: 'Activate Rapid Stroke Protocol. Immediate non-contrast brain CT scan within 25 minutes.',
  },
  {
    id: 'respiratory_failure',
    priority: 'CRITICAL',
    title: 'Acute Respiratory Distress (गंभीर श्वास अवरोध)',
    description: 'Severe breathing failure or airway compromise detected. Oxygen saturation assessment needed.',
    color: '#EF4444',
    keywords: [
      // English
      'choking', 'gasping for air', 'severe asthma', 'blue lips', 'cyanosis', 'airway blockage',
      'unable to breathe', 'stridor', 'suffocating', 'severe breathlessness',
      // Hindi
      'दम घुट रहा है', 'सांस बिल्कुल नहीं आ रही', 'नीला पड़ना', 'गंभीर दमा', 'सांस रुक रही है', 'घुटन',
      // Marathi
      'श्वास गुदमरतोय', 'श्वास अजिबात घेता येत नाही', 'निळे पडणे', 'श्वास अडकणे',
      // Bengali
      'দম বন্ধ হয়ে আসছে', 'শ্বাস নিতে পারছি না', 'নীল হয়ে যাওয়া',
      // Tamil
      'மூச்சு விடவே முடியவில்லை', 'மூச்சு அடைப்பு', 'நீல நிறமாக மாறுதல்',
      // Telugu
      'ఊపిరి ఆడటం లేదు', 'శ్వాస అస్సలు ఆడటం లేదు', 'నీలంగా మారడం',
      // Kannada
      'ಉಸಿರಾಡಲು ಸಾಧ್ಯವೇ ಇಲ್ಲ', 'ಉಸಿರುಗಟ್ಟುವುದು', 'ನೀಲಿ ಬಣ್ಣಕ್ಕೆ ತಿರುಗುವುದು',
      // Gujarati
      'દમ ઘૂંટાવો', 'શ્વાસ બિલકુલ નથી લઈ શકાતો', 'નીલા પડવું',
    ],
    action: 'Initiate High-Flow Oxygen support (target SpO2 > 94%). Alert emergency physician immediately.',
  },
  {
    id: 'anaphylaxis',
    priority: 'CRITICAL',
    title: 'Possible Anaphylaxis / Severe Allergy (तीव्र एलर्जी)',
    description: 'Signs of severe systemic allergic reaction detected. Epinephrine may be required immediately.',
    color: '#EF4444',
    keywords: [
      // English
      'throat closing', 'throat swelling', 'can\'t swallow', 'swollen throat', 'severe allergy',
      'anaphylaxis', 'bee sting reaction', 'lips swelling', 'tongue swelling', 'swollen tongue',
      // Hindi
      'गला बंद हो रहा है', 'गले में सूजन', 'होंठ सूज गए', 'जीभ सूज गई', 'गंभीर एलर्जी', 'निगल नहीं पा रहे',
      // Marathi
      'घसा बंद होतोय', 'घशाला सूज', 'ओठ सुजणे', 'जीभ सुजणे', 'गंभीर ॲलर्जी',
      // Bengali
      'গলা বন্ধ হয়ে যাওয়া', 'ঠোঁট ফোলা', 'জিভ ফোলা', 'মারাত্মক অ্যালার্জি',
      // Tamil
      'தொண்டை அடைத்தல்', 'உதடு வீக்கம்', 'நாக்கு வீக்கம்', 'கடுமையான ஒவ்வாமை',
      // Telugu
      'గొంతు మూసుకుపోవడం', 'పెదవులు వాపు', 'నాలుక వాపు', 'తీవ్రమైన అలెర్జీ',
      // Kannada
      'ಗಂಟಲು ಮುಚ್ಚಿಕೊಳ್ಳುವುದು', 'ತುಟಿ ಊತ', 'ನಾಲಿಗೆ ಊತ', 'ತೀವ್ರ ಅಲರ್ಜಿ',
      // Gujarati
      'ગળું બંધ થવું', 'હોઠ સોજો', 'જીભ સોજો', 'ગંભીર એલર્જી',
    ],
    action: 'Prepare Epinephrine (Adrenaline) 0.5mg IM stat. Administer antihistamines and notify resuscitation team.',
  },
  {
    id: 'bleeding',
    priority: 'HIGH',
    title: 'Severe Bleeding / Hemorrhage (रक्तस्त्राव)',
    description: 'Patient reports significant blood loss or gastrointestinal/pulmonary bleeding.',
    color: '#F97316',
    keywords: [
      // English
      'heavy bleeding', 'blood vomiting', 'vomiting blood', 'blood in stool', 'black stool',
      'massive bleeding', 'hemorrhage', 'coughing blood', 'blood in cough', 'hemoptysis', 'hematemesis',
      // Hindi
      'खून की उल्टी', 'खांसी में खून', 'बहुत ज्यादा खून', 'काला मल', 'पेशाब में खून', 'अति रक्तस्राव',
      // Marathi
      'रक्ताची उलटी', 'खोकल्यातून रक्त', 'अतिरक्तस्त्राव', 'काळे शौच', 'लघवीत रक्त',
      // Bengali
      'রক্তের বমি', 'কাশির সাথে রক্ত', 'অতিরিক্ত রক্তপাত', 'কালো মল',
      // Tamil
      'ரத்த வாந்தி', 'இருமலில் ரத்தம்', 'கடுமையான ரத்தப்போக்கு', 'கருப்பு மலம்',
      // Telugu
      'రక్తం వాంతి', 'దగ్గులో రక్తం', 'తీవ్ర రక్తస్రావం', 'నల్లటి మలం',
      // Kannada
      'ರಕ್ತ ವಾಂತಿ', 'ಕೆಮ್ಮಿನಲ್ಲಿ ರಕ್ತ', 'ತೀವ್ರ ರಕ್ತಸ್ರಾವ', 'ಕಪ್ಪು ಮಲ',
      // Gujarati
      'લોહીની ઉલટી', 'ખાંસીમાં લોહી', 'વધુ પડતું રક્તસ્ત્રાવ', 'કાળો મળ',
    ],
    action: 'Notify on-call surgeon / gastroenterologist. Establish two large-bore IV access lines and type & screen blood.',
  },
  {
    id: 'unconscious',
    priority: 'CRITICAL',
    title: 'Altered Consciousness / Seizure (बेहोशी / दौरा)',
    description: 'Patient reports history of collapse, syncopal episode, or active convulsions.',
    color: '#EF4444',
    keywords: [
      // English
      'fainted', 'passed out', 'unconscious', 'loss of consciousness', 'collapsed', 'seizure',
      'fits', 'convulsions', 'unresponsive', 'blackout',
      // Hindi
      'बेहोश', 'बेहोशी', 'दौरा पड़ा', 'मिर्गी', 'गिर पड़े', 'चक्कर खाकर गिरना', 'सुध-बुध खोना',
      // Marathi
      'बेशुद्ध', 'भोवळ आली', 'चक्कर येऊन पडणे', 'फेफरे', 'झटका आला',
      // Bengali
      'অজ্ঞান', 'অচেতন', 'খিঁচুনি', 'মৃগীরোগ', 'পড়ে যাওয়া',
      // Tamil
      'மயக்கம்', 'சுயநினைவு இழத்தல்', 'வலிப்பு', 'கீழே விழுந்தார்',
      // Telugu
      'స్పృహ కోల్పోవడం', 'మూర్ఛ', 'మూర్ఛ రావడం', 'పడిపోవడం',
      // Kannada
      'ಪ್ರಜ್ಞೆ ತಪ್ಪುವುದು', 'ಮೂರ್ಛೆ', 'ಫಿಟ್ಸ್ ಬರುವುದು', 'ಬಿದ್ದುಹೋಗುವುದು',
      // Gujarati
      'બેભાન', 'ચક્કર આવીને પડી જવું', 'ખેંચ આવવી', 'આંચકી',
    ],
    action: 'Immediate physician evaluation. Protect airway, place in recovery position, and check blood glucose immediately.',
  },
  {
    id: 'severe_trauma_headache',
    priority: 'HIGH',
    title: 'Thunderclap Headache / Severe Trauma (अति तीव्र सिरदर्द)',
    description: 'Sudden maximal intensity headache or acute head trauma reported.',
    color: '#F97316',
    keywords: [
      // English
      'thunderclap headache', 'worst headache of life', 'head trauma', 'head injury with vomiting',
      'sudden explosive headache', '10/10 headache',
      // Hindi
      'जिंदगी का सबसे तेज सिरदर्द', 'बिजली जैसा सिरदर्द', 'सिर पर गंभीर चोट', 'असहनीय सिरदर्द',
      // Marathi
      'आयुष्यातील सर्वात तीव्र डोकेदुखी', 'डोक्याला गंभीर मार', 'असह्य डोकेदुखी',
      // Bengali
      'বজ্রপাতের মতো তীব্র মাথাব্যথা', 'মাথায় মারাত্মক আঘাত',
      // Tamil
      'தாங்க முடியாத தலைவலி', 'தலையில் பலத்த காயம்',
      // Telugu
      'భరించలేని తలనొప్పి', 'తలకు తీవ్ర గాయం',
      // Kannada
      'ಅತಿಯಾದ ತಲೆನೋವು', 'ತಲೆಗೆ ತೀವ್ರ ಗಾಯ',
      // Gujarati
      'અતિશય માથાનો દુખાવો', 'માથામાં ગંભીર ઈજા',
    ],
    action: 'Urgent CT brain non-contrast to rule out subarachnoid hemorrhage. Avoid NSAIDs until hemorrhage is excluded.',
  },
];

export const checkRedFlags = (input) => {
  if (!input) return [];
  const text = Array.isArray(input) ? input.join(' ') : String(input);
  const lowerText = text.toLowerCase().trim();
  if (!lowerText) return [];

  return RED_FLAG_RULES.filter((rule) =>
    rule.keywords.some((keyword) => {
      const kwLower = keyword.toLowerCase().trim();
      // Direct substring match
      if (lowerText.includes(kwLower)) return true;

      // Token co-occurrence match for multi-word phrases (e.g. "छातीत तीव्र वेदना" contains both "छातीत" and "वेदना")
      const words = kwLower.split(/\s+/).filter((w) => w.length > 2);
      if (words.length >= 2) {
        return words.every((w) => lowerText.includes(w));
      }
      return false;
    })
  );
};

/**
 * Evaluates Chest Pain risk based on structured follow-up answers.
 * Does NOT trigger red alert on symptom selection alone.
 * Evaluates:
 *   - Severity (1-10 numerical scale)
 *   - Radiation (left arm, shoulder, jaw, back)
 *   - Character (crushing, heavy pressure)
 *   - Associated signs (profuse sweating, breathlessness, nausea)
 *   - Past cardiovascular history (prior MI, stent, CABG, high BP/diabetes)
 */
export const evaluateChestPainRisk = (answers = {}) => {
  if (!answers) return { isRedFlag: false, riskLevel: 'low', reasons: [] };

  const complaint = String(answers.chief_complaint || '').toLowerCase();
  const isChestCase =
    complaint.includes('chest') ||
    complaint.includes('सीने') ||
    complaint.includes('छाती') ||
    complaint.includes('বুক') ||
    complaint.includes('நெஞ்சு') ||
    complaint.includes('ఛాతీ') ||
    complaint.includes('ಎದೆ') ||
    complaint.includes('છાતી') ||
    answers.radiation !== undefined ||
    answers.severity !== undefined;

  if (!isChestCase) {
    return { isRedFlag: false, riskLevel: 'low', reasons: [] };
  }

  // Parse Severity
  let severityNum = 0;
  const rawSeverity = String(answers.severity || answers.pain_severity || answers.step_2 || answers.step_1 || '').toLowerCase();
  const digitMatch = rawSeverity.match(/\b([1-9]|10)\b/);
  if (digitMatch) {
    severityNum = parseInt(digitMatch[1], 10);
  } else if (rawSeverity.includes('severe') || rawSeverity.includes('तेज') || rawSeverity.includes('तीव्र') || rawSeverity.includes('असहनीय') || rawSeverity.includes('भयंकर') || rawSeverity.includes('कடுமையான')) {
    severityNum = 8;
  } else if (rawSeverity.includes('moderate') || rawSeverity.includes('मध्यम') || rawSeverity.includes('மிதமான') || rawSeverity.includes('మోస్తరు')) {
    severityNum = 5;
  } else if (rawSeverity.includes('mild') || rawSeverity.includes('हल्का') || rawSeverity.includes('कम') || rawSeverity.includes('सौम्य') || rawSeverity.includes('லேசான')) {
    severityNum = 3;
  }

  // Check Radiation to Left Arm / Jaw / Shoulder / Back
  const rawRadiation = String(answers.radiation || answers.step_1 || '').toLowerCase();
  const hasRadiation =
    rawRadiation.includes('left arm') ||
    rawRadiation.includes('jaw') ||
    rawRadiation.includes('shoulder') ||
    rawRadiation.includes('back') ||
    rawRadiation.includes('बाएं हाथ') ||
    rawRadiation.includes('जबड़े') ||
    rawRadiation.includes('कंधे') ||
    rawRadiation.includes('पीठ') ||
    rawRadiation.includes('डाव्या हात') ||
    rawRadiation.includes('जबड') ||
    rawRadiation.includes('खांद्या') ||
    rawRadiation.includes('বাঁ হাত') ||
    rawRadiation.includes('চোয়াল') ||
    rawRadiation.includes('இடது கை') ||
    rawRadiation.includes('தாடை') ||
    rawRadiation.includes('தோள்பட்டை') ||
    rawRadiation.includes('ఎడమ చేయి') ||
    rawRadiation.includes('దవడ') ||
    rawRadiation.includes('భుజం') ||
    rawRadiation.includes('ಎಡಗೈ') ||
    rawRadiation.includes('ದವಡೆ') ||
    rawRadiation.includes('ಡಾಬಾ હાથ') ||
    rawRadiation.includes('જડબા');

  // Check Character: Heavy crushing pressure vs gas/musculoskeletal
  const hasCrushingPressure =
    rawRadiation.includes('crushing') ||
    rawRadiation.includes('heavy pressure') ||
    rawRadiation.includes('gripping') ||
    rawRadiation.includes('भारी दबाव') ||
    rawRadiation.includes('जकड़न') ||
    rawRadiation.includes('तीव्र दाब') ||
    rawRadiation.includes('கடுமையான அழுத்தம்') ||
    rawRadiation.includes('తీవ్రమైన ఒత్తిడి') ||
    rawRadiation.includes('ಭಾರವಾದ ಒತ್ತಡ') ||
    rawRadiation.includes('ભારે દબાણ');

  const isLocalizedOrGas =
    rawRadiation.includes('burning sensation') ||
    rawRadiation.includes('gas') ||
    rawRadiation.includes('acidity') ||
    rawRadiation.includes('localized') ||
    rawRadiation.includes('touching') ||
    rawRadiation.includes('गैस') ||
    rawRadiation.includes('जलन') ||
    rawRadiation.includes('छूने पर') ||
    rawRadiation.includes('गॅस') ||
    rawRadiation.includes('दाबल्यावर');

  // Check Associated Signs: Sweating, breathlessness
  const rawOnset = String(answers.onset || '').toLowerCase();
  const combinedText = `${rawOnset} ${rawRadiation} ${rawSeverity}`.toLowerCase();
  const hasSweatingOrBreathlessness =
    combinedText.includes('sweat') ||
    combinedText.includes('breath') ||
    combinedText.includes('cold sweat') ||
    combinedText.includes('पसीना') ||
    combinedText.includes('सांस फूल') ||
    combinedText.includes('सांस नहीं') ||
    combinedText.includes('घाम') ||
    combinedText.includes('दम') ||
    combinedText.includes('শ্বাস') ||
    combinedText.includes('வியர்வை') ||
    combinedText.includes('மூச்சு') ||
    combinedText.includes('చెమట') ||
    combinedText.includes('శ్వాస') ||
    combinedText.includes('ಉಸಿರಾಟ') ||
    combinedText.includes('ಬೆವರು') ||
    combinedText.includes('પરસેવો') ||
    combinedText.includes('શ્વાસ');

  // Check Cardiac / Cardiovascular History
  const rawHistory = String(answers.past_history || answers.history || answers.step_3 || '').toLowerCase();
  const hasCardiacHistory =
    rawHistory.includes('stent') ||
    rawHistory.includes('bypass') ||
    rawHistory.includes('दिल की बीमारी') ||
    rawHistory.includes('heart') ||
    rawHistory.includes('स्टेंट') ||
    rawHistory.includes('bp') ||
    rawHistory.includes('blood pressure') ||
    rawHistory.includes('बीपी') ||
    rawHistory.includes('ஹார்ட்') ||
    rawHistory.includes('గుండె') ||
    rawHistory.includes('હૃદય');

  // Clinical Decision Matrix:
  // 1. Extreme pain (>= 9/10): Immediate Red Alert
  // 2. Severe pain (>= 7/10) with ANY cardinal feature (radiation, crushing pressure, cold sweat, or cardiac history): Red Alert
  // 3. Moderate pain (5-6/10) with radiation to left arm/jaw AND (crushing pressure OR sweating/breathlessness): Red Alert
  // 4. Otherwise: Not a red alert! (Mild or moderate discomfort, localized, or gas-like)
  const isEmergency =
    severityNum >= 9 ||
    (severityNum >= 7 && (hasRadiation || hasCrushingPressure || hasSweatingOrBreathlessness || hasCardiacHistory)) ||
    (severityNum >= 5 && hasRadiation && (hasCrushingPressure || hasSweatingOrBreathlessness));

  const cardiacRule = RED_FLAG_RULES.find((r) => r.id === 'cardiac');

  const reasons = [];
  if (severityNum >= 7) reasons.push(`High pain severity rating (${severityNum}/10)`);
  if (hasRadiation) reasons.push('Pain radiating to left arm / shoulder / jaw');
  if (hasCrushingPressure) reasons.push('Crushing retrosternal chest pressure reported');
  if (hasSweatingOrBreathlessness) reasons.push('Associated cold sweating or shortness of breath');
  if (hasCardiacHistory) reasons.push('Pre-existing cardiovascular risk history (BP/stent/surgery)');

  if (isEmergency) {
    return {
      isRedFlag: true,
      rule: cardiacRule,
      severity: severityNum,
      reasons,
      triagePriority: 'CRITICAL',
    };
  }

  // Non-emergency categorization
  let riskLevel = 'low';
  let triagePriority = 'ROUTINE';
  if (severityNum >= 5 || (severityNum >= 4 && !isLocalizedOrGas) || hasRadiation || hasCardiacHistory) {
    riskLevel = 'moderate';
    triagePriority = 'URGENT';
  }

  return {
    isRedFlag: false,
    severity: severityNum,
    riskLevel,
    triagePriority,
    isLocalizedOrGas,
    reasons,
  };
};
