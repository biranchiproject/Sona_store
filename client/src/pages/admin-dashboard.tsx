import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useApps, useUpdateAppStatus, useAdminStats } from "@/hooks/use-apps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Clock } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: apps, isLoading } = useApps(); // Gets all apps
  const { data: stats } = useAdminStats();
  const updateStatusMutation = useUpdateAppStatus();

  if (!user || user.role !== 'admin') {
    setLocation("/");
    return null;
  }

  // Filter pending apps first
  const pendingApps = apps?.filter(app => app.status === "pending") || [];
  const reviewedApps = apps?.filter(app => app.status !== "pending") || [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Apps</CardTitle>
            <div className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalApps || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{stats?.pendingApps || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <div className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Apps Table */}
      <div className="space-y-4">
        <h2 className="text-2xl font-display font-semibold">Pending Approval</h2>
        {isLoading ? (
          <div>Loading...</div>
        ) : pendingApps.length === 0 ? (
          <div className="glass p-8 text-center text-muted-foreground rounded-xl">
            No pending apps to review. Good job!
          </div>
        ) : (
          <div className="rounded-md border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-white/10">
                  <TableHead>App Name</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-card/50">
                {pendingApps.map((app) => (
                  <TableRow key={app.id} className="border-white/10">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <img src={app.iconUrl} alt="" className="w-8 h-8 rounded bg-muted" />
                        {app.name}
                      </div>
                    </TableCell>
                    <TableCell>{app.developer?.name || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/20">{app.category}</Badge>
                    </TableCell>
                    <TableCell>{new Date(app.createdAt!).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                         <Button 
                           size="sm" 
                           variant="outline"
                           className="text-green-400 hover:text-green-300 hover:bg-green-400/10 border-green-400/20"
                           onClick={() => updateStatusMutation.mutate({ id: app.id, status: "approved" })}
                           disabled={updateStatusMutation.isPending}
                         >
                           <Check className="h-4 w-4" />
                         </Button>
                         <Button 
                           size="sm" 
                           variant="outline"
                           className="text-red-400 hover:text-red-300 hover:bg-red-400/10 border-red-400/20"
                           onClick={() => updateStatusMutation.mutate({ id: app.id, status: "rejected" })}
                           disabled={updateStatusMutation.isPending}
                         >
                           <X className="h-4 w-4" />
                         </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

       {/* Reviewed Apps (Simplified view) */}
       <div className="space-y-4 pt-8">
         <h2 className="text-2xl font-display font-semibold text-muted-foreground">Recently Reviewed</h2>
         <div className="rounded-md border border-white/10 overflow-hidden opacity-75">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-white/10">
                  <TableHead>App Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Revert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-card/50">
                {reviewedApps.slice(0, 5).map((app) => (
                  <TableRow key={app.id} className="border-white/10">
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell>
                      <Badge variant={app.status === 'approved' ? 'default' : 'destructive'} className={app.status === 'approved' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : ''}>
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button 
                           size="sm" 
                           variant="ghost"
                           className="h-8 text-xs text-muted-foreground"
                           onClick={() => updateStatusMutation.mutate({ id: app.id, status: "pending" })}
                         >
                           Revert to Pending
                         </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
         </div>
       </div>
    </div>
  );
}
