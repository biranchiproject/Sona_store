import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useMyApps } from "@/hooks/use-apps";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Settings } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: myApps, isLoading } = useMyApps();

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <Card className="glass border-white/10 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-background to-secondary/20" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 px-4">
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
              <AvatarFallback className="bg-primary text-black text-3xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left mb-2 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-display font-bold">{user.name}</h1>
              <p className="text-muted-foreground text-sm md:text-base">{user.email}</p>
            </div>
            <div className="flex gap-2 mb-2">
              <Button variant="outline" className="border-white/10" onClick={() => logout()}>
                Log Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Apps Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold">My Apps</h2>
          {user.role === 'admin' && (
            <Button asChild className="bg-primary text-black hover:bg-primary/90">
              <Link href="/submit">
                <PlusCircle className="mr-2 h-4 w-4" /> New App
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div>Loading apps...</div>
        ) : !myApps || myApps.length === 0 ? (
          <div className="glass p-12 text-center rounded-xl border-dashed border-2 border-white/10">
            <h3 className="text-xl font-medium mb-2">No apps yet</h3>
            <p className="text-muted-foreground mb-4">You haven't submitted any apps to the store.</p>
            {user.role === 'admin' && (
              <Button asChild variant="secondary">
                <Link href="/submit">Submit your first app</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {myApps.map((app) => (
              <div key={app.id} className="flex items-center gap-4 p-4 rounded-xl glass hover:bg-white/5 transition-colors">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                  <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{app.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={
                      app.status === 'approved' ? 'default' :
                        app.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {app.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{new Date(app.createdAt!).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/app/${app.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
