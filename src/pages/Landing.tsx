import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NoiseOverlay } from "../components/NoiseOverlay";
import { ScreenNav } from "../components/ScreenNav";
import { Pill } from "../components/Pill";
import { PrimaryButton } from "../components/PrimaryButton";
import { BRAND, ROUTES } from "../lib/constants";
import "./Landing.css";

const STAT_PILLS = [
  "12 Questions",
  "3 Minutes",
  "Personalised 7-Day Plan",
] as const;

export default function Landing() {
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const togglePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) {
      if (v.ended) v.currentTime = 0;
      void v.play();
    } else {
      v.pause();
    }
  };

  return (
    <div className="landing-screen">
      <NoiseOverlay />
      <ScreenNav variant="landing" />

      <div className="landing-hero">
        <div className="hero-grid">
          <div className="hero-left">
            <div className="jesse-avatar-wrap">
              <div className="jesse-avatar-glow" />
              <img src="/jesse.png" alt="Jesse" className="jesse-image" />
              <div className="jesse-label">ENDevo Q12 Gap Analysis</div>
            </div>

            <h1 className="landing-headline">
              Find your gaps in 12 questions.{" "}
              <span className="headline-accent">Get a 7-day plan.</span>
            </h1>

            <p className="landing-sub">
              Twelve quick questions across Digital, Legal, Financial &amp;
              Physical readiness. Instant Band score. A personalised 7-day
              planner delivered to your inbox.
            </p>

            <div className="landing-stats">
              {STAT_PILLS.map((s, i) => (
                <span key={s} className="landing-stats__item">
                  <Pill variant="stat">{s}</Pill>
                  {i < STAT_PILLS.length - 1 && <span className="stat-divider" />}
                </span>
              ))}
            </div>

            <div className="jesse-intro">
              <strong>Jesse:</strong> I'll walk you through 12 questions across
              Digital, Legal, Financial &amp; Physical readiness — then email
              your personalised 7-day planner.
            </div>
          </div>

          <div className="hero-right">
            <div className="jesse-video-wrap">
              <video
                ref={videoRef}
                className="jesse-video"
                src="/videos/Jesse-q12.mp4"
                autoPlay
                muted={muted}
                playsInline
                controlsList="nodownload"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onContextMenu={(e) => e.preventDefault()}
              />
              <div className="video-controls">
                <button
                  className="video-btn"
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button
                  className="video-btn"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? "Unmute video" : "Mute video"}
                >
                  {muted ? <MutedIcon /> : <SoundIcon />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <PrimaryButton onClick={() => navigate(ROUTES.quiz)}>
          Start the Gap Analysis
        </PrimaryButton>

        <p className="landing-disclaimer">
          Educational only. Your email is used solely to deliver your planner.
          See our privacy policy at{" "}
          <a href={BRAND.privacyUrl} target="_blank" rel="noopener noreferrer">
            endevo.life/privacy-policy
          </a>
          .
        </p>
      </div>

      <div className="landing-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none">
          <path
            d="M0 60 Q360 120 720 60 Q1080 0 1440 60 L1440 120 L0 120 Z"
            fill="rgba(249,115,22,0.08)"
          />
        </svg>
      </div>
    </div>
  );
}

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
  </svg>
);

const MutedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
    <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SoundIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
