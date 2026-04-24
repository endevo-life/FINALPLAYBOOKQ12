import { Link, Navigate } from "react-router-dom";
import { NoiseOverlay } from "../components/NoiseOverlay";
import { ScreenNav } from "../components/ScreenNav";
import { useQuiz } from "../context/QuizContext";
import { ROUTES } from "../lib/constants";
import "./ThankYou.css";

export default function ThankYou() {
  const { state, reset } = useQuiz();

  if (!state.result) {
    return <Navigate to={ROUTES.landing} replace />;
  }

  return (
    <div className="thankyou-screen">
      <NoiseOverlay />
      <ScreenNav variant="compact" />

      <div className="thankyou-card">
        <div className="thankyou-avatar">
          <div className="thankyou-avatar__glow" />
          <img src="/jesse.png" alt="Jesse" className="thankyou-avatar__img" />
          <div className="thankyou-avatar__badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h1 className="thankyou-heading">
          Your Detailed 7-Day Planner is on its way.
        </h1>

        <p className="thankyou-sub">
          Expect to receive an email from{" "}
          <strong className="thankyou-sender">hello@endevo.life</strong> in the next few minutes.
        </p>

        <p className="thankyou-sub thankyou-sub--soft">
          If you don&rsquo;t find it in your inbox, please check your spam folder.
        </p>

        <Link to={ROUTES.landing} onClick={reset} className="thankyou-back">
          <span aria-hidden="true">&larr;</span> Start over
        </Link>
      </div>
    </div>
  );
}
