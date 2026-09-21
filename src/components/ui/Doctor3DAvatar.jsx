import React, { useEffect, useRef, useState, memo, useCallback } from 'react';

const Doctor3DAvatar = memo(({ isSpeaking }) => {
  const videoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Synchronize video playback with isSpeaking state without stalling seek
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isSpeaking) {
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.log('Autoplay handled, retrying muted:', err);
            video.muted = true;
            video.play().catch(() => {});
          });
        }
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  }, [isSpeaking]);

  // Handle initial frame readiness
  const handleLoadedMetadata = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Handle manual toggle for preview / demonstration
  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  return (
    <div
      className={`doctor-video-avatar-wrap ${isSpeaking ? 'speaking-active' : 'idle'}`}
      onClick={handleTogglePlay}
      title={isSpeaking ? 'AI Doctor Speaking' : 'Click to preview doctor animation and hand gestures'}
    >
      {/* Video Model with lightweight metadata preload & poster for instant response */}
      <video
        ref={videoRef}
        className="doctor-video-element"
        playsInline
        muted
        loop
        preload="metadata"
        poster="/doctor-character.jpg"
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={() => setIsLoaded(true)}
      >
        <source src="/now_bring_the_doctor_at_the_ce.mp4" type="video/mp4" />
        <source src="/doctor-video.mp4" type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>

      {/* 3D Screen Frame and Glass Sheen */}
      <div className="dva-screen-frame" />
      <div className="dva-glass-sheen" />

      {/* Subtle Lighting Vignette */}
      <div className="dva-vignette" />

      {/* Top Status Badge */}
      <div className={`dva-status-badge ${isSpeaking ? 'badge-speaking' : 'badge-ready'}`}>
        <span className={`dva-status-dot ${isSpeaking ? 'dot-pulse' : ''}`} />
        <span>{isSpeaking ? 'Doctor Speaking...' : 'Dr. Ayush'}</span>
      </div>

      {/* Speaking Audio Waveform Overlay */}
      {isSpeaking && (
        <div className="dva-waveform">
          <span className="wave-bar wb1" />
          <span className="wave-bar wb2" />
          <span className="wave-bar wb3" />
          <span className="wave-bar wb4" />
          <span className="wave-bar wb5" />
        </div>
      )}

      {/* Doctor Name Overlay */}
      <div className="dva-footer-info">
        <span className="dva-doc-name">👨‍⚕️ Dr. Ayush</span>
        <span className="dva-doc-role">Ayush OPD</span>
      </div>

      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="dva-loading">
          <div className="dva-spinner">⏳</div>
        </div>
      )}
    </div>
  );
});

export default Doctor3DAvatar;
