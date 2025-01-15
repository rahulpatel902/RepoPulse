"use client";

import { Activity, Bell, BarChart, GitPullRequest, Rocket, MessageSquare, Zap, Star, LineChart, GitMerge, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { FeatureCard } from "@/components/feature-card";
import { GridPattern } from "@/components/grid-pattern";
import { MouseTrail } from "@/components/mouse-trail";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGetStarted = async () => {
    if (session) {
      router.push('/dashboard');
    } else {
      try {
        await signIn('github', { 
          callbackUrl: '/dashboard',
          redirect: true 
        });
      } catch (error) {
        console.error('Sign-in error:', error);
        alert('Failed to sign in: ' + (error as Error).message);
      }
    }
  };

  return (
    <div className="bg-background">
      {/* Hero Section - Full viewport height */}
      <section className="min-h-screen relative flex items-center justify-center py-20 sm:py-32 px-4 overflow-hidden isolate no-select">
        <GridPattern />
        <MouseTrail style={{ zIndex: -10 }} />
        <div className="max-w-4xl mx-auto text-center relative space-y-8 sm:space-y-12 pointer-events-none">
          <div className="flex justify-center animate-fade-in">
            <Logo />
          </div>
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary backdrop-blur-sm animate-fade-in-up border border-primary/20">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Monitor Open Source Projects in Real-time</span>
          </div>
          <div className="space-y-6 sm:space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent animate-fade-in-up [animation-delay:150ms] px-2">
              Track Your Open-
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              Source Contributions
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up [animation-delay:300ms] px-2">
              Stay in sync with your favorite open-source projects. Track issues, PRs, and releases
              with real-time updates and insights.
            </p>
          </div>
          <div className="pt-4 sm:pt-6 animate-fade-in-up [animation-delay:450ms]">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="relative h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold bg-white hover:bg-gray-50 text-[#24292f] border border-gray-300 gap-2 sm:gap-3 overflow-hidden transition-all hover:shadow-lg hover:scale-105 group pointer-events-auto z-10"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6 fill-[#24292f] transition-transform group-hover:scale-110" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.463 2 11.97c0 4.404 2.865 8.14 6.839 9.458.5.092.682-.216.682-.48 0-.236-.008-.864-.013-1.695-2.782.602-3.369-1.337-3.369-1.337-.454-1.151-1.11-1.458-1.11-1.458-.908-.618.069-.606.069-.606 1.003.07 1.531 1.027 1.531 1.027.892 1.524 2.341 1.084 2.91.828.092-.643.35-1.083.636-1.332-2.22-.251-4.555-1.107-4.555-4.927 0-1.088.39-1.979 1.029-2.675-.103-.252-.446-1.266.098-2.638 0 0 .84-.268 2.75 1.022A9.607 9.607 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.372.202 2.386.1 2.638.64.696 1.028 1.587 1.028 2.675 0 3.83-2.339 4.673-4.566 4.92.359.307.678.915.678 1.846 0 1.332-.012 2.407-.012 2.734 0 .267.18.577.688.48 3.97-1.32 6.833-5.054 6.833-9.458C22 6.463 17.522 2 12 2z" />
              </svg>
              {session ? "Go to Dashboard" : "Sign in with GitHub"}
              <div className="absolute inset-0 pointer-events-none transition-all group-hover:bg-primary/5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid - Full viewport height */}
      <section className="min-h-screen flex items-center py-24 sm:py-36 px-4 bg-gradient-to-b from-background to-background/95">
        <div className="max-w-6xl mx-auto w-full space-y-12 sm:space-y-16">
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-br from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground text-center max-w-2xl mx-auto">
              RepoPulse provides all the tools you need to stay on top of your open source contributions
              and track project activities.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon={Zap}
              title="Real-time Updates"
              description="Get instant notifications about issues, pull requests, and repository activities."
              className="animate-fade-in-up"
            />
            <FeatureCard
              icon={GitPullRequest}
              title="PR Tracking"
              description="Monitor pull request status, reviews, and merge conflicts efficiently."
              className="animate-fade-in-up [animation-delay:150ms]"
            />
            <FeatureCard
              icon={GitMerge}
              title="Issue Management"
              description="Track and manage issues across multiple repositories in one place."
              className="animate-fade-in-up [animation-delay:300ms]"
            />
            <FeatureCard
              icon={BarChart2}
              title="Analytics"
              description="Visualize repository trends, contribution stats, and team performance."
              className="animate-fade-in-up [animation-delay:450ms]"
            />
            <FeatureCard
              icon={Bell}
              title="Smart Notifications"
              description="Customizable alerts for the events that matter most to you."
              className="animate-fade-in-up [animation-delay:600ms]"
            />
            <FeatureCard
              icon={Rocket}
              title="Release Monitoring"
              description="Never miss a release with automated notifications and changelog tracking."
              className="animate-fade-in-up [animation-delay:750ms]"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 sm:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} RepoPulse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}