import { useParams } from "wouter";
import { useApp } from "@/hooks/use-apps";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle, Info } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { ShareModal } from "@/components/share-modal";

export default function AppDetails() {
  const { id } = useParams();
  const { data: app, isLoading, error } = useApp(id || "");
  const { toast } = useToast();
  const { user } = useAuth();
  const [installState, setInstallState] = useState<"idle" | "installing" | "installed">("idle");

  if (isLoading) return <DetailsSkeleton />;
  if (error || !app) return <div className="p-8 text-center text-red-400">App not found</div>;

  const handleInstall = () => {
    setInstallState("installing");

    // Simulate install delay
    setTimeout(() => {
      setInstallState("installed");
      toast({
        title: "Download Started",
        description: `${app.name} is downloading...`,
      });

      // Trigger download
      const downloadUrl = (app.apk_url || app.pwa_url);
      if (!downloadUrl) {
        toast({
          title: "Download Failed",
          description: "No download URL found for this app.",
          variant: "destructive",
        });
        return;
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = app.apk_url ? `${app.name}.apk` : 'app';
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Store
      </Link>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden bg-muted border-2 border-white/10 shadow-2xl shrink-0 neon-shadow">
          <img
            src={app.iconUrl}
            alt={app.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${app.name}&background=random`;
            }}
          />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">{app.name}</h1>
            {/* Developer name updated */}
            <p className="text-lg text-primary font-medium">Biranchi Creativity</p>
            <div className="flex gap-2 mt-2 text-sm text-muted-foreground">
              <span className="bg-white/5 px-2 py-1 rounded border border-white/5">{app.category}</span>
              <span className="bg-white/5 px-2 py-1 rounded border border-white/5">v{app.versionName || "1.0.0"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Button
              size="lg"
              className={`w-full md:w-auto min-w-[160px] rounded-full text-lg font-bold shadow-lg transition-all ${installState === "installed"
                ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/25"
                : "bg-primary text-black hover:bg-primary/90 hover:scale-105 shadow-primary/25"
                }`}
              onClick={handleInstall}
              disabled={installState === "installing" || installState === "installed"}
            >
              {installState === "idle" && (
                <>
                  GET APP
                </>
              )}
              {installState === "installing" && "Installing..."}
              {installState === "installed" && (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" /> OPEN
                </>
              )}
            </Button>


            <ShareModal appName={app.name} appDescription={app.shortDescription} />
          </div>
        </div>
      </div>

      {/* Screenshots */}
      <div className="space-y-4">
        <h2 className="text-2xl font-display font-semibold">Preview</h2>
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x">
          {app.screenshots && app.screenshots.length > 0 ? (
            app.screenshots.map((shot, idx) => (
              <div key={idx} className="shrink-0 w-[280px] md:w-[350px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 bg-muted/20 snap-center">
                <img src={shot} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))
          ) : (
            // Fallback generic screenshots
            [1, 2, 3].map((i) => (
              <div key={i} className="shrink-0 w-[280px] md:w-[350px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 bg-muted/20 snap-center relative">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <span className="text-sm">No Preview Available</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Description */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-2xl font-display font-semibold">About this app</h2>
          <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
            <p className="whitespace-pre-wrap">{app.fullDescription}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="font-semibold text-lg flex items-center">
              <Info className="w-5 h-5 mr-2 text-primary" /> App Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Version</span>
                <span>{app.versionName || "1.0.0"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(app.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Downloads</span>
                <span>10k+</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Size</span>
                <span>{app.fileSize ? (app.fileSize / (1024 * 1024)).toFixed(1) + " MB" : "Varies"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-white">Reviews & Ratings</h2>
        {user ? (
          <div className="mb-8">
            <ReviewForm appId={app.id.toString()} />
          </div>
        ) : (
          <div className="mb-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800 text-center">
            <p className="text-gray-400">Please <Link href="/auth" className="text-green-500 hover:underline">sign in</Link> to write a review.</p>
          </div>
        )}
        <ReviewList appId={app.id.toString()} />
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="flex gap-8">
        <Skeleton className="w-32 h-32 rounded-3xl shrink-0" />
        <div className="space-y-4 flex-1">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    </div>
  );
}
