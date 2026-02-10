import { AppResponse } from "@shared/schema";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppCard({ app }: { app: AppResponse }) {
  // Generate a mock rating between 4.0 and 5.0 based on app id
  const rating = (4 + (app.id % 10) / 10).toFixed(1);

  return (
    <Link href={`/app/${app.id}`} className="block h-full outline-none">
      <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="glass-card rounded-2xl p-4 h-full flex flex-col group cursor-pointer"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted border border-white/10 shadow-lg group-hover:shadow-primary/20 transition-all">
              {/* Using unspash source with specific keywords or the iconUrl if valid */}
              <img 
                src={app.iconUrl || `https://source.unsplash.com/random/100x100?app,icon,${app.category}`}
                alt={app.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${app.name}&background=random`;
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full text-xs font-medium text-yellow-400">
            <span>{rating}</span>
            <Star className="w-3 h-3 fill-yellow-400" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
            {app.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {app.shortDescription}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground px-2 py-1 rounded-md bg-muted/50 border border-white/5">
            {app.category}
          </span>
          <span className="text-xs font-semibold text-primary group-hover:underline decoration-primary underline-offset-4">
            View Details
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

export function AppCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-4 h-[200px] animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-16 h-16 rounded-2xl bg-muted/50"></div>
        <div className="w-12 h-6 rounded-full bg-muted/50"></div>
      </div>
      <div className="w-3/4 h-6 bg-muted/50 rounded mb-2"></div>
      <div className="w-full h-4 bg-muted/30 rounded mb-1"></div>
      <div className="w-2/3 h-4 bg-muted/30 rounded"></div>
    </div>
  );
}
