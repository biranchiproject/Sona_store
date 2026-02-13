import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { type InsertApp, type App, type AppResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Helper to map Supabase snake_case to camelCase
const mapApp = (data: any): AppResponse => ({
  ...data,
  shortDescription: data.short_description,
  fullDescription: data.full_description,
  iconUrl: data.icon_url,
  // pwa_url and apk_url are already in data and match the type now
  fileSize: data.file_size,
  versionName: data.version_name,
  versionCode: data.version_code,
  developerId: data.developer_id,
  createdAt: data.created_at,
  screenshots: typeof data.screenshots === 'string' ? JSON.parse(data.screenshots) : data.screenshots,
  // Ensure developer relation is mapped if present
  developer: data.developer ? { name: data.developer.name } : undefined
});

// Fetch all apps with optional filters
export function useApps(filters?: { category?: string; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['apps', filters?.category, filters?.search, filters?.status],
    queryFn: async () => {
      let query = supabase
        .from('apps')
        .select('*, developer:users(name)');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      } else {
        query = query.eq('status', 'approved');
      }

      if (filters?.category && filters.category !== "All") {
        query = query.eq('category', filters.category);
      }
      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`name.ilike.${searchTerm},short_description.ilike.${searchTerm},full_description.ilike.${searchTerm},category.ilike.${searchTerm}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapApp);
    },
  });
}

// Fetch single app
export function useApp(id: string | number) {
  return useQuery({
    queryKey: ['app', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps')
        .select('*, developer:users(name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return mapApp(data);
    },
    enabled: !!id,
  });
}

// Fetch user's apps
export function useMyApps() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-apps', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .eq('developer_id', user.id);

      if (error) throw error;
      return (data || []).map(mapApp);
    },
    enabled: !!user?.id,
  });
}

// Fetch admin stats
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { count: totalApps, error: appsError } = await supabase
        .from('apps')
        .select('*', { count: 'exact', head: true });

      if (appsError) throw appsError;

      const { count: pendingApps, error: pendingError } = await supabase
        .from('apps')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      return {
        totalApps: totalApps || 0,
        pendingApps: pendingApps || 0,
        totalUsers: totalUsers || 0
      };
    },
  });
}

// Create new app
export function useCreateApp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<InsertApp, 'developerId' | 'id' | 'createdAt' | 'status'>) => {
      if (!user?.id) throw new Error("Must be logged in");

      // Map camelCase to snake_case for insertion
      const dbApp = {
        name: data.name,
        short_description: data.shortDescription,
        full_description: data.fullDescription,
        icon_url: data.iconUrl,
        pwa_url: data.pwa_url,
        category: data.category,
        screenshots: data.screenshots || [],  // ✅ Fix: Send array directly for Supabase
        status: user.role === 'admin' ? 'approved' : 'pending',
        developer_id: user.id,
        apk_url: data.apk_url,
        file_size: data.fileSize,
        version_name: data.versionName,
        version_code: data.versionCode
      };

      const { data: result, error } = await supabase
        .from('apps')
        .insert(dbApp)
        .select()
        .single();

      if (error) throw error;
      return mapApp(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['my-apps'] });
      toast({ title: "App Submitted", description: "Your app is pending approval." });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Update app status (Admin)
export function useUpdateAppStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string | number; status: "approved" | "rejected" | "pending" }) => {
      const { data, error } = await supabase
        .from('apps')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapApp(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({ title: "Status Updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}
