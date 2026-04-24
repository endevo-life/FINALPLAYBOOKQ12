import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NoiseOverlay } from "../components/NoiseOverlay";
import { ScreenNav } from "../components/ScreenNav";
import { Pill } from "../components/Pill";
import { ProgressBar } from "../components/ProgressBar";
import { QUESTIONS } from "../lib/engine";
import { useQuiz } from "../context/QuizContext";
import { useSlideAnimation } from "../hooks/useSlideAnimation";
import { ROUTES, TIMING } from "../lib/constants";
import "./Quiz.css";

export default function Quiz() {
  const navigate = useNavigate();
  const { state, answerQuestion } = useQuiz();
  const [index, setIndex] = useState(0);

  const q = QUESTIONS[index];
  const selected = state.answers[index];
  const slide = useSlideAnimation(index);

  const handleSelect = (value: string) => {
    answerQuestion(index, value);
    setTimeout(() => {
      slide.slideOut(() => {
        if (index + 1 < QUESTIONS.length) {
          setIndex(index + 1);
        } else {
          navigate(ROUTES.capture);
        }
      }, TIMING.slideOutMs);
    }, TIMING.answerCommitMs);
  };

  const handleBack = () => {
    if (index === 0) {
      navigate(ROUTES.landing);
    } else {
      slide.slideOut(() => setIndex(index - 1), TIMING.backSlideMs);
    }
  };

  return (
    <div className="quiz-screen">
      <NoiseOverlay />

      <ScreenNav
        variant="compact"
        leading={
          <>
            <button className="back-btn" onClick={handleBack} aria-label="Go back">
              <BackIcon />
            </button>
            <div className="quiz-progress-info">
              Q<strong>{index + 1}</strong> of {QUESTIONS.length}
            </div>
          </>
        }
      />

      <ProgressBar
        value={index + 1}
        max={QUESTIONS.length}
        label={`Question ${index + 1} of ${QUESTIONS.length}`}
      />

      <div className={`quiz-card ${slide.className}`}>
        <Pill variant="domain">{q.domain}</Pill>
        <h2 className="quiz-question">{q.text}</h2>

        <div className="answers-list">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              className={`answer-btn ${selected === opt.value ? "answer-btn--selected" : ""}`}
              onClick={() => handleSelect(opt.value)}
              disabled={slide.animating}
            >
              <span className="answer-btn__label">{opt.label}</span>
              {selected === opt.value && <CheckIcon />}
            </button>
          ))}
        </div>

        <div className="jesse-hint">
          <div className="jesse-hint-avatar">J</div>
          <span>Your score stays hidden until you finish all {QUESTIONS.length}.</span>
        </div>
      </div>
    </div>
  );
}

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <span className="answer-btn__check">
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="white" fillOpacity="0.2" />
      <path d="M5 9l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);
