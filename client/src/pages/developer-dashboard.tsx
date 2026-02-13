
import { useAuth } from "@/hooks/use-auth";
import { useMyApps } from "@/hooks/use-apps";
import { Link, useLocation } from "wouter";
import { PlusCircle, Loader2, LayoutGrid, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function DeveloperDashboard() {
    const { user } = useAuth();
    const [location, setLocation] = useLocation();
    const { data: myApps, isLoading } = useMyApps();

    if (!user) {
        setLocation("/auth");
        return null;
    }

    if (user.role !== 'admin') {
        setLocation("/");
        return null;
    }

    const pendingApps = myApps?.filter(app => app.status === 'pending') || [];
    const publishedApps = myApps?.filter(app => app.status === 'approved') || [];
    const rejectedApps = myApps?.filter(app => app.status === 'rejected') || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold">Developer Dashboard</h1>
                    <p className="text-muted-foreground">Manage your apps and view performance</p>
                </div>
                <Button onClick={() => setLocation("/submit?mode=pwa")} className="bg-primary text-black hover:bg-primary/90">
                    <PlusCircle className="mr-2 h-4 w-4" /> UPLOAD PWA
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Total Apps"
                    value={myApps?.length || 0}
                    icon={<LayoutGrid className="h-4 w-4 text-primary" />}
                />
                <StatsCard
                    title="Live Apps"
                    value={publishedApps.length}
                    icon={<BarChart3 className="h-4 w-4 text-green-500" />}
                />
                <StatsCard
                    title="Pending Review"
                    value={pendingApps.length}
                    icon={<Loader2 className="h-4 w-4 text-yellow-500" />}
                />
            </div>

            {/* Apps Manager */}
            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-black/20 border border-white/10">
                        <TabsTrigger value="all">All Apps</TabsTrigger>
                        <TabsTrigger value="live">Live</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all" className="space-y-4">
                    <AppGrid apps={myApps} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="live" className="space-y-4">
                    <AppGrid apps={publishedApps} isLoading={isLoading} emptyMessage="No live apps yet." />
                </TabsContent>
                <TabsContent value="pending" className="space-y-4">
                    <AppGrid apps={pendingApps} isLoading={isLoading} emptyMessage="No pending apps." />
                </TabsContent>
            </Tabs>

        </div>
    );
}

function StatsCard({ title, value, icon }: { title: string, value: number, icon: any }) {
    return (
        <Card className="glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

function AppGrid({ apps, isLoading, emptyMessage = "You haven't submitted any apps yet." }: { apps: any[] | undefined, isLoading: boolean, emptyMessage?: string }) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
                ))}
            </div>
        );
    }

    if (!apps || apps.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                <div className="text-muted-foreground mb-4">{emptyMessage}</div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
                <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Link href={`/app/${app.id}`}>
                        <Card className="glass border-white/10 h-full hover:border-primary/50 transition-colors cursor-pointer relative z-10">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-white/10">
                                    <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <CardTitle className="text-lg truncate">{app.name}</CardTitle>
                                    <CardDescription className="truncate">{app.category}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mt-2">
                                    <Badge variant={
                                        app.status === 'approved' ? 'default' :
                                            app.status === 'rejected' ? 'destructive' : 'secondary'
                                    }>
                                        {app.status === 'approved' ? 'Live' : app.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(app.createdAt || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>
            ))}
        </div>
    );
}
