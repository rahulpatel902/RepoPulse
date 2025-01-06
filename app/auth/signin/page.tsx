"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { Logo } from "@/components/logo";

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-4">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome to RepoPulse</h1>
          <p className="text-muted-foreground">
            Sign in with GitHub to start tracking your repositories
          </p>
        </div>
        <Button
          className="w-full gap-2"
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
        >
          <Github className="w-5 h-5" />
          Sign in with GitHub
        </Button>
      </div>
    </div>
  );
}