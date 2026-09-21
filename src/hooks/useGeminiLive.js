import { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiLiveClient } from '../utils/geminiLiveClient';
import { checkRedFlags } from '../data/redFlagRules';

export default function useGeminiLive({
  sessionId,
  languageCode = 'en',
  opdMode = 'allopathy',
  onRedFlag,
  onClinicalUpdate,
  onUserSpeech,
  speakFallback,
  onAiTurnResponse,
}) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'connecting' | 'ready' | 'listening' | 'ai_speaking' | 'error'
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiSpeechText, setAiSpeechText] = useState('');
  const [userSpeechText, setUserSpeechText] = useState('');
  const [error, setError] = useState(null);
  const [clinicalRecord, setClinicalRecord] = useState(null);

  const clientRef = useRef(null);
  const accumulatedTextRef = useRef('');
  const hasReceivedAudioChunksRef = useRef(false);
  const recognitionRef = useRef(null);
  const fallbackTranscriptRef = useRef('');
  const sendUserMessageRef = useRef(null);
  const onUserSpeechRef = useRef(null);
  const onRedFlagRef = useRef(onRedFlag);
  const onClinicalUpdateRef = useRef(onClinicalUpdate);
  const speakFallbackRef = useRef(speakFallback);
  const onAiTurnResponseRef = useRef(onAiTurnResponse);

  useEffect(() => {
    onUserSpeechRef.current = onUserSpeech;
    onRedFlagRef.current = onRedFlag;
    onClinicalUpdateRef.current = onClinicalUpdate;
    speakFallbackRef.current = speakFallback;
    onAiTurnResponseRef.current = onAiTurnResponse;
  });

  // Clean up client on unmount or session/lang change
  const cleanup = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort error
      }
      recognitionRef.current = null;
    }
  }, []);

  // Initialize or reconnect live client
  const initClient = useCallback(() => {
    if (!sessionId) return () => {};
    let mounted = true;

    const client = new GeminiLiveClient({
      sessionId,
      languageCode,
      opdMode,
      onStatusChange: (newStatus) => {
        if (!mounted) return;
        setStatus(newStatus);
        if (newStatus === 'listening') setIsListening(true);
        else if (newStatus !== 'listening') setIsListening(false);
      },
      onTextChunk: (chunk) => {
        if (!mounted) return;
        accumulatedTextRef.current += chunk;
        setAiSpeechText(accumulatedTextRef.current);
        setIsAiSpeaking(true);

        // Check red flags in streaming text
        const flags = checkRedFlags(accumulatedTextRef.current);
        if (flags && flags.length > 0) {
          onRedFlagRef.current?.(flags);
        }
      },
      onAudioChunk: () => {
        if (mounted) {
          hasReceivedAudioChunksRef.current = true;
          setIsAiSpeaking(true);
        }
      },
      onAudioPlayStart: () => {
        if (mounted) {
          hasReceivedAudioChunksRef.current = true;
          setIsAiSpeaking(true);
        }
      },
      onAudioPlayEnd: () => {
        if (mounted) setIsAiSpeaking(false);
      },
      onTurnComplete: (updatedRecord) => {
        if (!mounted) return;
        const fullReply = accumulatedTextRef.current?.trim();
        
        if (onAiTurnResponseRef.current) {
          onAiTurnResponseRef.current({
            reply: fullReply,
            question: fullReply,
            clinical_record: updatedRecord,
          });
        } else if (!hasReceivedAudioChunksRef.current && fullReply) {
          speakFallbackRef.current?.(fullReply);
        }
        hasReceivedAudioChunksRef.current = false;
        setIsAiSpeaking(false);

        if (updatedRecord) {
          setClinicalRecord(updatedRecord);
          onClinicalUpdateRef.current?.(updatedRecord);
        }
        accumulatedTextRef.current = '';
      },
      onError: (err) => {
        console.warn('Live WS info (using REST fallback):', err);
        if (mounted) {
          setIsAiSpeaking(false);
          setStatus('ready');
        }
      },
    });

    clientRef.current = client;
    client
      .connect()
      .then(() => {
        if (mounted) setStatus('ready');
      })
      .catch((err) => {
        console.warn('Could not connect to Gemini Live WS, ready for REST fallback:', err);
        if (mounted) setStatus('ready');
      });

    return () => {
      mounted = false;
      cleanup();
    };
  }, [sessionId, languageCode, opdMode, cleanup]);

  useEffect(() => {
    const unmount = initClient();
    return () => {
      if (typeof unmount === 'function') unmount();
    };
  }, [initClient]);

  // Send message (via Live WS or REST fallback)
  const sendUserMessage = useCallback(
    async (text) => {
      if (!text || !text.trim()) return;
      accumulatedTextRef.current = '';
      hasReceivedAudioChunksRef.current = false;
      setUserSpeechText(text);

      // Check red flags in user speech
      const flags = checkRedFlags(text);
      if (flags && flags.length > 0) {
        onRedFlagRef.current?.(flags);
      }

      if (clientRef.current && clientRef.current.isConnected) {
        clientRef.current.sendTextPrompt(text);
      } else {
        // Fallback REST call to /api/gemini/converse
        try {
          setStatus('ai_speaking');
          setIsAiSpeaking(true);
          const res = await fetch('/api/gemini/converse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              user_speech_text: text,
              language_code: languageCode,
              opd_mode: opdMode,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setAiSpeechText(data.reply);
            if (data.clinical_record) {
              setClinicalRecord(data.clinical_record);
              onClinicalUpdateRef.current?.(data.clinical_record);
            }
            if (onAiTurnResponseRef.current) {
              onAiTurnResponseRef.current(data);
            } else {
              speakFallbackRef.current?.(data.reply);
            }
          }
        } catch (e) {
          console.error('REST Converse Error:', e);
        } finally {
          setStatus('idle');
        }
      }
    },
    [sessionId, languageCode, opdMode]
  );

  useEffect(() => {
    sendUserMessageRef.current = sendUserMessage;
  }, [sendUserMessage]);

  // Start listening to microphone with high-accuracy browser speech recognition
  const startListening = useCallback(async () => {
    setError(null);
    fallbackTranscriptRef.current = '';

    // Stop ongoing speech synthesis immediately so mic doesn't capture speaker audio
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speech cancel error
      }
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setError(
        languageCode === 'hi'
          ? 'आपके ब्राउज़र में आवाज़ पहचान (Speech Recognition) उपलब्ध नहीं है। कृपया Chrome या Edge का उपयोग करें।'
          : 'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.'
      );
      return;
    }

    // Explicitly check/request getUserMedia audio stream so browser grants mic permission cleanly
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (permErr) {
        console.warn('Microphone permission check warning:', permErr);
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          setError(
            languageCode === 'hi'
              ? 'माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया ब्राउज़र पता बार में माइक अनुमति दें।'
              : 'Microphone permission blocked. Please allow microphone access in your browser.'
          );
          setIsListening(false);
          setStatus('idle');
          return;
        }
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

      const recognition = new SpeechRec();
      recognitionRef.current = recognition;

      const langMap = {
        hi: 'hi-IN',
        mr: 'mr-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        kn: 'kn-IN',
        bn: 'bn-IN',
        gu: 'gu-IN',
        en: 'en-IN',
      };
      recognition.lang = langMap[languageCode] || 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setStatus('listening');
        setError(null);
      };

      recognition.onresult = (e) => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }
        const currentTranscript = (final || interim).trim();
        if (currentTranscript) {
          fallbackTranscriptRef.current = currentTranscript;
          setUserSpeechText(currentTranscript);
          if (final && onUserSpeechRef.current) {
            onUserSpeechRef.current(final.trim());
          }
        }
      };

      recognition.onend = async () => {
        setIsListening(false);
        setStatus('idle');
        const finalText = fallbackTranscriptRef.current?.trim();
        if (finalText) {
          // Immediately notify component handler so answers can be matched/recorded
          onUserSpeechRef.current?.(finalText);
          // Also send to Dr. Ayush AI conversation
          await sendUserMessageRef.current?.(finalText);
        }
      };

      recognition.onerror = (e) => {
        console.warn('SpeechRecognition error:', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setError(
            languageCode === 'hi'
              ? 'माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया ब्राउज़र पता बार में माइक अनुमति दें।'
              : languageCode === 'mr'
              ? 'मायक्रोफोनची परवानगी नाकारली. कृपया ब्राउझरमध्ये परवानगी द्या.'
              : 'Microphone permission blocked. Please allow microphone access in your browser.'
          );
        } else if (e.error === 'audio-capture') {
          setError(
            languageCode === 'hi'
              ? 'माइक्रोफ़ोन नहीं मिला। कृपया अपना माइक जांचें।'
              : 'No microphone found. Please check your audio input device.'
          );
        } else if (e.error === 'network') {
          setError(
            languageCode === 'hi'
              ? 'इंटरनेट कनेक्शन में समस्या है। कृपया नेटवर्क जांचें।'
              : 'Network error during speech recognition. Please check your connection.'
          );
        }
        setIsListening(false);
        setStatus('idle');
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setError('Could not start microphone: ' + (err.message || 'Unknown error'));
      setIsListening(false);
      setStatus('idle');
    }
  }, [languageCode]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error
      }
    }
    setIsListening(false);
    setStatus('idle');
  }, []);

  return {
    status,
    isAiSpeaking,
    isListening,
    aiSpeechText,
    userSpeechText,
    clinicalRecord,
    error,
    startListening,
    stopListening,
    sendUserMessage,
    reconnect: initClient,
  };
}

