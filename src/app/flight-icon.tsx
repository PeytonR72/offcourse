export function FlightIcon({
  kind = "orbit",
  className = "",
}: {
  kind?: "orbit" | "arrow" | "sun" | "infinity" | "sound" | "motion";
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "orbit" && (
        <>
          <circle cx="12" cy="12" r="5" />
          <ellipse
            cx="12"
            cy="12"
            rx="11"
            ry="4"
            transform="rotate(-35 12 12)"
          />
          <path d="M18 2v3m-1.5-1.5h3" />
        </>
      )}
      {kind === "arrow" && <path d="M4 12h15m-6-6 6 6-6 6" />}
      {kind === "sun" && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </>
      )}
      {kind === "infinity" && (
        <path d="M12 12C8 5 2 6 2 12s6 7 10 0 10-6 10 0-6 7-10 0Z" />
      )}
      {kind === "sound" && (
        <>
          <path d="m11 4-5 4H2v8h4l5 4V4Z" />
          <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
        </>
      )}
      {kind === "motion" && (
        <path d="M3 8h10a4 4 0 1 0-4-4M3 12h15a4 4 0 1 1-4 4M3 16h5" />
      )}
    </svg>
  );
}
