"use client";

import { useState, useEffect, useCallback } from "react";

interface CountdownTimerProps {
  endTime: number;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calcTimeLeft(endTime: number): TimeLeft {
  const total = Math.max(0, endTime - Math.floor(Date.now() / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    total,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function CountdownTimer({ endTime, className = "" }: CountdownTimerProps) {
  const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(endTime));

  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft(endTime)), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (time.total <= 0) {
    return (
      <span className={`text-text-muted line-through text-sm ${className}`}>
        Ended
      </span>
    );
  }

  const urgent = time.total < 300;
  const warning = !urgent && time.total < 3600;

  const color = urgent ? "#EF4444" : warning ? "#F59E0B" : "#F9FAFB";

  const segments = [
    { value: pad(time.days), label: "Days" },
    { value: pad(time.hours), label: "Hrs" },
    { value: pad(time.minutes), label: "Min" },
    { value: pad(time.seconds), label: "Sec" },
  ];

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${urgent ? "animate-pulse" : ""} ${className}`}
    >
      {segments.map((seg, i) => (
        <div key={seg.label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <span
              className="rounded-lg px-2 py-1 text-center text-sm font-bold tabular-nums leading-none"
              style={{
                color,
                background: urgent
                  ? "rgba(239,68,68,0.1)"
                  : warning
                    ? "rgba(245,158,11,0.1)"
                    : "rgba(255,255,255,0.05)",
                minWidth: 36,
              }}
            >
              {seg.value}
            </span>
            <span className="mt-0.5 text-[9px] uppercase tracking-wider text-text-muted">
              {seg.label}
            </span>
          </div>
          {i < 3 && (
            <span className="text-text-muted font-bold pb-3" style={{ color }}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}
