import { useState, useRef, useCallback, useEffect } from 'react';

// Global registry to prevent Chromium garbage collection of active utterances
if (typeof window !== 'undefined' && !window._activeAyushUtterances) {
  window._activeAyushUtterances = [];
}

/**
 * Known Male voice tokens across Windows, Edge, Chrome, Android, Apple and Linux systems
 */
const MALE_VOICE_TOKENS = [
  'male', 'man', 'boy', 'david', 'mark', 'george', 'guy', 'ryan', 'eric',
  'christopher', 'james', 'richard', 'charon', 'puck', 'fenrir', 'orpheus',
  'hemant', 'madhur', 'manohar', 'valluvar', 'mohan', 'gagan', 'bashkar',
  'niranjan', 'prabhat', 'ravi', 'karthik', 'arjun', 'rajesh', 'sanjay',
  'vikram', 'amit', 'anand', 'anil', 'ashok', 'deepak', 'manoj', 'mukesh',
  'prakash', 'rahul', 'rohit', 'suresh', 'vijay', 'vinod', 'steffan', 'stefan'
];

/**
 * Known Female voice tokens to avoid for Dr. Ayush male doctor persona
 */
const FEMALE_VOICE_TOKENS = [
  'female', 'woman', 'girl', 'zira', 'kalpana', 'swara', 'priya', 'raveena',
  'neerja', 'shruti', 'heera', 'sunita', 'ananya', 'geeta', 'kavya', 'vidya',
  'pooja', 'maya', 'aditi', 'tanya', 'meera', 'rekha', 'seema', 'radha', 'shashi',
  'sangeeta', 'aruna', 'deepa', 'jaya', 'sapna', 'hazel', 'susan', 'catherine',
  'linda', 'mary', 'victoria', 'eva', 'aoede', 'siri female'
];

/**
 * Helper to retrieve all available speech synthesis voices with caching
 */
const getBrowserVoices = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  try {
    return window.speechSynthesis.getVoices() || [];
  } catch {
    return [];
  }
};

/**
 * Checks if a voice is a Male voice
 */
const isMaleVoice = (voice) => {
  if (!voice || !voice.name) return false;
  const name = voice.name.toLowerCase();
  const hasMaleToken = MALE_VOICE_TOKENS.some((token) => name.includes(token));
  const hasFemaleToken = FEMALE_VOICE_TOKENS.some((token) => name.includes(token));
  return hasMaleToken && !hasFemaleToken;
};

/**
 * Resolves the best available MALE voice for any given language code.
 * Ensures Dr. Ayush always speaks with a warm, masculine physician voice across all 8 Indian languages.
 */
const resolveVoiceForLanguage = (voices, langCode = 'en-IN') => {
  if (!voices || voices.length === 0) return { voice: null, effectiveLang: langCode };

  const cleanLang = (langCode || 'en-IN').toLowerCase().replace('_', '-');
  const baseCode = cleanLang.split('-')[0];

  // Helper to filter and prioritize male voices first, excluding known female names
  const findBestMaleVoice = (filterFn) => {
    const matching = voices.filter(filterFn);
    if (matching.length === 0) return null;

    // 1st priority: Explicitly Male voice
    const male = matching.find((v) => isMaleVoice(v));
    if (male) return male;

    // 2nd priority: Voice that is not explicitly marked female
    const nonFemale = matching.find((v) => {
      const name = v.name.toLowerCase();
      return !FEMALE_VOICE_TOKENS.some((f) => name.includes(f));
    });
    if (nonFemale) return nonFemale;

    // 3rd priority: Any matching voice
    return matching[0];
  };

  // 1. Marathi (mr) — Uses Devanagari script, compatible with native Marathi or Devanagari Hindi male voices
  if (baseCode === 'mr') {
    // 1a. Native Marathi Male voice (e.g. Microsoft Manohar)
    const mrMale = findBestMaleVoice(
      (v) =>
        v.lang.toLowerCase().startsWith('mr') ||
        v.name.toLowerCase().includes('marathi') ||
        v.name.includes('मराठी')
    );
    if (mrMale && isMaleVoice(mrMale)) {
      return { voice: mrMale, effectiveLang: 'mr-IN' };
    }

    // 1b. Devanagari Hindi Male voice (e.g. Microsoft Hemant, Microsoft Madhur, Prabhat, Ravi)
    const hiMale = findBestMaleVoice(
      (v) =>
        (v.lang.toLowerCase().startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.includes('हिन्दी')) &&
        (isMaleVoice(v) || !FEMALE_VOICE_TOKENS.some((f) => v.name.toLowerCase().includes(f)))
    );
    if (hiMale) {
      return { voice: hiMale, effectiveLang: 'hi-IN' };
    }

    if (mrMale) {
      return { voice: mrMale, effectiveLang: 'mr-IN' };
    }

    return { voice: null, effectiveLang: 'mr-IN' };
  }

  // 2. Hindi (hi) — Prioritize Hemant / Madhur / Prabhat / Ravi male voices
  if (baseCode === 'hi') {
    const hiMale = findBestMaleVoice(
      (v) =>
        v.lang.toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.includes('हिन्दी')
    );
    if (hiMale) return { voice: hiMale, effectiveLang: 'hi-IN' };
    return { voice: null, effectiveLang: 'hi-IN' };
  }

  // 3. Bengali (bn) — Prioritize Bashkar / Male
  if (baseCode === 'bn') {
    const bnMale = findBestMaleVoice(
      (v) =>
        v.lang.toLowerCase().startsWith('bn') ||
        v.name.toLowerCase().includes('bengali') ||
        v.name.toLowerCase().includes('bangla')
    );
    if (bnMale) return { voice: bnMale, effectiveLang: 'bn-IN' };
    return { voice: null, effectiveLang: 'bn-IN' };
  }

  // 4. Tamil (ta) — Prioritize Valluvar / Male
  if (baseCode === 'ta') {
    const taMale = findBestMaleVoice(
      (v) =>
        v.lang.toLowerCase().startsWith('ta') ||
        v.name.toLowerCase().includes('tamil')
    );
    if (taMale) return { voice: taMale, effectiveLang: 'ta-IN' };
    return { voice: null, effectiveLang: 'ta-IN' };
  }

  // 5. Telugu (te) — Prioritize Mohan / Male
  if (baseCode === 'te') {
    const teMale = findBestMaleVoice(
      (v) =>
        v.lang.toLowerCase().startsWith('te') ||
        v.name.toLowerCase().includes('telugu')
    );
    if (teMale) return { voice: teMale, effectiveLang: 'te-IN' };
    return { voice: null, effectiveLang: 'te-IN' };
  }

  // 6. Kannada (kn) — Prioritize Gagan / Male
  if (baseCode === 'kn') {
    const knMale = findBestMaleVoice(
      (v) =>
        v.lang.toLowerCase().startsWith('kn') ||
        v.name.toLowerCase().includes('kannada')
    );
    if (knMale) return { voice: knMale, effectiveLang: 'kn-IN' };
    return { voice: null, effectiveLang: 'kn-IN' };
  }

  // 7. Gujarati (gu) — Prioritize Niranjan / Male
  if (baseCode === 'gu') {
    const guMale = findBestMaleVoice(
      (v) =>
        v.lang.toLowerCase().startsWith('gu') ||
        v.name.toLowerCase().includes('gujarati')
    );
    if (guMale) return { voice: guMale, effectiveLang: 'gu-IN' };
    return { voice: null, effectiveLang: 'gu-IN' };
  }

  // 8. English (en) — Prioritize Indian Male English voices (Prabhat, Ravi, en-IN) or Western Male voices (David, Mark, George, Guy)
  if (baseCode === 'en') {
    const enIndianMale = findBestMaleVoice(
      (v) =>
        (v.lang.toLowerCase().startsWith('en-in') ||
          (v.lang.toLowerCase().startsWith('en') && v.name.toLowerCase().includes('india'))) &&
        (isMaleVoice(v) || !FEMALE_VOICE_TOKENS.some((f) => v.name.toLowerCase().includes(f)))
    );
    if (enIndianMale && isMaleVoice(enIndianMale)) {
      return { voice: enIndianMale, effectiveLang: 'en-IN' };
    }

    const enMale = findBestMaleVoice(
      (v) =>
        v.lang.toLowerCase().startsWith('en') &&
        (isMaleVoice(v) || !FEMALE_VOICE_TOKENS.some((f) => v.name.toLowerCase().includes(f)))
    );
    if (enMale) return { voice: enMale, effectiveLang: 'en-US' };
  }

  // Fallback
  return { voice: null, effectiveLang: langCode };
};

/**
 * Fallback Audio Player using Google Translate TTS Audio endpoint
 */
const playAudioFallback = (text, langCode = 'mr') => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !text) {
      resolve(false);
      return;
    }

    try {
      const baseLang = (langCode || 'mr').split('-')[0].toLowerCase();
      const cleanText = text.replace(/[*#_~`]/g, '').trim().slice(0, 190);
      const encoded = encodeURIComponent(cleanText);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${baseLang}&q=${encoded}`;

      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      audio.playbackRate = 0.94;

      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => resolve(false));
      }
    } catch {
      resolve(false);
    }
  });
};

const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);
  const speakTimeoutRef = useRef(null);
  const audioFallbackRef = useRef(null);
  const [voices, setVoices] = useState(() => getBrowserVoices());

  // Listen for voice loading changes in Chromium
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoices = () => {
      const v = getBrowserVoices();
      if (v.length > 0) setVoices(v);
    };

    updateVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', updateVoices);
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', updateVoices);
    };
  }, []);

  const stop = useCallback(() => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }

    if (audioFallbackRef.current) {
      try {
        audioFallbackRef.current.pause();
        audioFallbackRef.current.currentTime = 0;
      } catch {
        // Ignore audio stop error
      }
      audioFallbackRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore synthesis cancel error
      }
    }

    if (typeof window !== 'undefined' && window._activeAyushUtterances) {
      window._activeAyushUtterances = [];
    }

    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text, lang = 'en-IN') => {
      if (typeof window === 'undefined') return;

      const cleanText = (text || '')
        .replace(/[*#_~`]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        setIsSpeaking(false);
        return;
      }

      // Stop ongoing speech
      stop();

      // Run speech asynchronously
      speakTimeoutRef.current = setTimeout(() => {
        const synth = window.speechSynthesis;
        const availableVoices = voices.length > 0 ? voices : getBrowserVoices();
        const { voice: selectedVoice, effectiveLang } = resolveVoiceForLanguage(
          availableVoices,
          lang
        );

        if (!synth) {
          setIsSpeaking(true);
          playAudioFallback(cleanText, lang).finally(() => setIsSpeaking(false));
          return;
        }

        try {
          // Unpause Chromium speech synthesis if stuck
          if (synth.paused) {
            synth.resume();
          }

          const utterance = new SpeechSynthesisUtterance(cleanText);
          utteranceRef.current = utterance;

          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }

          utterance.lang = selectedVoice?.lang || effectiveLang || lang;
          utterance.rate = 0.92;
          // Masculine pitch tuning: 0.88 produces a warm, deep, authoritative male doctor voice
          utterance.pitch = 0.88;
          utterance.volume = 1.0;

          // Prevent GC cancellation in Chromium
          if (window._activeAyushUtterances) {
            window._activeAyushUtterances.push(utterance);
          }

          utterance.onstart = () => {
            setIsSpeaking(true);
          };

          utterance.onend = () => {
            if (window._activeAyushUtterances) {
              window._activeAyushUtterances = window._activeAyushUtterances.filter(
                (u) => u !== utterance
              );
            }
            setIsSpeaking(false);
          };

          utterance.onerror = (err) => {
            console.warn('SpeechSynthesis error, trying audio fallback:', err);
            if (window._activeAyushUtterances) {
              window._activeAyushUtterances = window._activeAyushUtterances.filter(
                (u) => u !== utterance
              );
            }

            playAudioFallback(cleanText, lang).finally(() => {
              setIsSpeaking(false);
            });
          };

          synth.speak(utterance);

          // Workaround for Chrome 15-second speech synthesis pause bug
          const resumeInterval = setInterval(() => {
            if (!synth.speaking) {
              clearInterval(resumeInterval);
            } else {
              synth.pause();
              synth.resume();
            }
          }, 10000);

          utterance.addEventListener(
            'end',
            () => clearInterval(resumeInterval),
            { once: true }
          );
        } catch (err) {
          console.warn('SpeechSynthesis invocation failed:', err);
          setIsSpeaking(true);
          playAudioFallback(cleanText, lang).finally(() => setIsSpeaking(false));
        }
      }, 30);
    },
    [stop, voices]
  );

  return { speak, stop, isSpeaking };
};

export default useSpeech;


