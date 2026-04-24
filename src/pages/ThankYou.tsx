import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { NoiseOverlay } from "../components/NoiseOverlay";
import { ScreenNav } from "../components/ScreenNav";
import { Pill } from "../components/Pill";
import { useQuiz } from "../context/QuizContext";
import { BAND_DEFS } from "../data/bands";
import { ROUTES } from "../lib/constants";
import type { DayAssignment } from "../lib/engine";
import "./ThankYou.css";

export default function ThankYou() {
  const { state, reset } = useQuiz();

  if (!state.result) {
    return <Navigate to={ROUTES.landing} replace />;
  }

  const band = BAND_DEFS[state.result.band];
  const plan = state.result.plan;

  return (
    <div className="thankyou-screen">
      <NoiseOverlay />
      <ScreenNav variant="compact" />

      <div className="thankyou-card">
        <div className="thankyou-avatar">
          <div
            className="thankyou-avatar__glow"
            style={{ background: `radial-gradient(circle, ${band.color}55 0%, transparent 70%)` }}
          />
          <img src="/jesse.png" alt="Jesse" className="thankyou-avatar__img" />
          <div className="thankyou-avatar__badge" style={{ background: band.color }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h1 className="thankyou-heading">Your 7-day plan is on its way.</h1>
        <p className="thankyou-sub">
          We've sent your planner to <strong>{state.email}</strong>.
        </p>

        <div className="thankyou-band-block">
          <span className="thankyou-eyebrow">Your Result</span>
          <div className="thankyou-band-row">
            <div className="thankyou-band-pulse" style={{ boxShadow: `0 0 0 0 ${band.color}` }}>
              <Pill variant="band" color={band.color}>{band.label}</Pill>
            </div>
            <div className="thankyou-score">
              {state.result.totalScore}/24 · {state.result.percentReady}% ready
            </div>
          </div>
          <p className="thankyou-tone">{band.tone}</p>
        </div>

        <div className="thankyou-actions">
          <h2 className="thankyou-actions-title">Your 7 days at a glance</h2>
          <div className="thankyou-actions-list">
            {plan.map((day, i) => (
              <DayCard key={day.day} index={i} day={day} />
            ))}
          </div>
        </div>

        <Link to={ROUTES.landing} onClick={reset} className="thankyou-back">
          <span aria-hidden="true">←</span> Start over
        </Link>
      </div>
    </div>
  );
}

interface DayCardProps {
  index: number;
  day: DayAssignment;
}

function DayCard({ index, day }: DayCardProps) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setDone((d) => !d)}
      className={`action-card ${done ? "action-card--done" : ""}`}
      style={{ animationDelay: `${0.35 + index * 0.08}s` }}
      aria-pressed={done}
    >
      <div className="action-card__head">
        <span className="action-card__num">
          {done ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            day.day
          )}
        </span>
        <h3 className="action-card__title">{day.action.title}</h3>
        <span className="action-card__time">{day.action.time}</span>
      </div>
      <p className="action-card__why">
        <strong>Why:</strong> {day.action.socialProof}
      </p>
      <p className="action-card__how">
        <strong>How:</strong> {day.action.howTo}
      </p>
      <div className="action-card__tap-hint">
        {done ? "Marked as done — tap to undo" : "Tap when you've done it"}
      </div>
    </button>
  );
}
