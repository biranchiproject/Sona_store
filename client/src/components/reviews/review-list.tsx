import { useReviews } from "@/hooks/use-reviews";
import { StarRating } from "./star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ReviewResponse } from "@shared/schema";

interface ReviewListProps {
    appId: string;
}

export function ReviewList({ appId }: ReviewListProps) {
    const { data: reviews, isLoading } = useReviews(appId);

    if (isLoading) {
        return <div className="text-gray-400 py-4">Loading reviews...</div>;
    }

    if (!reviews || reviews.length === 0) {
        return <div className="text-gray-500 italic py-4">No reviews yet. Be the first to review!</div>;
    }

    // Calculate stats
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-white">{averageRating.toFixed(1)}</span>
                        <div className="flex flex-col">
                            <StarRating rating={Math.round(averageRating)} readonly size="sm" />
                            <span className="text-xs text-gray-400">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {reviews.map((review: ReviewResponse) => (
                    <div key={review.id} className="bg-gray-900/30 p-4 rounded-lg border border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user?.name || 'User'}`} />
                                    <AvatarFallback>{review.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white">{review.user?.name || 'Anonymous User'}</span>
                                    <span className="text-xs text-gray-500">
                                        {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : 'Recently'}
                                    </span>
                                </div>
                            </div>
                            <StarRating rating={review.rating} readonly size="sm" />
                        </div>
                        <p className="text-gray-300 text-sm">{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
