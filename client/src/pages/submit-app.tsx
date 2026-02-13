import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useCreateApp } from "@/hooks/use-apps";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { APP_CATEGORIES } from "@shared/schema";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

// Extension of the base schema for the form
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters").max(100),
  fullDescription: z.string().min(50, "Full description must be at least 50 characters"),
  category: z.string().min(1, "Please select a category"),
  pwa_url: z.string().url("Must be a valid URL"),
  iconUrl: z.string().url("Must be a valid URL"),
  versionName: z.string().min(1, "Version Name is required (e.g. 1.0.0)"),
  versionCode: z.preprocess((val) => Number(val), z.number().min(1, "Version Code must be a positive number")),
  // We'll handle screenshots and APK manually in state
});

export default function SubmitApp() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const createAppMutation = useCreateApp();

  // Get mode from URL
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") === "pwa" ? "pwa" : "apk";

  // File states
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>("");
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);

  // APK State
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [apkUploadProgress, setApkUploadProgress] = useState(0);
  const [apkUrl, setApkUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [draftId] = useState(() => crypto.randomUUID());

  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      setIsRedirecting(true);
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || isRedirecting || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Schema needs to be flexible based on mode, but hooks can't change order.
  // We'll use a loose schema and validate manually in onSubmit for mode-specific fields.
  const dynamicSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    shortDescription: z.string().min(10, "Short description must be at least 10 characters").max(100),
    fullDescription: z.string().min(50, "Full description must be at least 50 characters"),
    category: z.string().min(1, "Please select a category"),
    pwa_url: z.string().optional().or(z.literal('')), // Optional in schema, enforced manually for PWA
    iconUrl: z.string().optional().or(z.literal('')),
    versionName: z.string().min(1, "Version Name is required"),
    versionCode: z.preprocess((val) => Number(val), z.number().min(1, "Version Code must be a positive number")),
  });

  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      name: "",
      shortDescription: "",
      fullDescription: "",
      category: "",
      pwa_url: "",
      iconUrl: "",
      versionName: "",
      versionCode: 1,
    },
  });

  const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const objectUrl = URL.createObjectURL(file);
      setIconPreview(objectUrl);
      form.setValue("iconUrl", objectUrl);
    }
  };

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setScreenshotFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setScreenshotPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshotFiles(prev => prev.filter((_, i) => i !== index));
    setScreenshotPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      return newPreviews.filter((_, i) => i !== index);
    });
  };

  const handleApkSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.apk')) {
        alert("Please select a valid .apk file");
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        alert("File size exceeds 200MB limit");
        return;
      }
      setApkFile(file);
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('app-assets')
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('app-assets')
      .getPublicUrl(path);

    return publicUrl;
  };

  async function onSubmit(values: z.infer<typeof dynamicSchema>) {
    try {
      setUploading(true);

      // --- VALIDATION ---
      if (mode === 'pwa') {
        if (!values.pwa_url || !z.string().url().safeParse(values.pwa_url).success) {
          throw new Error("Please provide a valid PWA URL.");
        }
      } else {
        // APK Mode
        if (!apkFile) {
          throw new Error("Please upload an APK file.");
        }
      }

      // 1. Upload APK (Only if mode is APK)
      let finalApkUrl: string | null = null;
      let finalFileSize = 0;

      if (mode === 'apk' && apkFile) {
        setApkUploadProgress(10);

        // As requested: use 'apk-files' and 'apps/filename'
        const apkPath = `apps/${apkFile.name}`;

        const { data, error } = await supabase.storage
          .from('apk-files')
          .upload(apkPath, apkFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.error("Upload error:", error);
          alert("Upload failed: " + error.message);
          setUploading(false);
          setApkUploadProgress(0);
          return;
        }

        setApkUploadProgress(50);

        const { data: publicData } = supabase.storage
          .from('apk-files')
          .getPublicUrl(apkPath);

        finalApkUrl = publicData.publicUrl;
        finalFileSize = apkFile.size;
        setApkUploadProgress(100);
      }

      // 2. Upload Icon
      let finalIconUrl = values.iconUrl;
      if (iconFile) {
        const iconPath = `icons/${draftId}/icon-${Date.now()}.png`;
        finalIconUrl = await uploadFile(iconFile, iconPath);
      } else {
        if (!finalIconUrl) throw new Error("Please upload an app icon");
      }

      // 3. Upload Screenshots
      const uploadedScreenshots: string[] = [];
      for (let i = 0; i < screenshotFiles.length; i++) {
        const file = screenshotFiles[i];
        const path = `screenshots/${draftId}/shot-${i}-${Date.now()}.png`;
        const url = await uploadFile(file, path);
        uploadedScreenshots.push(url);
      }

      // 4. Submit App Data
      console.log("Submitting App Data:", {
        mode,
        finalApkUrl,
        finalIconUrl,
        values
      });

      createAppMutation.mutate({
        ...values,
        iconUrl: finalIconUrl!,
        category: values.category,
        screenshots: uploadedScreenshots.length > 0 ? uploadedScreenshots : undefined,
        apk_url: finalApkUrl || undefined, // undefined if PWA mode
        pwa_url: mode === 'pwa' ? values.pwa_url : undefined, // undefined if APK mode
        fileSize: finalFileSize,
        versionName: values.versionName,
        versionCode: Number(values.versionCode),
      }, {
        onSuccess: () => {
          setLocation("/developer");
        },
        onError: () => {
          setUploading(false);
          setApkUploadProgress(0);
        }
      });
    } catch (error: any) {
      console.error("Upload failed", error);
      setUploading(false);
      alert("Upload failed: " + error.message);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="glass border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-display text-primary">
            {mode === 'pwa' ? 'Upload PWA' : 'Submit APK'}
          </CardTitle>
          <CardDescription>
            {mode === 'pwa'
              ? "Share your Progressive Web App. Enter the URL below."
              : "Upload your Android .apk file and details."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome App" {...field} className="bg-black/20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black/20">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-white/10">
                          {APP_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Input placeholder="A concise tagline (max 100 chars)" {...field} className="bg-black/20" />
                    </FormControl>
                    <FormDescription>Shown in the app grid.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your app's features..." {...field} className="bg-black/20 min-h-[120px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Version Info (Common) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="versionName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version Name</FormLabel>
                      <FormControl>
                        <Input placeholder="1.0.0" {...field} className="bg-black/20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="versionCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version Code</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1" {...field} className="bg-black/20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* APK Upload Section - ONLY visible if mode is APK */}
              {mode === 'apk' && (
                <div className="bg-gray-900/50 p-6 rounded-xl border border-dashed border-white/20">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-green-500" />
                    APK File Upload
                  </h3>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-white/5 transition-colors relative">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-3 text-gray-400" />
                          <p className="text-sm text-gray-400"><span className="font-semibold">Click to upload APK</span> or drag and drop</p>
                          <p className="text-xs text-gray-500">MAX. 200MB</p>
                        </div>
                        <input
                          type="file"
                          accept=".apk"
                          className="hidden"
                          onChange={handleApkSelect}
                        />
                      </label>
                    </div>
                  </div>

                  {apkFile && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-full">
                          <div className="font-bold text-green-500 text-xs">APK</div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{apkFile.name}</p>
                          <p className="text-xs text-green-400">{(apkFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setApkFile(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {apkUploadProgress > 0 && apkUploadProgress < 100 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Uploading...</span>
                        <span>{apkUploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${apkUploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PWA URL - ONLY visible if mode is pwa */}
              {mode === 'pwa' && (
                <FormField
                  control={form.control}
                  name="pwa_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App URL (PWA/Website)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://myapp.com" {...field} className="bg-black/20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Icon Upload (Common) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormItem>
                  <FormLabel>App Icon</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl border border-dashed border-white/20 flex items-center justify-center bg-black/20 overflow-hidden relative">
                        {iconPreview ? (
                          <img src={iconPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-muted-foreground w-8 h-8" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleIconSelect}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button type="button" variant="secondary" className="relative">
                          <Upload className="w-4 h-4 mr-2" /> Upload Icon
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleIconSelect}
                          />
                        </Button>
                        <span className="text-xs text-muted-foreground">Recommended: 512x512 PNG</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage>{form.formState.errors.iconUrl?.message}</FormMessage>
                </FormItem>
              </div>

              {/* Screenshots Upload (Common) */}
              <div className="space-y-3">
                <FormLabel>Screenshots</FormLabel>
                <div className="flex flex-wrap gap-4">
                  {screenshotPreviews.map((url, idx) => (
                    <div key={idx} className="relative w-24 h-40 rounded-lg overflow-hidden border border-white/10 group">
                      <img src={url} alt={`Screenshot ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(idx)}
                        className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}

                  <div className="w-24 h-40 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 bg-black/20 hover:bg-white/5 transition-colors cursor-pointer relative">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleScreenshotSelect}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-primary text-black hover:bg-primary/90 font-bold h-12 text-lg"
                  disabled={uploading || createAppMutation.isPending}
                >
                  {uploading || createAppMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {uploading ? "Uploading Assets..." : "Submitting..."}
                    </>
                  ) : "Submit App"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
