import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { GitHubAPI, Repository } from "@/lib/github";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp, GitPullRequest, Users, Code, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AnalyticsData {
  commits: { date: string; count: number }[];
  issues: { date: string; opened: number; closed: number }[];
  pullRequests: { date: string; opened: number; closed: number }[];
  contributors: { login: string; contributions: number }[];
  languages: { name: string; percentage: number }[];
}

interface RepositoryAnalyticsProps {
  repository: Repository;
  accessToken: string;
}

export function RepositoryAnalytics({ repository, accessToken }: RepositoryAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // Default to 30 days
  const [activeTab, setActiveTab] = useState('activity');

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    async function fetchAnalyticsData() {
      setIsLoading(true);
      try {
        const github = new GitHubAPI(accessToken);
        const [owner, repo] = repository.full_name.split('/');

        const [commitsData, issuesData, pullRequestsData, contributorsData, languagesData] = await Promise.all([
          github.getCommitActivity(owner, repo, parseInt(timeRange)),
          github.getIssueActivity(owner, repo, parseInt(timeRange)),
          github.getPullRequestActivity(owner, repo, parseInt(timeRange)),
          github.getContributors(owner, repo),
          github.getLanguages(owner, repo)
        ]);

        setAnalyticsData({
          commits: commitsData,
          issues: issuesData,
          pullRequests: pullRequestsData,
          contributors: contributorsData.slice(0, 10),
          languages: languagesData
        });
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (repository && accessToken) {
      fetchAnalyticsData();
    }
  }, [repository, accessToken, timeRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  // Calculate summary statistics
  const totalCommits = analyticsData.commits.reduce((sum, day) => sum + day.count, 0);
  const totalIssuesOpened = analyticsData.issues.reduce((sum, day) => sum + day.opened, 0);
  const totalIssuesClosed = analyticsData.issues.reduce((sum, day) => sum + day.closed, 0);
  const totalPRsOpened = analyticsData.pullRequests.reduce((sum, day) => sum + day.opened, 0);
  const totalPRsClosed = analyticsData.pullRequests.reduce((sum, day) => sum + day.closed, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Repository Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCommits}</div>
            <p className="text-xs text-muted-foreground">
              Over the last {timeRange} days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <div className="flex gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIssuesOpened}/{totalIssuesClosed}</div>
            <p className="text-xs text-muted-foreground">
              Opened/Closed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPRsOpened}/{totalPRsClosed}</div>
            <p className="text-xs text-muted-foreground">
              Opened/Closed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.contributors.length}</div>
            <p className="text-xs text-muted-foreground">
              Active contributors
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="health">Repository Health</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Commit Activity</CardTitle>
                <CardDescription>Daily commit frequency over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={analyticsData.commits}
                      margin={{ top: 5, right: 10, left: -32, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-sm"
                        tickFormatter={formatDate}
                        interval="preserveStartEnd"
                      />
                      <YAxis className="text-sm" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Issues & Pull Requests</CardTitle>
                  <CardDescription>Daily opened and closed items</CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-primary rounded" />
                    <span className="text-sm text-muted-foreground">Opened</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-destructive rounded" />
                    <span className="text-sm text-muted-foreground">Closed</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-10">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={analyticsData.issues}
                      margin={{ top: 5, right: 10, left: -32, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-sm"
                        tickFormatter={formatDate}
                        interval="preserveStartEnd"
                      />
                      <YAxis className="text-sm" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Bar dataKey="opened" name="Opened" fill="hsl(var(--primary))" />
                      <Bar dataKey="closed" name="Closed" fill="hsl(var(--destructive))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contributors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
              <CardDescription>Most active contributors by commit count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.contributors.map((contributor, index) => (
                  <div key={contributor.login} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{contributor.login}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {contributor.contributions} commits
                      </span>
                    </div>
                    <Progress 
                      value={(contributor.contributions / analyticsData.contributors[0].contributions) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Language Distribution</CardTitle>
              <CardDescription>Programming languages used in the repository</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.languages.map((language) => (
                  <div key={language.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{language.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {language.percentage}%
                      </span>
                    </div>
                    <Progress value={language.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Issue Resolution Time</CardTitle>
                <CardDescription>Average time to resolve issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Average Resolution Time</p>
                      <p className="text-2xl font-bold">
                        {Math.round(
                          analyticsData.issues
                            .filter(day => day.closed > 0)
                            .reduce((acc, day) => acc + day.closed, 0) / 
                          analyticsData.issues.filter(day => day.closed > 0).length || 0
                        )} days
                      </p>
                    </div>
                    <Progress value={75} className="w-[60px]" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Open Issues</span>
                      <span className="text-sm font-medium">{totalIssuesOpened - totalIssuesClosed}</span>
                    </div>
                    <Progress 
                      value={((totalIssuesOpened - totalIssuesClosed) / totalIssuesOpened) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pull Request Health</CardTitle>
                <CardDescription>PR merge rate and review status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Merge Success Rate</p>
                      <p className="text-2xl font-bold">
                        {Math.round((totalPRsClosed / totalPRsOpened) * 100 || 0)}%
                      </p>
                    </div>
                    <Progress 
                      value={(totalPRsClosed / totalPRsOpened) * 100} 
                      className="w-[60px]" 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Open Pull Requests</span>
                      <span className="text-sm font-medium">{totalPRsOpened - totalPRsClosed}</span>
                    </div>
                    <Progress 
                      value={((totalPRsOpened - totalPRsClosed) / totalPRsOpened) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Repository Activity Score</CardTitle>
                <CardDescription>Overall health and activity metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Activity Score</p>
                      <p className="text-2xl font-bold">
                        {Math.round(
                          ((totalCommits / parseInt(timeRange)) +
                          (totalPRsClosed / totalPRsOpened * 100) +
                          (totalIssuesClosed / totalIssuesOpened * 100)) / 3
                        )}%
                      </p>
                    </div>
                    <Progress 
                      value={Math.round(
                        ((totalCommits / parseInt(timeRange)) +
                        (totalPRsClosed / totalPRsOpened * 100) +
                        (totalIssuesClosed / totalIssuesOpened * 100)) / 3
                      )} 
                      className="w-[60px]" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Daily Commits</span>
                        <span className="text-sm font-medium">
                          {(totalCommits / parseInt(timeRange)).toFixed(1)}
                        </span>
                      </div>
                      <Progress 
                        value={(totalCommits / parseInt(timeRange)) * 10} 
                        className="h-2" 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Contributors</span>
                        <span className="text-sm font-medium">
                          {analyticsData.contributors.length}
                        </span>
                      </div>
                      <Progress 
                        value={analyticsData.contributors.length * 10} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentation Status</CardTitle>
                <CardDescription>Repository documentation health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Documentation Score</p>
                      <p className="text-2xl font-bold">85%</p>
                    </div>
                    <Progress value={85} className="w-[60px]" />
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: "README.md", status: true },
                      { name: "CONTRIBUTING.md", status: false },
                      { name: "LICENSE", status: true },
                      { name: "Code of Conduct", status: false }
                    ].map((doc) => (
                      <div key={doc.name} className="flex items-center justify-between">
                        <span className="text-sm">{doc.name}</span>
                        <Badge variant={doc.status ? "default" : "secondary"}>
                          {doc.status ? "Present" : "Missing"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
