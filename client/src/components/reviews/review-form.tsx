import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { StarRating } from "./star-rating";
import { useAddReview } from "@/hooks/use-reviews";
import { Loader2 } from "lucide-react";

// Local schema for validation
const reviewFormSchema = z.object({
    rating: z.number().min(1, "Please select a rating").max(5),
    comment: z.string().min(3, "Review must be at least 3 characters").max(500, "Review is too long"),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
    appId: string;
}

export function ReviewForm({ appId }: ReviewFormProps) {
    const { mutate: addReview, isPending } = useAddReview();
    const [rating, setRating] = useState(0);

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewFormSchema),
        defaultValues: {
            rating: 0,
            comment: "",
        },
    });

    const onSubmit = (values: ReviewFormValues) => {
        addReview({
            appId,
            userId: "", // Handled by hook
            rating: values.rating,
            comment: values.comment,
        }, {
            onSuccess: () => {
                form.reset();
                setRating(0);
            }
        });
    };

    const handleRatingChange = (value: number) => {
        setRating(value);
        form.setValue("rating", value, { shouldValidate: true });
    };

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800 space-y-4">
            <h3 className="text-lg font-semibold text-white">Write a Review</h3>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="rating"
                        render={() => (
                            <FormItem>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">Rating:</span>
                                    <StarRating rating={rating} onRatingChange={handleRatingChange} size="lg" />
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="comment"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea
                                        placeholder="Tell us what you think about this app..."
                                        className="bg-gray-950 border-gray-800 focus:border-green-500 resize-none"
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Post Review"
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
