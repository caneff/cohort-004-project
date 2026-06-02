import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "~/lib/utils";

const STARS = [0, 1, 2, 3, 4];

// ─── Read-only display ───
// Renders 5 stars filled to the nearest half-star, plus the numeric average
// and review count. Callers should not render this when there are no reviews.
export function StarRatingDisplay({
  average,
  count,
  className,
  starClassName,
}: {
  average: number;
  count: number;
  className?: string;
  starClassName?: string;
}) {
  // Round to the nearest half so the clipped overlay lands on a star or its
  // midpoint. Stars are rendered gap-free so width% maps cleanly to value/5.
  const rounded = Math.round(average * 2) / 2;
  const widthPct = (rounded / 5) * 100;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-muted-foreground",
        className
      )}
    >
      <span
        className="relative inline-flex"
        role="img"
        aria-label={`Rated ${average.toFixed(1)} out of 5`}
      >
        <span className="flex text-muted-foreground/40">
          {STARS.map((i) => (
            <Star key={i} className={cn("size-4", starClassName)} />
          ))}
        </span>
        <span
          className="absolute inset-0 flex overflow-hidden text-yellow-500"
          style={{ width: `${widthPct}%` }}
        >
          {STARS.map((i) => (
            <Star
              key={i}
              className={cn("size-4 shrink-0 fill-current", starClassName)}
            />
          ))}
        </span>
      </span>
      <span className="font-medium text-foreground">{average.toFixed(1)}</span>
      <span>
        ({count} {count === 1 ? "rating" : "ratings"})
      </span>
    </span>
  );
}

// ─── Interactive input ───
// Whole-star (1–5) picker with hover preview. Stateless beyond hover —
// the current value and submission are owned by the parent.
export function StarRatingInput({
  value,
  onSelect,
  disabled,
  className,
}: {
  value: number;
  onSelect: (rating: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
          onMouseEnter={() => setHovered(star)}
          onFocus={() => setHovered(star)}
          onClick={() => onSelect(star)}
          className="rounded outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Star
            className={cn(
              "size-7 transition-colors",
              star <= active
                ? "fill-yellow-500 text-yellow-500"
                : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}
