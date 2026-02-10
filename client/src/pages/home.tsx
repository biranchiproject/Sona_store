import { useState, useEffect } from "react";
import { useApps } from "@/hooks/use-apps";
import { AppCard, AppCardSkeleton } from "@/components/app-card";
import { APP_CATEGORIES } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function Home() {
  const [location] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  
  // Extract search from URL
  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery = searchParams.get("search") || undefined;

  const { data: apps, isLoading, error } = useApps({
    category: activeCategory === "All" ? undefined : activeCategory,
    search: searchQuery
  });

  // Filter out pending/rejected apps on the client side just in case,
  // although API should ideally handle this for public list.
  // Assuming API returns all for now, let's filter:
  const publishedApps = apps?.filter(app => app.status === "approved") || [];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      {!searchQuery && (
        <section className="relative rounded-3xl overflow-hidden min-h-[300px] md:h-[400px] flex items-center px-6 md:px-12 bg-gradient-to-r from-primary/20 via-background to-secondary/20 border border-white/10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10 max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-display font-bold mb-4 tracking-tight"
            >
              Discover the <span className="text-gradient">Next Gen</span> of PWAs
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground mb-8"
            >
              Experience the web like never before. Install powerful Progressive Web Apps directly to your device.
            </motion.p>
          </div>
        </section>
      )}

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <Button
          variant={activeCategory === "All" ? "default" : "outline"}
          onClick={() => setActiveCategory("All")}
          className={`rounded-full px-6 transition-all ${activeCategory === "All" ? "bg-primary text-black hover:bg-primary/90" : "border-white/10 hover:border-primary/50"}`}
        >
          All
        </Button>
        {APP_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-6 transition-all whitespace-nowrap ${activeCategory === cat ? "bg-primary text-black hover:bg-primary/90" : "border-white/10 hover:border-primary/50"}`}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* App Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-semibold">
            {searchQuery ? `Search results for "${searchQuery}"` : 
             activeCategory === "All" ? "Trending Apps" : `${activeCategory} Apps`}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <AppCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">
            Failed to load apps. Please try again later.
          </div>
        ) : publishedApps.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No apps found. Be the first to submit one!
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {publishedApps.map((app) => (
              <motion.div key={app.id} variants={item}>
                <AppCard app={app} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
