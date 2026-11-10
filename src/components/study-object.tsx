import type { StudyMode } from "@/lib/study/modes";

/** Oggetti illustrati, non controlli: l'azione e il nome appartengono al pulsante. */
export function StudyObject({ mode }: { mode: StudyMode }) {
  return (
    <svg
      className="study-object"
      viewBox="0 0 112 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {mode === "podcast" ? (
        <g className="object-headphones">
          <path
            d="M22 57V45a34 34 0 0 1 68 0v12"
            stroke="#b9c99b"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d="M22 54V45a34 34 0 0 1 68 0v9"
            stroke="#e2d6b6"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect
            x="9"
            y="46"
            width="24"
            height="40"
            rx="10"
            fill="#6d8b5b"
            stroke="#203e2c"
            strokeWidth="3"
          />
          <rect
            x="79"
            y="46"
            width="24"
            height="40"
            rx="10"
            fill="#6d8b5b"
            stroke="#203e2c"
            strokeWidth="3"
          />
          <path
            d="M20 57v17M92 57v17"
            stroke="#e6c481"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      ) : mode === "map" ? (
        <g className="object-board">
          <path
            d="m34 81-5 12M78 81l5 12"
            stroke="#ad8258"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect
            x="9"
            y="10"
            width="94"
            height="73"
            rx="5"
            fill="#ad8258"
            stroke="#223e2e"
            strokeWidth="3"
          />
          <rect x="16" y="17" width="80" height="57" rx="2" fill="#3e5c40" />
          <path
            d="m56 35-21 21M56 35l22 21"
            stroke="#cfdbb8"
            strokeWidth="2.5"
          />
          <rect x="44" y="25" width="24" height="14" rx="3" fill="#dce3be" />
          <rect x="22" y="51" width="24" height="14" rx="3" fill="#b8c99a" />
          <rect x="65" y="51" width="24" height="14" rx="3" fill="#e6c481" />
          <path
            d="M73 78h14"
            stroke="#efe2c4"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      ) : mode === "cards" ? (
        <g className="object-cards">
          <rect
            x="19"
            y="19"
            width="54"
            height="72"
            rx="6"
            fill="#b9c99b"
            stroke="#284b35"
            strokeWidth="3"
            transform="rotate(-16 46 55)"
          />
          <rect
            x="29"
            y="13"
            width="54"
            height="72"
            rx="6"
            fill="#cb956a"
            stroke="#284b35"
            strokeWidth="3"
          />
          <g className="object-front-card">
            <rect
              x="40"
              y="13"
              width="54"
              height="72"
              rx="6"
              fill="#efe3c5"
              stroke="#284b35"
              strokeWidth="3"
              transform="rotate(13 67 49)"
            />
            <path
              d="m55 35 26 5M53 46l26 5M51 57l16 3"
              stroke="#6f885c"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        </g>
      ) : (
        <g className="object-quiz">
          <rect
            x="25"
            y="16"
            width="60"
            height="76"
            rx="5"
            fill="#c5d0a3"
            stroke="#284b35"
            strokeWidth="3"
            transform="rotate(-9 55 54)"
          />
          <g className="object-front-paper">
            <rect
              x="27"
              y="10"
              width="60"
              height="76"
              rx="5"
              fill="#f0e5c9"
              stroke="#284b35"
              strokeWidth="3"
              transform="rotate(5 57 48)"
            />
            <rect
              x="43"
              y="6"
              width="28"
              height="13"
              rx="4"
              fill="#bd8157"
              stroke="#284b35"
              strokeWidth="2.5"
            />
            <path
              d="m40 34 3 3 5-7M54 34h19m-33 15 3 3 5-7M54 49h19M40 64h8m6 0h19"
              stroke="#6b8057"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          {mode === "exam" && (
            <g>
              <circle
                cx="84"
                cy="75"
                r="20"
                fill="#e6c481"
                stroke="#284b35"
                strokeWidth="3"
              />
              <path
                d="M84 62v13l9 6"
                stroke="#284b35"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
