
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Share2 } from "lucide-react";
import { SiWhatsapp, SiX, SiLinkedin, SiInstagram } from "react-icons/si";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
    appName: string;
    appDescription: string;
}

export function ShareModal({ appName, appDescription }: ShareModalProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedText = encodeURIComponent(`${appName} - ${appDescription}`);

    const shareLinks = {
        whatsapp: `https://wa.me/?text=${encodedText} ${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            toast({
                title: "Link copied",
                description: "Share this link anywhere!",
            });
        } catch (err) {
            toast({
                title: "Failed to copy",
                description: "Please try again manually",
                variant: "destructive",
            });
        }
    };

    const handleInstagramShare = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            toast({
                title: "Link copied & Instagram opening...",
                description: "Paste the link in your Instagram post or message!",
            });
            window.open("https://instagram.com", "_blank");
        } catch (err) {
            toast({
                title: "Failed to copy",
                description: "Please copy the link manually",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="rounded-full border-white/10 hover:border-primary/50">
                    <Share2 className="mr-2 h-5 w-5" /> Share
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-black/90 border-primary/20 backdrop-blur-xl text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-display text-center">Share {appName}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-4 gap-4 py-4">
                    {/* WhatsApp */}
                    <a
                        href={shareLinks.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center group-hover:bg-[#25D366] transition-colors duration-300">
                            <SiWhatsapp className="w-6 h-6 text-[#25D366] group-hover:text-white" />
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-white transition-colors">WhatsApp</span>
                    </a>

                    {/* Twitter / X */}
                    <a
                        href={shareLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white transition-colors duration-300">
                            <SiX className="w-5 h-5 text-white group-hover:text-black" />
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-white transition-colors">X</span>
                    </a>

                    {/* LinkedIn */}
                    <a
                        href={shareLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-[#0077B5]/20 flex items-center justify-center group-hover:bg-[#0077B5] transition-colors duration-300">
                            <SiLinkedin className="w-5 h-5 text-[#0077B5] group-hover:text-white" />
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-white transition-colors">LinkedIn</span>
                    </a>

                    {/* Instagram (Copy Link & Open) */}
                    <button
                        onClick={handleInstagramShare}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[1px] group-hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center group-hover:bg-transparent transition-colors">
                                <SiInstagram className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-white transition-colors">Instagram</span>
                    </button>
                </div>

                <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex-1 text-sm text-muted-foreground truncate px-2">
                        {currentUrl}
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-white/10 hover:text-primary"
                        onClick={handleCopyLink}
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>

                <div className="text-center text-xs text-muted-foreground mt-2">
                    Share on Instagram by copying the link 👆
                </div>
            </DialogContent>
        </Dialog>
    );
}
