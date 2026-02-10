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
import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";

// Extension of the base schema for the form
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters").max(100),
  fullDescription: z.string().min(50, "Full description must be at least 50 characters"),
  category: z.string().min(1, "Please select a category"),
  pwaUrl: z.string().url("Must be a valid URL"),
  iconUrl: z.string().url("Must be a valid URL"),
  // We'll handle screenshots manually in state for simplicity in this demo, 
  // but validate at least one is present before submit if strictly required
});

export default function SubmitApp() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const createAppMutation = useCreateApp();
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [screenshotInput, setScreenshotInput] = useState("");

  if (!user) {
    setLocation("/auth");
    return null;
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      shortDescription: "",
      fullDescription: "",
      category: "",
      pwaUrl: "",
      iconUrl: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createAppMutation.mutate({
      ...values,
      category: values.category,
      screenshots: screenshots.length > 0 ? screenshots : undefined,
    }, {
      onSuccess: () => {
        setLocation("/profile");
      }
    });
  }

  const addScreenshot = () => {
    if (screenshotInput && !screenshots.includes(screenshotInput)) {
      setScreenshots([...screenshots, screenshotInput]);
      setScreenshotInput("");
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="glass border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-display text-primary">Submit Your App</CardTitle>
          <CardDescription>
            Share your PWA with the world. Please provide accurate details.
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="pwaUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App URL (PWA)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://myapp.com" {...field} className="bg-black/20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 <FormField
                  control={form.control}
                  name="iconUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://.../icon.png" {...field} className="bg-black/20" />
                      </FormControl>
                      <FormDescription>Square PNG recommended (512x512).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Screenshots - Custom Field */}
              <div className="space-y-3">
                <FormLabel>Screenshots (URLs)</FormLabel>
                <div className="flex gap-2">
                  <Input 
                    value={screenshotInput}
                    onChange={(e) => setScreenshotInput(e.target.value)}
                    placeholder="https://.../screenshot.jpg"
                    className="bg-black/20"
                  />
                  <Button type="button" onClick={addScreenshot} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {screenshots.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt="Screenshot preview" className="w-20 h-20 object-cover rounded border border-white/10" />
                      <button 
                        type="button" 
                        onClick={() => removeScreenshot(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-black hover:bg-primary/90 font-bold h-12 text-lg"
                  disabled={createAppMutation.isPending}
                >
                  {createAppMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Submit App"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
