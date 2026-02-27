interface GripLogoProps {
  size?: number;
}

export function GripLogo({ size = 28 }: GripLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="gripGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6e56ff" />
          <stop offset="50%" stopColor="#9b6dff" />
          <stop offset="100%" stopColor="#6e56ff" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#gripGrad)" />
      <path
        d="M20 10c-5.52 0-10 4.48-10 10s4.48 10 10 10c3.5 0 6.58-1.8 8.37-4.52"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <path d="M28 20h-8" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" opacity="0.95" />
      <path d="M20 20v-4" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" opacity="0.6" />
      <circle cx="28.2" cy="15" r="2" fill="#fff" opacity="0.7" />
    </svg>
  );
}

export function GripWordmark() {
  return (
    <span className="font-heading text-[17px] font-extrabold tracking-[-0.04em] text-text-primary">
      Grip
    </span>
  );
}
