import { useEffect, useState } from "react";
import { formatClock } from "../lib/time";

export const Clock = () => {
  const [text, setText] = useState(() => formatClock(new Date()));

  useEffect(() => {
    const id = setInterval(() => setText(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div id="clock">
      <span id="time">{text}</span>
    </div>
  );
};
