import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertApp, type AppResponse, APP_CATEGORIES } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Fetch all apps with optional filters
export function useApps(filters?: { category?: string; search?: string }) {
  // Construct query key based on filters to enable caching per filter combo
  const queryKey = [api.apps.list.path, filters?.category, filters?.search];

  return useQuery({
    queryKey,
    queryFn: async () => {
      let url = api.apps.list.path;
      const params = new URLSearchParams();
      if (filters?.category && filters.category !== "All") params.append("category", filters.category);
      if (filters?.search) params.append("search", filters.search);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch apps");
      return api.apps.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch single app
export function useApp(id: number) {
  return useQuery({
    queryKey: [api.apps.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.apps.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch app");
      return api.apps.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Fetch user's apps
export function useMyApps() {
  return useQuery({
    queryKey: [api.apps.myApps.path],
    queryFn: async () => {
      const res = await fetch(api.apps.myApps.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch my apps");
      return api.apps.myApps.responses[200].parse(await res.json());
    },
  });
}

// Fetch admin stats
export function useAdminStats() {
  return useQuery({
    queryKey: [api.admin.stats.path],
    queryFn: async () => {
      const res = await fetch(api.admin.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.admin.stats.responses[200].parse(await res.json());
    },
  });
}

// Create new app
export function useCreateApp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertApp) => {
      // Validate with schema first
      const validated = api.apps.create.input.parse(data);
      
      const res = await fetch(api.apps.create.path, {
        method: api.apps.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create app");
      }
      return api.apps.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.apps.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.apps.myApps.path] });
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
    mutationFn: async ({ id, status }: { id: number; status: "approved" | "rejected" | "pending" }) => {
      const url = buildUrl(api.apps.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.apps.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update status");
      return api.apps.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.apps.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
      toast({ title: "Status Updated" });
    },
  });
}
