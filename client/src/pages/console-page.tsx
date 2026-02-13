
import { useAuth } from "@/hooks/use-auth";
import { useApps, useAdminStats, useUpdateAppStatus } from "@/hooks/use-apps";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, AppWindow, Users, Settings, LogOut, Search, Menu, X, Check, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";

export default function ConsolePage() {
    const { user, logout } = useAuth();
    const [location, setLocation] = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Protect Route
    if (!user || user.role !== 'admin') {
        setLocation("/");
        return null;
    }

    // Data Fetching
    const { data: stats } = useAdminStats();
    const { data: pendingApps, isLoading: isLoadingApps } = useApps({ status: 'pending' });
    const { mutate: updateStatus } = useUpdateAppStatus();

    return (
        <div className="min-h-screen bg-[#0B0F14] text-white flex font-sans selection:bg-cyan-500/30">

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#11161D] border-r border-white/5 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } md:translate-x-0`}
            >
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <div className="font-display font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        Admin Console
                    </div>
                </div>

                <nav className="p-4 space-y-1">
                    <NavItem icon={<LayoutDashboard />} label="Dashboard" active />
                    <NavItem icon={<AppWindow />} label="All Apps" />
                    <NavItem icon={<Users />} label="Users" />
                    <NavItem icon={<Settings />} label="Settings" />
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-white/10">
                                <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                                    {user.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                                <div className="font-medium truncate">{user.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        onClick={() => logout()}
                    >
                        <LogOut className="mr-2 h-4 w-4" /> Log Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : ""}`}>

                {/* Header */}
                <header className="h-16 bg-[#0B0F14]/80 backdrop-blur sticky top-0 z-40 border-b border-white/5 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <h1 className="text-lg font-semibold text-muted-foreground">Overview</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search database..."
                                className="bg-[#11161D] border-white/10 pl-10 focus-visible:ring-cyan-500/50"
                            />
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-6 space-y-8">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title="Total Apps"
                            value={stats?.totalApps || 0}
                            icon={<AppWindow className="h-5 w-5 text-cyan-400" />}
                            trend="+12% from last month"
                        />
                        <StatCard
                            title="Pending Reviews"
                            value={stats?.pendingApps || 0}
                            icon={<Check className="h-5 w-5 text-yellow-400" />}
                            trend="Requires attention"
                        />
                        <StatCard
                            title="Total Users"
                            value={stats?.totalUsers || 0}
                            icon={<Users className="h-5 w-5 text-purple-400" />}
                            trend="+5 new today"
                        />
                    </div>

                    {/* Pending Apps Table */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-display font-semibold">Pending Approvals</h2>

                        <div className="rounded-xl border border-white/5 bg-[#11161D] overflow-hidden">
                            <Table>
                                <TableHeader className="bg-white/5">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-muted-foreground">App Info</TableHead>
                                        <TableHead className="text-muted-foreground">Developer</TableHead>
                                        <TableHead className="text-muted-foreground">Submitted</TableHead>
                                        <TableHead className="text-muted-foreground">Status</TableHead>
                                        <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingApps ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">Loading requests...</TableCell>
                                        </TableRow>
                                    ) : pendingApps?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No pending apps to review.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pendingApps?.map((app) => (
                                            <TableRow key={app.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-white/5 overflow-hidden">
                                                            <img src={app.iconUrl} alt={app.name} className="h-full w-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{app.name}</div>
                                                            <div className="text-xs text-muted-foreground">{app.category}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{app.developer?.name || 'Unknown'}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(app.createdAt || Date.now()).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                                        {app.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            asChild
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Link href={`/app/${app.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20"
                                                            onClick={() => updateStatus({ id: app.id, status: 'approved' })}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 text-red-400 hover:bg-red-400/10"
                                                            onClick={() => updateStatus({ id: app.id, status: 'rejected' })}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
    return (
        <div className={`
      flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all
      ${active ? 'bg-cyan-500/10 text-cyan-400' : 'text-muted-foreground hover:text-white hover:bg-white/5'}
    `}>
            {icon}
            <span className="font-medium text-sm">{label}</span>
        </div>
    );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string | number, icon: any, trend: string }) {
    return (
        <div className="p-6 rounded-2xl bg-[#11161D] border border-white/5 flex flex-col gap-4 hover:border-cyan-500/20 transition-colors group">
            <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-cyan-500/10 transition-colors">
                    {icon}
                </div>
                <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">{trend}</span>
            </div>
            <div>
                <div className="text-2xl font-bold font-display">{value}</div>
                <div className="text-sm text-muted-foreground">{title}</div>
            </div>
        </div>
    );
}
