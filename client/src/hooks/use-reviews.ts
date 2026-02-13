import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { type InsertReview, type ReviewResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function useReviews(appId: string | undefined) {
    return useQuery({
        queryKey: ['reviews', appId],
        queryFn: async () => {
            if (!appId) return [];

            const { data, error } = await supabase
                .from('reviews')
                .select('*, user:users(name)')
                .eq('app_id', appId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map snake_case from Supabase to camelCase for frontend
            return (data || []).map((r: any) => ({
                ...r,
                appId: r.app_id,
                userId: r.user_id,
                createdAt: r.created_at,
            })) as ReviewResponse[];
        },
        enabled: !!appId,
    });
}

export function useAddReview() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (review: InsertReview) => {
            if (!user?.id) throw new Error("Must be logged in to review");

            const { data, error } = await supabase
                .from('reviews')
                .insert({
                    app_id: review.appId,
                    user_id: user.id,
                    rating: review.rating,
                    comment: review.comment
                })
                .select('*, user:users(name)')
                .single();

            if (error) {
                if (error.code === '23505') { // Unique violation
                    throw new Error("You have already reviewed this app.");
                }
                throw error;
            }

            // Map snake_case response to camelCase
            const result = data as any;
            return {
                ...result,
                appId: result.app_id,
                userId: result.user_id,
                createdAt: result.created_at,
            } as ReviewResponse;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['reviews', variables.appId] });
            toast({ title: "Review Submitted", description: "Thanks for your feedback!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Review Failed",
                description: error.message,
                variant: "destructive"
            });
        },
    });
}

export function useCanReview(appId: string | undefined) {
    const { user } = useAuth();
    const { data: reviews } = useReviews(appId);

    if (!user || !reviews) return false;
    return !reviews.some(r => r.userId === user.id);
}
