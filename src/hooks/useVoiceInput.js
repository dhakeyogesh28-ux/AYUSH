import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useVoiceInput — High-reliability voice recognition hook for clinical kiosk.
 * Supports 8 Indian languages, handles browser mic permissions gracefully,
 * and maintains steady listening with real-time feedback.
 */
const useVoiceInput = (onTranscript, lang = 'en-IN') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const onTranscriptRef = useRef(onTranscript);
  const isListeningRef = useRef(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    transcriptRef.current = '';
    setTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Attempt to prompt/confirm microphone permission via getUserMedia first
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (permErr) {
        console.warn('Microphone permission warning:', permErr);
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          setError('Microphone permission blocked. Please allow mic access in your browser bar.');
          setIsListening(false);
          return;
        }
      }
    }

    // Stop ongoing speech synthesis immediately so mic doesn't capture speaker audio
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore abort error
        }
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }
        const combined = (final || interim).trim();
        if (combined) {
          transcriptRef.current = combined;
          setTranscript(combined);
          onTranscriptRef.current?.(combined, Boolean(final));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        const finalVal = transcriptRef.current;
        if (finalVal && finalVal.trim()) {
          onTranscriptRef.current?.(finalVal.trim(), true);
        }
      };

      recognition.onerror = (e) => {
        console.warn('Voice input error:', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setError('Microphone permission blocked. Please allow mic in your browser.');
        } else if (e.error === 'audio-capture') {
          setError('No microphone found. Please connect an audio input device.');
        } else if (e.error === 'network') {
          setError('Network issue with speech recognition service.');
        }
        setIsListening(false);
        isListeningRef.current = false;
      };

      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setError('Could not start microphone. Please try again.');
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [lang]);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return { isListening, transcript, error, startListening, stopListening, resetTranscript };
};

export default useVoiceInput;
