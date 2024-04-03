import { useLayoutEffect, useRef } from "react";
import * as spinjs from "spin.js";
import "spin.js/spin.css";

import "./Spinner.scss";

export default function Spinner() {
  const elementRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    let spinner: spinjs.Spinner | null = null;

    if (elementRef.current !== null) {
      spinner = new spinjs.Spinner({lines: 10, scale: 0.5});
      spinner.spin(elementRef.current);
    }

    return () => {
      if (spinner !== null) {
        spinner.stop();
      }
    }
  }, []);

  // \u200b is a zero width space, which forces the span to line height

  return (
    <span className="Spinner" ref={elementRef}>{"\u200b"}</span>
  );
}
