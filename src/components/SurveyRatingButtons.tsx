import { cn } from '@/lib/utils';

interface SurveyRatingButtonsProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function SurveyRatingButtons({ value, onChange, disabled }: SurveyRatingButtonsProps) {
  const ratings = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-2">
      {ratings.map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={disabled}
          onClick={() => onChange(rating)}
          className={cn(
            "w-10 h-10 rounded-lg border-2 font-semibold text-sm transition-all",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            value === rating
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-background border-border hover:border-primary/50 hover:bg-accent text-foreground"
          )}
        >
          {rating}
        </button>
      ))}
    </div>
  );
}
