import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NoiseOverlay } from "../components/NoiseOverlay";
import { ScreenNav } from "../components/ScreenNav";
import { PrimaryButton } from "../components/PrimaryButton";
import { useQuiz } from "../context/QuizContext";
import { useFormValidation } from "../hooks/useFormValidation";
import { QUESTIONS } from "../lib/engine";
import { BRAND, ROUTES } from "../lib/constants";
import "./Capture.css";

type SubmitStatus = "idle" | "submitting" | "error";

export default function Capture() {
  const navigate = useNavigate();
  const { state, setIdentity, finalize } = useQuiz();
  const [touched, setTouched] = useState({ name: false, email: false });
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validation = useFormValidation({
    name: state.name,
    email: state.email,
    consent: state.consent,
  });

  const allAnswered = state.answers.every((a) => a !== null);

  if (!allAnswered) {
    navigate(ROUTES.quiz, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isReady || status === "submitting") return;

    setStatus("submitting");
    setSubmitError(null);

    try {
      finalize();
      const answers = QUESTIONS.map((q, i) => ({
        questionId: q.id,
        value: state.answers[i]!,
      }));
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name.trim(),
          email: state.email.trim(),
          answers,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      navigate(ROUTES.done);
    } catch (err) {
      setStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="capture-screen">
      <NoiseOverlay />
      <ScreenNav variant="compact" />

      <div className="capture-card">
        <div className="capture-avatar">
          <div className="capture-avatar-ring" />
          <div className="capture-avatar-inner">
            <img src="/jesse.png" alt="Jesse" className="capture-avatar-photo" />
          </div>
        </div>

        <h1 className="capture-heading">Your 7-day plan is ready.</h1>
        <p className="capture-sub">
          Enter your details and we'll email your personalised planner — one
          action a day, tuned to your weakest domain first.
        </p>

        <form className="capture-form" onSubmit={handleSubmit} noValidate>
          <Field
            label="Name"
            name="name"
            type="text"
            autoComplete="name"
            value={state.name}
            onChange={(v) => setIdentity({ name: v })}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            error={touched.name ? validation.name.error : null}
          />

          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={state.email}
            onChange={(v) => setIdentity({ email: v })}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={touched.email ? validation.email.error : null}
          />

          <label className="consent-row">
            <input
              type="checkbox"
              checked={state.consent}
              onChange={(e) => setIdentity({ consent: e.target.checked })}
            />
            <span>
              I agree to the ENDevo{" "}
              <a href={BRAND.privacyUrl} target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
              {" "}and to receiving my 7-day plan at this email.
            </span>
          </label>

          <PrimaryButton
            type="submit"
            size="block"
            disabled={!validation.isReady || status === "submitting"}
          >
            {status === "submitting" ? "Sending…" : "Send My Plan"}
          </PrimaryButton>

          {submitError && (
            <p className="capture-error" role="alert">{submitError}</p>
          )}

          <p className="capture-micro">
            Your planner arrives in minutes. No spam, ever.
          </p>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type: "text" | "email";
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string | null;
  placeholder?: string;
  autoComplete?: string;
}

function Field({ label, name, type, value, onChange, onBlur, error, placeholder, autoComplete }: FieldProps) {
  const id = `field-${name}`;
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        className={`form-input ${error ? "form-input--error" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
