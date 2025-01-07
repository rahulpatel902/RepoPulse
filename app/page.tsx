"use client";

import { Activity, Bell, BarChart, GitPullRequest, Rocket, Users, MessageSquare, Zap, Star, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { FeatureCard } from "@/components/feature-card";
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
      <section className="min-h-screen relative flex items-center justify-center py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(0,0,0,0.1),transparent)]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="flex justify-center mb-12">
            <Logo />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Monitor Open Source Projects in Real-time</span>
          </div>
          <h1 className="text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            Track Your Open-
             <br />
            Source Contributions
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stay in sync with your favorite open-source projects. Track issues, PRs, and releases
            with real-time updates and insights.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="h-12 px-6 text-base font-semibold bg-white hover:bg-gray-50 text-[#24292f] border border-gray-300 gap-3"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-[#24292f]" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.463 2 11.97c0 4.404 2.865 8.14 6.839 9.458.5.092.682-.216.682-.48 0-.236-.008-.864-.013-1.695-2.782.602-3.369-1.337-3.369-1.337-.454-1.151-1.11-1.458-1.11-1.458-.908-.618.069-.606.069-.606 1.003.07 1.531 1.027 1.531 1.027.892 1.524 2.341 1.084 2.91.828.092-.643.35-1.083.636-1.332-2.22-.251-4.555-1.107-4.555-4.927 0-1.088.39-1.979 1.029-2.675-.103-.252-.446-1.266.098-2.638 0 0 .84-.268 2.75 1.022A9.607 9.607 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.372.202 2.386.1 2.638.64.696 1.028 1.587 1.028 2.675 0 3.83-2.339 4.673-4.566 4.92.359.307.678.915.678 1.846 0 1.332-.012 2.407-.012 2.734 0 .267.18.577.688.48 3.97-1.32 6.833-5.054 6.833-9.458C22 6.463 17.522 2 12 2z" />
            </svg>
            {session ? "Go to Dashboard" : "Sign in with GitHub"}
          </Button>
        </div>
      </section>

      {/* Features Grid - Full viewport height */}
      <section className="min-h-screen flex items-center py-24 px-4 bg-gradient-to-b from-background to-background/95">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Need</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            RepoPulse provides all the tools you need to stay on top of your open source contributions
            and track project activities.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Real-Time Updates"
              description="Get instant notifications for new issues, pull requests, and releases from your tracked repositories."
            />
            <FeatureCard
              icon={BarChart}
              title="Contributor Analytics"
              description="Track contribution metrics and project health with detailed analytics and insights."
            />
            <FeatureCard
              icon={GitPullRequest}
              title="PR Tracking"
              description="Stay updated on pull request status, reviews, and merge progress across repositories."
            />
            <FeatureCard
              icon={LineChart}
              title="Activity Tracking"
              description="Monitor commits, issues, and pull requests across all your favorite repositories in one place."
            />
            <FeatureCard
              icon={Bell}
              title="Smart Notifications"
              description="Customize your notification preferences and receive alerts via email or Slack."
            />
            <FeatureCard
              icon={Star}
              title="Trending Projects"
              description="Discover trending repositories and stay updated with the latest in open source."
            />
            <FeatureCard
              icon={Rocket}
              title="Release Monitoring"
              description="Never miss a release with automated notifications and changelog tracking."
            />
            <FeatureCard
              icon={Users}
              title="Collaborator Insights"
              description="Understand contributor activity and engagement across your projects."
            />
            <FeatureCard
              icon={MessageSquare}
              title="Community Forums"
              description="Engage with project discussions and stay connected with the community."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo />
            <nav>
              <ul className="flex items-center gap-8">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    GitHub
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} RepoPulse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}