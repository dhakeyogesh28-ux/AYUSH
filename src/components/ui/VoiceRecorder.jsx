import React from 'react';
import useVoiceInput from '../../hooks/useVoiceInput';
import ModernMic from './ModernMic';

const VoiceRecorder = ({
  onTranscript,
  lang = 'en-IN',
  disabled = false,
  labelIdle = 'Tap to speak',
  labelListening = 'Listening... Tap to finish',
}) => {
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput(onTranscript, lang);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  return (
    <div className="voice-recorder-wrapper">
      <ModernMic
        isListening={isListening}
        isAiSpeaking={false}
        onToggle={handleToggle}
        disabled={disabled}
        labelIdle={labelIdle}
        labelListening={labelListening}
      />

      {transcript && (
        <div className="voice-transcript-card animate-fade-in">
          <span className="transcript-live-dot" />
          <p className="transcript-content">"{transcript}"</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(VoiceRecorder);
