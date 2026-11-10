import type { StudyMode } from "@/lib/study/modes";
export type MascotPose = "welcome" | "menu" | StudyMode;

/** Personaggio vettoriale articolato: i gruppi sono animati dal CSS della scena. */
export function AnimatedMascot({
  pose = "welcome",
  arriving = false,
  className = "",
}: {
  pose?: MascotPose;
  arriving?: boolean;
  className?: string;
}) {
  return (
    <span
      className={
        "animated-mascot " + (arriving ? "is-arriving " : "") + className
      }
      data-pose={pose}
      aria-hidden="true"
    >
      <svg viewBox="0 0 320 330" fill="none" focusable="false">
        <ellipse
          className="mascot-shadow"
          cx="162"
          cy="306"
          rx="102"
          ry="9"
          fill="#141c14"
          opacity=".22"
        />
        {(pose === "menu" || pose === "welcome") && (
          <g className="mascot-bag" transform="translate(22 178)">
            <path
              d="M22 8V-2q0-12 17-12T56-2V8"
              stroke="#b3c397"
              strokeWidth="5"
            />
            <rect
              x="0"
              y="4"
              width="85"
              height="100"
              rx="18"
              fill="#45604a"
              stroke="#182e22"
              strokeWidth="3"
            />
            <path
              d="M3 24q40-18 79 0"
              stroke="#162b20"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <rect
              x="14"
              y="53"
              width="57"
              height="37"
              rx="8"
              fill="#5d7758"
              stroke="#203d2b"
              strokeWidth="2"
            />
            <path d="M24 70h36" stroke="#b5c6a0" strokeWidth="2" />
            <g className="mascot-bag-flap">
              <path
                d="M0 22Q0 1 21 1h43q21 0 21 21v9Q44 55 0 31Z"
                fill="#a87951"
                stroke="#263c28"
                strokeWidth="3"
              />
              <rect
                x="36"
                y="21"
                width="13"
                height="22"
                rx="3"
                fill="#e6c481"
                stroke="#624c32"
                strokeWidth="2"
              />
            </g>
          </g>
        )}
        {pose === "menu" && (
          <g className="mascot-flying-note" transform="translate(34 177)">
            <rect
              x="0"
              y="0"
              width="38"
              height="48"
              rx="4"
              fill="#efe3c8"
              stroke="#77916c"
              strokeWidth="2"
            />
            <path
              d="M9 14h20M9 24h20M9 34h13"
              stroke="#66815b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}
        {pose === "menu" && (
          <g className="mascot-unpacked-books">
            {[0, 1, 2].map((index) => (
              <g key={index} className={"mascot-bag-book bag-book-" + index}>
                <rect
                  x="31"
                  y="166"
                  width="36"
                  height="49"
                  rx="4"
                  fill={["#e6c481", "#b9c99b", "#cb956a"][index]}
                  stroke="#294b36"
                  strokeWidth="2"
                />
                <path
                  d="M38 171v39M45 180h14M45 188h14"
                  stroke="#45604a"
                  strokeWidth="2"
                />
              </g>
            ))}
          </g>
        )}
        <g className="mascot-walker">
          <g transform="translate(132 225)">
            <g className="mascot-leg mascot-leg-left">
              <path
                d="M0 0q4 27-5 52"
                stroke="#294b36"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M-9 48q-7 2-10 15l-2 8q8 10 34 2l-1-14-9-11Z"
                fill="#bf754e"
                stroke="#294b36"
                strokeWidth="3"
              />
              <path
                d="M-20 69q16 10 33 0M-9 57l10 1M-11 62l11 1"
                stroke="#f1e1bc"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          </g>
          <g transform="translate(183 221)">
            <g className="mascot-leg mascot-leg-right">
              <path
                d="M0 0q13 24 11 54"
                stroke="#294b36"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M6 49q9-3 16 4l12 11q2 9-15 13L6 73 2 60Z"
                fill="#bf754e"
                stroke="#294b36"
                strokeWidth="3"
              />
              <path
                d="M7 71q16 8 27-4M11 57l9-3M14 62l10-3"
                stroke="#f1e1bc"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          </g>
          <g className="mascot-torso">
            <g transform="translate(104 140)">
              <g className="mascot-arm mascot-arm-left">
                <path
                  d="M0 0q-31 7-23 34l7 13"
                  stroke="#294b36"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="m-19 42 6 8q2 7 9 3l-2-7q-5-10-10-7Z"
                  fill="#efe2c4"
                  stroke="#294b36"
                  strokeWidth="3"
                />
              </g>
            </g>
            <path
              d="m94 57 99-17 36 187-124 17-38-25Z"
              fill="#e8d6af"
              stroke="#294b36"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="m94 57 99-17 36 187-124 17-8-68Z"
              fill="#f2e6ca"
              stroke="#294b36"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="m94 57 3 119-30 43M97 176l132 51"
              stroke="#c9b88c"
              strokeWidth="2"
            />
            <path d="m97 176 8 68 124-17Z" fill="#e6d3a8" opacity=".48" />
            <path
              d="m108 67 73-13"
              stroke="#fff9e9"
              strokeWidth="3"
              opacity=".6"
              strokeLinecap="round"
            />
            <g className="mascot-face">
              <g className="mascot-eyes">
                <ellipse cx="137" cy="120" rx="4.4" ry="5.4" fill="#294b36" />
                <ellipse cx="178" cy="113" rx="4.4" ry="5.4" fill="#294b36" />
              </g>
              <g className="mascot-happy-eyes">
                <path
                  d="M131 120q7-10 14-1M171 113q7-10 14-1"
                  stroke="#294b36"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
              <path
                className="mascot-smile"
                d="M146 140q14 16 29-4"
                stroke="#294b36"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <g className="mascot-cheeks" fill="#d7a087" opacity=".45">
                <ellipse cx="125" cy="138" rx="8" ry="4" />
                <ellipse cx="191" cy="128" rx="8" ry="4" />
              </g>
            </g>
            {(pose === "map" || pose === "exam") && (
              <g className="mascot-glasses">
                <circle
                  cx="137"
                  cy="120"
                  r="16"
                  stroke="#294b36"
                  strokeWidth="4"
                />
                <circle
                  cx="178"
                  cy="113"
                  r="16"
                  stroke="#294b36"
                  strokeWidth="4"
                />
                <path
                  d="m153 117 9-1M121 122l-15 2M194 110l14-2"
                  stroke="#294b36"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            )}
            {pose === "podcast" && (
              <g className="mascot-headphones">
                <path
                  d="M96 119Q77 55 130 39q68-25 81 61"
                  stroke="#233f2e"
                  strokeWidth="17"
                  strokeLinecap="round"
                />
                <path
                  d="M96 119Q77 55 130 39q68-25 81 61"
                  stroke="#627f56"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <rect
                  x="84"
                  y="101"
                  width="25"
                  height="45"
                  rx="12"
                  fill="#3c5c40"
                  stroke="#294b36"
                  strokeWidth="3"
                  transform="rotate(-8 96 123)"
                />
                <rect
                  x="200"
                  y="84"
                  width="25"
                  height="45"
                  rx="12"
                  fill="#3c5c40"
                  stroke="#294b36"
                  strokeWidth="3"
                  transform="rotate(-10 212 106)"
                />
                <path
                  d="m93 115 2 16M209 96l3 16"
                  stroke="#e6c481"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </g>
            )}
            {pose === "exam" && (
              <g className="mascot-held-paper">
                <rect
                  x="67"
                  y="164"
                  width="58"
                  height="75"
                  rx="6"
                  fill="#e9d5a8"
                  stroke="#294b36"
                  strokeWidth="3"
                  transform="rotate(-10 96 201)"
                />
                <rect
                  x="72"
                  y="156"
                  width="52"
                  height="72"
                  rx="4"
                  fill="#f9eed6"
                  stroke="#294b36"
                  strokeWidth="2.5"
                  transform="rotate(5 98 192)"
                />
                <path
                  d="M85 177h23M85 190h23M85 204h15"
                  stroke="#8d9a76"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <rect
                  x="86"
                  y="153"
                  width="23"
                  height="9"
                  rx="3"
                  fill="#bf754e"
                  stroke="#294b36"
                  strokeWidth="2"
                />
                {pose === "exam" && (
                  <g>
                    <circle
                      cx="118"
                      cy="219"
                      r="19"
                      fill="#e6c481"
                      stroke="#294b36"
                      strokeWidth="3"
                    />
                    <path
                      d="M118 207v12l8 5"
                      stroke="#294b36"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </g>
            )}
            {pose === "quiz" && (
              <g className="mascot-open-book">
                <g className="mascot-book-left">
                  <path
                    d="m64 166 39 5v63l-39-5Z"
                    fill="#b9c99b"
                    stroke="#294b36"
                    strokeWidth="3"
                  />
                  <path d="m70 172 32 4v51l-32-4Z" fill="#f2e6ca" />
                  <path
                    d="m76 186 21 3m-21 8 21 3m-21 8 21 3"
                    stroke="#7b8d68"
                    strokeWidth="2"
                  />
                </g>
                <path
                  d="m103 171 41-8v64l-41 7Z"
                  fill="#efe2c4"
                  stroke="#294b36"
                  strokeWidth="3"
                />
                <path
                  d="m111 183 24-5m-24 17 24-5m-24 17 24-5"
                  stroke="#7b8d68"
                  strokeWidth="2"
                />
              </g>
            )}
            {pose === "exam" && (
              <path
                className="mascot-professor-tie"
                d="m151 164 7 7-3 24-8-4-1-21Z"
                fill="#bf754e"
                stroke="#294b36"
                strokeWidth="2"
              />
            )}
            {pose === "map" && (
              <g className="mascot-drafting-tools">
                <path
                  d="m68 230 12-70 48 53Z"
                  fill="#e6c481"
                  stroke="#294b36"
                  strokeWidth="3"
                />
                <path d="m80 213 5-28 20 21Z" fill="#405a3c" />
                <path
                  d="m79 173 4 3m-7 8 4 3m-6 8 4 3m-6 9 4 2"
                  stroke="#627a52"
                  strokeWidth="2"
                />
              </g>
            )}
            {pose === "cards" && (
              <g className="mascot-held-cards">
                <rect
                  x="65"
                  y="160"
                  width="53"
                  height="70"
                  rx="6"
                  fill="#b9c99b"
                  stroke="#294b36"
                  strokeWidth="2.5"
                  transform="rotate(-14 91 195)"
                />
                <rect
                  x="73"
                  y="156"
                  width="53"
                  height="70"
                  rx="6"
                  fill="#e6c481"
                  stroke="#294b36"
                  strokeWidth="2.5"
                  transform="rotate(5 99 191)"
                />
                <rect
                  x="82"
                  y="156"
                  width="53"
                  height="70"
                  rx="6"
                  fill="#f2e6ca"
                  stroke="#294b36"
                  strokeWidth="2.5"
                  transform="rotate(17 108 191)"
                />
                <path
                  d="M96 176h21M97 187h21M99 198h13"
                  stroke="#77916c"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            )}
            <g transform="translate(213 137)">
              <g className="mascot-arm mascot-arm-right">
                <path
                  d="M0 0q21-7 33 1l19 1"
                  stroke="#294b36"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="M48-3q7-7 10 0l5 1q6 5-1 9l-11-1q-7 0-3-9Z"
                  fill="#efe2c4"
                  stroke="#294b36"
                  strokeWidth="3"
                />
                {pose === "map" && (
                  <path
                    d="m43 42 30-99"
                    stroke="#a87951"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                )}
              </g>
            </g>
          </g>
        </g>
        {pose === "welcome" && (
          <g
            className="mascot-hello-rays"
            stroke="#e4b18f"
            strokeWidth="4"
            strokeLinecap="round"
          >
            <path d="m245 51 8-15M261 64l16-8M268 80l16 1" />
          </g>
        )}
      </svg>
    </span>
  );
}
