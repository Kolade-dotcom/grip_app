"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface MemberSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function MemberSearch({ value, onChange }: MemberSearchProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // Debounce the search to avoid excessive API calls
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(val);
      }, 300);
    },
    [onChange]
  );

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-[8px] border transition-colors ${
        focused
          ? "border-accent bg-surface-input"
          : "border-border bg-surface-input"
      }`}
    >
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-text-muted flex-shrink-0"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search members..."
        className="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-muted"
      />
    </div>
  );
}
