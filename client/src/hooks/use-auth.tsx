import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GithubAuthProvider,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
  linkWithCredential
} from "firebase/auth";
import { auth, googleProvider, githubProvider } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { type User, type InsertUser, type LoginRequest } from "@shared/schema";
import { api } from "@shared/routes";

// Extend Firebase User or map it to our App User type
// Ideally, we sync with backend to get the real App User (with ID and Role)
// For now, we'll mock the App User structure from Firebase User
function mapFirebaseUserToAppUser(fbUser: FirebaseUser): User {
  return {
    id: fbUser.uid, // Use Firebase UID
    email: fbUser.email || "",
    name: fbUser.displayName || fbUser.email?.split('@')[0] || "User",
    password: "", // Not needed for frontend
    role: "user", // Default, should be updated from backend
    createdAt: new Date().toISOString() // Placeholder
    // Note: In a real app, you'd fetch the user from your DB using the FB UID
  };
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginWithEmail: (data: LoginRequest) => Promise<void>;
  registerWithEmail: (data: InsertUser) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        console.group("🔥 Firebase Auth Listener Triggered");
        console.log("User Email:", fbUser.email);
        console.log("Firebase UID:", fbUser.uid);

        try {
          // 1. Check if user exists in Supabase
          console.log("🔍 Checking Supabase for existing user...");
          const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("email", fbUser.email)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("❌ Supabase Select Error:", fetchError);
          }

          let appUser: User;

          if (existingUser) {
            console.log("✅ User FOUND in Supabase:", existingUser);
            console.log("🎭 User Role:", existingUser.role);

            appUser = {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              role: existingUser.role as "admin" | "user",
              password: "", // DB doesn't have password, keeping type safe
              createdAt: existingUser.created_at || new Date().toISOString()
            };
          } else {
            console.log("⚠️ User NOT FOUND in Supabase. Preparing INSERT...");

            // ⚠️ FIX: Supabase 'id' is type UUID, but Firebase UID is a string.
            // We must generate a valid UUID for Supabase.
            const newUserPayload = {
              id: crypto.randomUUID(), // ✅ Valid UUID
              email: fbUser.email || "",
              name: fbUser.displayName || fbUser.email?.split('@')[0] || "User",
              role: "user",
              // password: "...", // Removed
              created_at: new Date().toISOString()
            };

            console.log("📝 Insert Payload:", newUserPayload);

            const { data: insertedUser, error: insertError } = await supabase
              .from("users")
              .insert([newUserPayload])
              .select()
              .single();

            if (insertError) {
              console.error("❌ Supabase INSERT FAILED:", insertError);
              console.error("   Code:", insertError.code);
              console.error("   Message:", insertError.message);
              console.error("   Details:", insertError.details);

              // Fallback to avoid app crash
              appUser = mapFirebaseUserToAppUser(fbUser);
            } else {
              console.log("✅ API SUCCESS: User Inserted:", insertedUser);
              appUser = {
                id: insertedUser.id,
                email: insertedUser.email,
                name: insertedUser.name,
                role: insertedUser.role as "admin" | "user",
                password: "", // Schema type expects it, but DB doesn't have it
                createdAt: insertedUser.created_at
              };
            }
          }

          console.log("💾 Setting Global Auth State:", appUser);
          setUser(appUser);

        } catch (err: any) {
          console.error("💥 Uncaught Error in Auth Sync:", err);
          setUser(mapFirebaseUserToAppUser(fbUser));
        } finally {
          console.groupEnd();
        }

      } else {
        console.log("👋 User logged out");
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
      toast({ title: "Welcome back!", description: "Successfully logged in with Google" });
    } catch (err: any) {
      setError(err);
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGithub = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, githubProvider);
      toast({ title: "Welcome back!", description: "Successfully logged in with GitHub" });
    } catch (err: any) {
      if (err.code === "auth/account-exists-with-different-credential") {
        try {
          const email = err.customData?.email;
          const pendingCredential = GithubAuthProvider.credentialFromError(err);

          if (email && pendingCredential) {
            const methods = await fetchSignInMethodsForEmail(auth, email);

            if (methods.includes("google.com")) {
              toast({
                title: "Account exists",
                description: "This email is associated with a Google account. Please sign in with Google to link them."
              });

              const result = await signInWithPopup(auth, googleProvider);
              await linkWithCredential(result.user, pendingCredential);

              toast({ title: "Linked!", description: "GitHub account successfully linked." });
              return;
            }
          }
        } catch (linkErr: any) {
          setError(linkErr);
          toast({
            title: "Linking failed",
            description: linkErr.message,
            variant: "destructive"
          });
          return;
        }
      }

      setError(err);
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async ({ email, password }: LoginRequest) => { // Use email instead of username
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password); // Corrected to use email
      toast({ title: "Welcome back!", description: "Successfully logged in" });
    } catch (err: any) {
      setError(err);
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive"
      });
      throw err; // Re-throw for form handling
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async ({ email, password, name }: InsertUser) => {
    try {
      setIsLoading(true);
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name logic could go here (updateProfile)
      toast({ title: "Account created", description: "Welcome to Sona's Store!" });
    } catch (err: any) {
      setError(err);
      toast({
        title: "Registration failed",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      queryClient.clear();
      toast({ title: "Logged out" });
      // Force navigation to ensure clean state
      setLocation("/auth");
    } catch (err: any) {
      toast({
        title: "Logout failed",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Email sent", description: "Check your inbox for password reset instructions" });
    } catch (err: any) {
      toast({
        title: "Reset failed",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginWithGoogle,
        loginWithGithub,
        loginWithEmail,
        registerWithEmail,
        logout,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
