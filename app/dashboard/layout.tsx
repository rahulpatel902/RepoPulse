"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Settings, Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/logo";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState("up");
  const [prevOffset, setPrevOffset] = useState(0);

  useEffect(() => {
    const toggleScrollDirection = () => {
      let scrollY = window.scrollY;
      if (scrollY === 0) {
        setScrollDirection("up");
      } else if (scrollY > prevOffset) {
        setScrollDirection("down");
      } else if (scrollY < prevOffset) {
        setScrollDirection("up");
      }
      setPrevOffset(scrollY);
    };

    window.addEventListener("scroll", toggleScrollDirection);
    return () => window.removeEventListener("scroll", toggleScrollDirection);
  }, [prevOffset]);

  return scrollDirection;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const scrollDirection = useScrollDirection();

  if (status === "unauthenticated") {
    redirect("/");
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your dashboard</p>
        </div>
      </div>
    );
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ${
        scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
      }`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Logo />
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" className="gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="hidden lg:inline">Notifications</span>
                </Button>
                <Button variant="ghost" className="gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden lg:inline">Settings</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <img
                  src={session?.user?.image || ""}
                  alt={session?.user?.name || ""}
                  className="w-8 h-8 rounded-full ring-2 ring-primary/10"
                />
                <span className="hidden md:inline font-medium">
                  {session?.user?.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-5 h-5" />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader className="border-b pb-4">
                    <SheetTitle className="flex items-center gap-2">
                      <Logo />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <div className="flex items-center gap-3 px-2 py-3">
                      <img
                        src={session?.user?.image || ""}
                        alt={session?.user?.name || ""}
                        className="w-10 h-10 rounded-full ring-2 ring-primary/10"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{session?.user?.name}</span>
                        <span className="text-sm text-muted-foreground">{session?.user?.email}</span>
                      </div>
                    </div>
                    <div className="border-t my-4" />
                    <div className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start gap-3 px-2 py-6">
                        <Bell className="w-5 h-5" />
                        <div className="flex flex-col items-start">
                          <span>Notifications</span>
                          <span className="text-sm text-muted-foreground">View your notifications</span>
                        </div>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-3 px-2 py-6">
                        <Settings className="w-5 h-5" />
                        <div className="flex flex-col items-start">
                          <span>Settings</span>
                          <span className="text-sm text-muted-foreground">Manage your preferences</span>
                        </div>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-3 px-2 py-6 text-red-500 hover:text-red-500 hover:bg-red-500/10"
                        onClick={handleSignOut}
                      >
                        <LogOut className="w-5 h-5" />
                        <div className="flex flex-col items-start">
                          <span>Sign Out</span>
                          <span className="text-sm text-muted-foreground">Log out of your account</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      {/* Footer */}
      <footer className="border-t mt-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Powered by</span>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-foreground"
                >
                  GitHub
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-external-link"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
              <span className="hidden sm:inline mx-4">•</span>
              <a
                href="https://github.com/rahulpatel902/RepoPulse"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Source Code
              </a>
              <span className="hidden sm:inline mx-4">•</span>
              <a
                href="https://github.com/rahulpatel902/RepoPulse/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Report Issue
              </a>
            </div>
            <div className="flex items-center gap-3">
              <span>Made with</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: 'rgb(4, 95, 145)' }}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>by</span>
              <a
                href="https://github.com/rahulpatel902"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                Rahul
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-external-link"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
