import React from 'react';

const WelcomeScreen = ({ onStart }) => {
  return (
    <div className="welcome-screen">
      {/* Main content */}
      <div className="welcome-content">
        {/* Brand Header */}
        <div className="welcome-logo animate-fade-in">
          <span className="welcome-eyebrow">स्मार्ट क्लिनिकल कियोस्क · Smart Clinical Kiosk</span>
          <h1 className="welcome-brand">Welcome to Ayush</h1>
          <p className="welcome-subtagline">AI-Powered Integrative OPD & Health Assistant</p>
        </div>

        {/* CTA */}
        <button className="welcome-cta animate-slide-up" onClick={onStart} style={{ animationDelay: '0.2s' }}>
          <span className="cta-icon">▶</span>
          <span className="cta-text">
            <span className="cta-main">Tap to Begin</span>
            <span className="cta-sub">स्पर्श करें · தொடங்கு · ప్రారంభించు</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(WelcomeScreen);
