import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  QUESTIONS,
  runAssessment,
  type AssessmentResult,
  type Band,
} from "../lib/engine";

export interface QuizState {
  readonly answers: readonly (string | null)[];
  readonly name: string;
  readonly email: string;
  readonly consent: boolean;
  readonly result: AssessmentResult | null;
}

export interface QuizActions {
  answerQuestion: (index: number, value: string) => void;
  setIdentity: (patch: { name?: string; email?: string; consent?: boolean }) => void;
  finalize: () => { band: Band; score: number; result: AssessmentResult };
  reset: () => void;
}

const INITIAL_STATE: QuizState = {
  answers: Array(QUESTIONS.length).fill(null),
  name: "",
  email: "",
  consent: false,
  result: null,
};

interface QuizContextValue extends QuizActions {
  state: QuizState;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuizState>(INITIAL_STATE);

  const answerQuestion = useCallback((index: number, value: string) => {
    setState((s) => {
      const next = s.answers.slice();
      next[index] = value;
      return { ...s, answers: next };
    });
  }, []);

  const setIdentity = useCallback<QuizActions["setIdentity"]>((patch) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const finalize = useCallback(() => {
    const answers = QUESTIONS.map((q, i) => ({
      questionId: q.id,
      value: state.answers[i] ?? "",
    })).filter((a) => a.value);
    const result = runAssessment(state.name.trim() || "Friend", answers);
    setState((s) => ({ ...s, result }));
    return { band: result.band, score: result.totalScore, result };
  }, [state.answers, state.name]);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const value = useMemo<QuizContextValue>(
    () => ({ state, answerQuestion, setIdentity, finalize, reset }),
    [state, answerQuestion, setIdentity, finalize, reset]
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}
