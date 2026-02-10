import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Menu, 
  X, 
  Search, 
  User as UserIcon, 
  LayoutGrid, 
  Shield, 
  LogOut, 
  PlusCircle,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/?search=${encodeURIComponent(search)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-black">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] bg-card border-r-border">
              <div className="flex flex-col gap-4 py-4">
                <Link href="/" className="flex items-center gap-2 px-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <ShoppingBag className="text-white h-5 w-5" />
                  </div>
                  <span className="font-display font-bold text-xl">Sona's Store</span>
                </Link>
                <div className="flex flex-col gap-1">
                  <Link href="/" className="px-2 py-2 text-lg hover:text-primary transition-colors">Home</Link>
                  <Link href="/profile" className="px-2 py-2 text-lg hover:text-primary transition-colors">Profile</Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin" className="px-2 py-2 text-lg hover:text-primary transition-colors">Admin</Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="mr-6 hidden md:flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(0,243,255,0.5)] transition-shadow duration-300">
              <ShoppingBag className="text-white h-5 w-5" />
            </div>
            <span className="hidden font-bold sm:inline-block font-display text-xl tracking-tight group-hover:text-primary transition-colors">
              Sona's Store
            </span>
          </Link>

          <div className="flex flex-1 items-center justify-center md:justify-end px-2 md:px-0">
            <form onSubmit={handleSearch} className="w-full max-w-sm relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search apps..."
                className="w-full pl-9 bg-muted/40 border-border/50 focus-visible:ring-primary rounded-full transition-all focus-visible:w-full focus-visible:bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          </div>

          <nav className="flex items-center gap-2 ml-4">
            {user ? (
              <>
                <Button variant="ghost" size="icon" asChild className="hidden md:flex text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <Link href="/submit">
                    <PlusCircle className="h-5 w-5" />
                    <span className="sr-only">Submit App</span>
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2 ring-2 ring-transparent hover:ring-primary/50 transition-all">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-card border-border/50" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/submit" className="cursor-pointer">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>Submit App</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4 text-secondary" />
                          <span className="text-secondary font-medium">Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="text-red-400 cursor-pointer focus:text-red-400 focus:bg-red-400/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild className="rounded-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                <Link href="/auth">Sign In</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-6 md:py-10 px-4 md:px-6 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50 pointer-events-none"></div>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 md:px-6">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for the future. Sona's Store © 2024
          </p>
        </div>
      </footer>
    </div>
  );
}
