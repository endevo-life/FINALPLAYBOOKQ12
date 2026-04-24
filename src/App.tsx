import { Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { QuizProvider } from "./context/QuizContext";
import { ROUTES } from "./lib/constants";
import Landing from "./pages/Landing";
import Quiz from "./pages/Quiz";
import Capture from "./pages/Capture";
import ThankYou from "./pages/ThankYou";

export default function App() {
  return (
    <ErrorBoundary>
      <QuizProvider>
        <Routes>
          <Route path={ROUTES.landing} element={<Landing />} />
          <Route path={ROUTES.quiz} element={<Quiz />} />
          <Route path={ROUTES.capture} element={<Capture />} />
          <Route path={ROUTES.done} element={<ThankYou />} />
          <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
        </Routes>
      </QuizProvider>
    </ErrorBoundary>
  );
}
