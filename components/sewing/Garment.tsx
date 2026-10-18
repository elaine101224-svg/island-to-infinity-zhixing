import type { Garment as Kind } from "@/lib/sewing/types";
export const garmentPath = (kind: Kind) =>
  kind === "tshirt" || kind === "jersey"
    ? "M 145 100 L 90 120 L 38 205 L 100 240 L 125 204 L 125 445 Q 250 465 375 445 L 375 204 L 400 240 L 462 205 L 410 120 L 355 100 Q 250 155 145 100 Z"
    : "M 175 100 L 120 130 L 75 190 L 30 340 L 95 365 L 145 240 L 140 445 Q 250 467 360 445 L 355 240 L 405 365 L 470 340 L 425 190 L 380 130 L 325 100 Q 250 140 175 100 Z";
export default function Garment({
  kind,
  color,
  side,
}: {
  kind: Kind;
  color: string;
  side: "front" | "back";
}) {
  const hoodie = kind === "hoodie" || kind === "zip";
  return (
    <g>
      <path
        d={garmentPath(kind)}
        fill={color}
        stroke="#655e52"
        strokeWidth="2"
      />
      <path
        d="M145 433 Q250 451 360 433"
        fill="none"
        stroke="#514e44"
        opacity=".25"
        strokeDasharray="4 4"
      />
      {hoodie ? (
        <>
          <path
            d={
              side === "front"
                ? "M175 100 Q170 28 250 35 Q330 28 325 100 Q250 158 175 100"
                : "M175 100 Q175 30 250 35 Q325 30 325 100 Q310 185 250 190 Q190 185 175 100"
            }
            fill={color}
            stroke="#655e52"
            strokeWidth="2"
          />
          {side === "front" && kind === "hoodie" && (
            <path
              d="M193 345 L168 393 Q250 414 332 393 L307 345 Z M210 127 L205 218 M290 127 L295 218"
              fill="none"
              stroke="#655e52"
              opacity=".5"
            />
          )}
          {side === "front" && kind === "zip" && (
            <path
              d="M250 133 L250 453"
              stroke="#655e52"
              strokeWidth="4"
              strokeDasharray="2 2"
            />
          )}
        </>
      ) : (
        <path
          d={
            kind === "jersey" && side === "front"
              ? "M190 118 L250 165 L310 118"
              : "M190 118 Q250 166 310 118"
          }
          fill="none"
          stroke="#655e52"
          strokeWidth="8"
          opacity=".5"
        />
      )}
      <path
        d="M126 207 L143 244 M374 207 L356 244"
        stroke="#655e52"
        fill="none"
        opacity=".3"
      />
    </g>
  );
}
