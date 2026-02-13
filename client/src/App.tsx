import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/home";
import AppDetails from "@/pages/app-details";
import AuthPage from "@/pages/auth-page";
import SubmitApp from "@/pages/submit-app";
import AdminDashboard from "@/pages/admin-dashboard";
import Profile from "@/pages/profile";
import ConsolePage from "@/pages/console-page";
import DeveloperDashboard from "@/pages/developer-dashboard";

function Router() {
  return (
    <Switch>
      {/* Admin Console (Separate Layout) */}
      <Route path="/console" component={ConsolePage} />

      {/* Standard Layout Routes */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/app/:id" component={AppDetails} />
            <Route path="/submit" component={SubmitApp} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/developer" component={DeveloperDashboard} />
            <Route path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
