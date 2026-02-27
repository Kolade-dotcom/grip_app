"use client";

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
}

export function Toggle({ on, onToggle }: ToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="w-9 h-5 rounded-[10px] border-none p-[2px] cursor-pointer flex items-center transition-colors duration-200"
      style={{ background: on ? "#6e56ff" : "var(--surface-input)" }}
    >
      <div
        className="w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-200"
        style={{ transform: on ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}
