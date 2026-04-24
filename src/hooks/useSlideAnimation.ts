import { useEffect, useRef, useState } from "react";

interface SlideState { visible: boolean; animating: boolean; }

interface SlideControls {
  slideOut: (after: () => void, delayMs?: number) => void;
  className: "slide-in" | "slide-out";
}

export function useSlideAnimation(key: unknown): SlideState & SlideControls {
  const [state, setState] = useState<SlideState>({ visible: true, animating: false });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setState({ visible: true, animating: false });
  }, [key]);

  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
    };
  }, []);

  const slideOut: SlideControls["slideOut"] = (after, delayMs = 320) => {
    if (state.animating) return;
    setState({ visible: false, animating: true });
    const t = setTimeout(after, delayMs);
    timers.current.push(t);
  };

  return {
    ...state,
    slideOut,
    className: state.visible ? "slide-in" : "slide-out",
  };
}
