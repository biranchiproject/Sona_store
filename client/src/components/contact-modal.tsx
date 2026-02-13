import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import emailjs from "@emailjs/browser";

const contactFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipient: "Admin" | "Developer";
}

export function ContactModal({ isOpen, onClose, recipient }: ContactModalProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            name: "",
            email: "",
            message: "",
        },
    });

    const onSubmit = async (values: ContactFormValues) => {
        setIsSubmitting(true);

        const templateParams = {
            role: user?.role === "admin" ? "ADMIN" : "USER",
            user_name: values.name,
            user_email: values.email,
            message: values.message,
        };

        try {
            await Promise.all([
                // Send Notification to Admin
                emailjs.send(
                    "service_tt5sirf",
                    "template_rsq12bh",
                    templateParams,
                    "nGAH8ltCIwxqMpvxH"
                ),
                // Send Auto-Reply to User
                emailjs.send(
                    "service_tt5sirf",
                    "template_rzl8ise",
                    templateParams,
                    "nGAH8ltCIwxqMpvxH"
                )
            ]);

            toast({
                title: "Message Sent!",
                description: "We've received your message and will get back to you soon.",
            });
            form.reset();
            onClose();
        } catch (error) {
            console.error("EmailJS Error:", error);
            toast({
                title: "Error",
                description: "Failed to send message. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#0a0a0a] border-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">Send a message to {recipient}</DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-400">Your Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter your full name"
                                                {...field}
                                                className="bg-[#111] border-gray-800 focus:border-green-500 h-11"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-400">Email Address</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter your email address"
                                                {...field}
                                                className="bg-[#111] border-gray-800 focus:border-green-500 h-11"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-400">Message</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tell us about your project or just say hello..."
                                                {...field}
                                                className="bg-[#111] border-gray-800 focus:border-green-500 min-h-[120px] resize-none"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-11"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Message
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
