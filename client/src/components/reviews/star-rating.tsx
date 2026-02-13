import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
}

export function StarRating({
    rating,
    maxRating = 5,
    onRatingChange,
    readonly = false,
    size = "md"
}: StarRatingProps) {

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8"
    };

    return (
        <div className="flex gap-1">
            {Array.from({ length: maxRating }).map((_, index) => {
                const starValue = index + 1;
                const isFilled = starValue <= rating;

                return (
                    <button
                        key={index}
                        type="button"
                        className={cn(
                            "transition-transform focus:outline-none",
                            readonly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"
                        )}
                        onClick={() => !readonly && onRatingChange?.(starValue)}
                        disabled={readonly}
                    >
                        <Star
                            className={cn(
                                sizeClasses[size],
                                isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-600"
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}
