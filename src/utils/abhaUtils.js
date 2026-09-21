// ABHA (Ayushman Bharat Health Account) & Aadhaar Identity Utilities

export const validateABHA = (id) => {
  // ABHA ID is exactly 14 digits
  const cleaned = String(id || '').replace(/\D/g, '');
  return cleaned.length === 14;
};

export const formatABHA = (id) => {
  const cleaned = String(id || '').replace(/\D/g, '');
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
};

export const validateMobile = (mobile) => {
  // 10 digits
  const cleaned = String(mobile || '').replace(/\D/g, '');
  return cleaned.length === 10;
};

export const validateAadhaar = (aadhaar) => {
  // 12 digits
  const cleaned = String(aadhaar || '').replace(/\D/g, '');
  return cleaned.length === 12;
};

export const formatAadhaar = (aadhaar) => {
  const cleaned = String(aadhaar || '').replace(/\D/g, '');
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`;
};

export const validateOTP = (otp) => {
  // 6 digits
  const cleaned = String(otp || '').replace(/\D/g, '');
  return cleaned.length === 6;
};

export const generatePatientId = () => {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MK-${ts}-${rand}`;
};

// Multilingual word-to-digit dictionary for speech recognition
const SPOKEN_DIGIT_MAP = {
  // English
  'zero': '0', 'oh': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
  // Hindi
  'शून्य': '0', 'जीरो': '0', 'ज़ीरो': '0',
  'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4',
  'पांच': '5', 'पाँच': '5', 'छह': '6', 'छः': '6',
  'सात': '7', 'आठ': '8', 'नौ': '9', 'नौं': '9',
  // Marathi
  'दोन': '2', 'पाच': '5', 'सहा': '6', 'नऊ': '9',
  // Gujarati
  'શૂન્ય': '0', 'ઝીરો': '0', 'એક': '1', 'બે': '2', 'ત્રણ': '3', 'ચાર': '4',
  'પાંચ': '5', 'છ': '6', 'સાત': '7', 'આઠ': '8', 'નવ': '9',
  // Bengali
  'শূন্য': '0', 'জিরো': '0', 'এক': '1', 'দুই': '2', 'তিন': '3', 'চার': '4',
  'পাঁচ': '5', 'ছয়': '6', 'সাত': '7', 'আট': '8', 'নয়': '9',
  // Tamil
  'பூஜ்ஜியம்': '0', 'ஜீரோ': '0', 'ஒன்று': '1', 'இரண்டு': '2', 'மூன்று': '3',
  'நான்கு': '4', 'ஐந்து': '5', 'ஆறு': '6', 'ஏழு': '7', 'எட்டு': '8', 'ஒன்பது': '9',
  // Telugu
  'సున్నా': '0', 'జీరో': '0', 'ఒకటి': '1', 'రెండు': '2', 'మూడు': '3',
  'నాలుగు': '4', 'ఐదు': '5', 'ఆరు': '6', 'ఏడు': '7', 'ఎనిమిది': '8', 'తొమ్మిది': '9',
  // Kannada
  'ಸೊನ್ನೆ': '0', 'ಜೀರೋ': '0', 'ಒಂದು': '1', 'ಎರಡು': '2', 'ಮೂರು': '3',
  'ನಾಲ್ಕು': '4', 'ಐದು': '5', 'ಆರು': '6', 'ಏಳು': '7', 'ಎಂಟು': '8', 'ಒಂಬತ್ತು': '9',
  // Unicode Indic Digits
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4', '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
  '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4', '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
  '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
  '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4', '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
};

/**
 * Extracts digits from raw speech text (converting multilingual spoken numbers and digits)
 */
export const extractDigitsFromSpeech = (spokenText) => {
  if (!spokenText) return '';
  const text = String(spokenText).trim().toLowerCase();
  
  // Direct ASCII digits
  let result = '';
  const tokens = text.split(/[\s,.-]+/);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;

    // Check if token is "double" or "triple"
    if (token === 'double' && i + 1 < tokens.length) {
      const nextDigit = SPOKEN_DIGIT_MAP[tokens[i + 1]] || (/^\d$/.test(tokens[i + 1]) ? tokens[i + 1] : null);
      if (nextDigit) {
        result += nextDigit + nextDigit;
        i++;
        continue;
      }
    }
    if (token === 'triple' && i + 1 < tokens.length) {
      const nextDigit = SPOKEN_DIGIT_MAP[tokens[i + 1]] || (/^\d$/.test(tokens[i + 1]) ? tokens[i + 1] : null);
      if (nextDigit) {
        result += nextDigit + nextDigit + nextDigit;
        i++;
        continue;
      }
    }

    // Check word map
    if (SPOKEN_DIGIT_MAP[token]) {
      result += SPOKEN_DIGIT_MAP[token];
      continue;
    }

    // Check characters within token for individual digits or unicode digits
    for (const char of token) {
      if (/\d/.test(char)) {
        result += char;
      } else if (SPOKEN_DIGIT_MAP[char]) {
        result += SPOKEN_DIGIT_MAP[char];
      }
    }
  }

  return result;
};

// Simulates sending OTP to mobile
export const sendOTP = async (targetNumber) => {
  await new Promise(r => setTimeout(r, 600));
  return {
    success: true,
    maskedTarget: targetNumber.length === 10
      ? `+91 ******${targetNumber.slice(-4)}`
      : `****-****-${targetNumber.slice(-4)}`,
    demoOtp: '123456',
  };
};

// Simulates verifying 6-digit OTP
export const verifyOTP = async (otp, expected = '123456') => {
  await new Promise(r => setTimeout(r, 700));
  const cleaned = String(otp).replace(/\D/g, '');
  if (cleaned.length !== 6) return false;
  // Accepts standard kiosk demo OTP 123456 or any 6-digit number in mock environment
  return true;
};

// Simulates fetching patient data from ABDM registry after OTP verification
export const fetchABHAPatient = async (abhaId) => {
  await new Promise(r => setTimeout(r, 800));
  return {
    abhaId: formatABHA(abhaId),
    name: 'Ramesh Kumar Sharma',
    age: 52,
    gender: 'Male',
    dob: '15-Mar-1973',
    bloodGroup: 'B+',
    address: 'Village Ramnagar, Dist. Varanasi, UP — 221001',
    mobile: '9876543210',
    registeredHospitals: ['AIIMS New Delhi', 'BHU Hospital, Varanasi'],
    lastVisit: '12-Jul-2025',
    isVerified: true,
  };
};

// Simulates verifying Aadhaar and creating a new ABHA registered patient
export const registerNewPatientWithAadhaar = async ({ aadhaar, mobile, name }) => {
  await new Promise(r => setTimeout(r, 900));
  const genAbha = `91-${aadhaar.slice(0, 4)}-${aadhaar.slice(4, 8)}-${aadhaar.slice(8, 12)}`;
  return {
    patientId: generatePatientId(),
    abhaId: genAbha,
    aadhaarNumber: formatAadhaar(aadhaar),
    name: name?.trim() || 'Suresh Patel',
    mobile: mobile.replace(/\D/g, ''),
    age: 46,
    gender: 'Male',
    bloodGroup: 'O+',
    address: 'Sector 4, Gandhinagar, Gujarat — 382010',
    isNew: true,
    isVerified: true,
  };
};
