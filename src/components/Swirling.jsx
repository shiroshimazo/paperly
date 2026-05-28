/**
 * Swirling — animated arc loader (from loading-ui.com).
 *
 * Stroke inherits `currentColor`. Size via Tailwind `size-*` or width/height.
 * Speed is controlled by the `--duration` CSS variable (default 1.5s):
 *   <Swirling style={{ "--duration": "2.5s" }} />
 *
 * Stroke-width and line-cap can be overridden via props; defaults follow the
 * upstream component (50 / round).
 */
export function Swirling({ strokeWidth = 50, strokeLinecap = "round", ...props }) {
  return (
    <svg viewBox="0 0 800 800" aria-hidden="true" {...props}>
      <style>{`
        @keyframes loading-ui-swirling-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes loading-ui-swirling-dash {
          0%   { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
          50%  { stroke-dasharray: 90, 200; stroke-dashoffset: -35; }
          100% { stroke-dasharray: 90, 200; stroke-dashoffset: -125; }
        }
        .loading-ui-swirling-circle {
          transform-origin: center;
          animation:
            loading-ui-swirling-dash var(--duration, 1.5s) ease-in-out infinite,
            loading-ui-swirling-spin calc(var(--duration, 1.5s) * 1.333333) linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .loading-ui-swirling-circle { animation: none; }
        }
      `}</style>
      <circle
        className="loading-ui-swirling-circle"
        cx="400"
        cy="400"
        r="200"
        fill="none"
        stroke="currentColor"
        strokeLinecap={strokeLinecap}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}
