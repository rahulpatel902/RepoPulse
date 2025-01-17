import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { GitHubAPI, Repository, RepositoryHealth } from "@/lib/github";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Loader2, TrendingUp, GitPullRequest, Users, Code, ArrowUpRight, ArrowDownRight, Download, RefreshCw, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AnalyticsData {
  commits: { date: string; count: number }[];
  issues: { date: string; opened: number; closed: number }[];
  pullRequests: { date: string; opened: number; closed: number }[];
  contributors: { login: string; contributions: number }[];
  topContributors: { login: string; contributions: number }[];
  totalContributors: number;
  languages: { name: string; percentage: number }[];
  health: RepositoryHealth;
}

interface RepositoryAnalyticsProps {
  repository: Repository;
  accessToken: string;
}

interface CachedData {
  data: AnalyticsData;
  timestamp: number;
  timeRange: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function RepositoryAnalytics({ repository, accessToken }: RepositoryAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timeRange, setTimeRange] = useState('7'); // Default to 7 days
  const [activeTab, setActiveTab] = useState('activity');
  const [cachedData, setCachedData] = useState<Record<string, CachedData>>({});
  const [healthData, setHealthData] = useState<RepositoryHealth | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout>();

  const timeRangeOptions = [
    { value: '1', label: 'Today', group: 'Recent' },
    { value: '2', label: 'Yesterday', group: 'Recent' },
    { value: '7', label: 'This Week', group: 'Weeks' },
    { value: '14', label: 'Last 2 Weeks', group: 'Weeks' },
    { value: '21', label: 'Last 3 Weeks', group: 'Weeks' },
    { value: '30', label: 'This Month', group: 'Months' },
    { value: '60', label: 'Last 2 Months', group: 'Months' },
    { value: '90', label: 'Last Quarter', group: 'Months' },
  ];

  const timeRangeGroups = timeRangeOptions.reduce((groups: { [key: string]: typeof timeRangeOptions }, option) => {
    const group = option.group;
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(option);
    return groups;
  }, {});

  const getTimeRangeLabel = (value: string) => {
    const option = timeRangeOptions.find(opt => opt.value === value);
    return option ? option.label : 'Custom range';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateActivityScore = (data: AnalyticsData): number => {
    const commitWeight = 0.4;
    const prWeight = 0.3;
    const issueWeight = 0.3;

    const commitsPerDay = data.commits.reduce((sum, day) => sum + day.count, 0) / parseInt(timeRange);
    const prSuccessRate = data.pullRequests.reduce((sum, day) => sum + day.closed, 0) / 
                         Math.max(data.pullRequests.reduce((sum, day) => sum + day.opened, 0), 1) * 100;
    const issueResolutionRate = data.issues.reduce((sum, day) => sum + day.closed, 0) / 
                               Math.max(data.issues.reduce((sum, day) => sum + day.opened, 0), 1) * 100;

    return Math.round(
      (commitsPerDay * 10 * commitWeight) +
      (prSuccessRate * prWeight) +
      (issueResolutionRate * issueWeight)
    );
  };

  const fetchAnalyticsData = useCallback(async (force: boolean = false) => {
    if (!repository || !accessToken) return;

    const cacheKey = `${repository.full_name}-${timeRange}`;
    const cached = cachedData[cacheKey];
    
    if (!force && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setAnalyticsData(cached.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const github = new GitHubAPI(accessToken);
      const [owner, repo] = repository.full_name.split('/');
      
      const [
        commitsData,
        issuesData,
        pullRequestsData,
        contributorsData,
        allTimeContributorsData,
        languagesData,
        healthData
      ] = await Promise.all([
        github.getCommitActivity(owner, repo, timeRange),
        github.getIssueActivity(owner, repo, timeRange),
        github.getPullRequestActivity(owner, repo, timeRange),
        github.getContributorsInRange(owner, repo, timeRange),
        github.getContributors(owner, repo),
        github.getLanguages(owner, repo),
        github.getRepositoryHealth(owner, repo)
      ]);

      const newData: AnalyticsData = {
        commits: commitsData,
        issues: issuesData,
        pullRequests: pullRequestsData,
        contributors: contributorsData,
        topContributors: contributorsData.slice(0, 10),
        totalContributors: contributorsData.length,
        languages: languagesData,
        health: healthData
      };

      setAnalyticsData(newData);
      setCachedData(prev => ({
        ...prev,
        [cacheKey]: {
          data: newData,
          timestamp: Date.now(),
          timeRange
        }
      }));
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics data'));
    } finally {
      setIsLoading(false);
    }
  }, [repository, accessToken, timeRange, cachedData]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  useEffect(() => {
    // Set up auto-refresh
    refreshInterval.current = setInterval(() => {
      fetchAnalyticsData(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [fetchAnalyticsData]);

  useEffect(() => {
    const fetchHealthData = async () => {
      const githubAPI = new GitHubAPI(accessToken);
      const [owner, repo] = repository.full_name.split('/');
      const health = await githubAPI.getRepositoryHealth(owner, repo);
      setHealthData(health);
    };
    fetchHealthData();
  }, [repository.full_name, accessToken]);

  const exportAnalytics = () => {
    if (!analyticsData) return;

    const exportData = {
      repository: repository.full_name,
      timeRange: `${timeRange} days`,
      exportDate: new Date().toISOString(),
      summary: {
        commits: analyticsData.commits.reduce((sum, day) => sum + day.count, 0),
        issues: {
          opened: analyticsData.issues.reduce((sum, day) => sum + day.opened, 0),
          closed: analyticsData.issues.reduce((sum, day) => sum + day.closed, 0)
        },
        pullRequests: {
          opened: analyticsData.pullRequests.reduce((sum, day) => sum + day.opened, 0),
          closed: analyticsData.pullRequests.reduce((sum, day) => sum + day.closed, 0)
        },
        languages: analyticsData.languages,
        topContributors: analyticsData.topContributors,
        activityScore: calculateActivityScore(analyticsData)
      },
      detailed: analyticsData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repository.name}-analytics.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const summaryStats = useMemo(() => {
    if (!analyticsData) return null;

    const commits = analyticsData.commits.reduce((sum, day) => sum + (day?.count || 0), 0);
    const issuesOpened = analyticsData.issues.reduce((sum, day) => sum + (day?.opened || 0), 0);
    const issuesClosed = analyticsData.issues.reduce((sum, day) => sum + (day?.closed || 0), 0);
    const prsOpened = analyticsData.pullRequests.reduce((sum, day) => sum + (day?.opened || 0), 0);
    const prsClosed = analyticsData.pullRequests.reduce((sum, day) => sum + (day?.closed || 0), 0);
    const totalContributors = analyticsData.totalContributors;

    // Calculate daily averages
    const daysInRange = parseInt(timeRange);
    const dailyCommits = (commits / daysInRange).toFixed(1);
    const issueResolutionRate = issuesOpened > 0 ? ((issuesClosed / issuesOpened) * 100).toFixed(1) : '0';
    const prMergeRate = prsOpened > 0 ? ((prsClosed / prsOpened) * 100).toFixed(1) : '0';
    const contributorsPerCommit = totalContributors > 0 ? (commits / totalContributors).toFixed(1) : '0';

    return {
      commits,
      issuesOpened,
      issuesClosed,
      prsOpened,
      prsClosed,
      totalContributors,
      dailyCommits,
      issueResolutionRate,
      prMergeRate,
      contributorsPerCommit
    };
  }, [analyticsData, timeRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message}
          <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchAnalyticsData(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Repository Analytics</h2>
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium text-primary bg-background shadow-sm">
              {repository.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(timeRangeGroups).map(([group, options]) => (
                <SelectGroup key={group}>
                  <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {group}
                  </SelectLabel>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => fetchAnalyticsData(true)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={exportAnalytics}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.commits || 0}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Last {timeRange} days
              </p>
              <p className="text-xs font-medium">
                ~{summaryStats?.dailyCommits || '0'}/day
              </p>
            </div>
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
            <div className="text-2xl font-bold">
              {summaryStats?.issuesOpened || 0}/{summaryStats?.issuesClosed || 0}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Opened/Closed
              </p>
              <p className="text-xs font-medium">
                {summaryStats?.issueResolutionRate}% resolved
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats?.prsOpened || 0}/{summaryStats?.prsClosed || 0}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Opened/Closed
              </p>
              <p className="text-xs font-medium">
                {summaryStats?.prMergeRate}% merged
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contributors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.totalContributors || 0}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {getTimeRangeLabel(timeRange)}
              </p>
              <p className="text-xs font-medium">
                ~{summaryStats?.contributorsPerCommit} commits/contributor
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="contributors">Contributors</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="health">Repository Health</TabsTrigger>
          </TabsList>
        </div>

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
              <CardTitle>Active Contributors</CardTitle>
              <CardDescription>
                Most active contributors ({getTimeRangeLabel(timeRange)})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topContributors.map((contributor, index) => (
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
                      value={(contributor.contributions / analyticsData.topContributors[0].contributions) * 100} 
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
                      <span className="text-sm font-medium">
                        {summaryStats?.issuesOpened && summaryStats?.issuesClosed
                          ? summaryStats.issuesOpened - summaryStats.issuesClosed
                          : 0}
                      </span>
                    </div>
                    <Progress 
                      value={
                        summaryStats?.issuesOpened && summaryStats?.issuesClosed
                          ? ((summaryStats.issuesOpened - summaryStats.issuesClosed) / summaryStats.issuesOpened) * 100
                          : 0
                      }
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
                        {summaryStats?.prsClosed && summaryStats?.prsOpened
                          ? Math.round((summaryStats.prsClosed / summaryStats.prsOpened) * 100)
                          : 0}%
                      </p>
                    </div>
                    <Progress 
                      value={
                        summaryStats?.prsClosed && summaryStats?.prsOpened
                          ? (summaryStats.prsClosed / summaryStats.prsOpened) * 100
                          : 0
                      }
                      className="w-[60px]" 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Open Pull Requests</span>
                      <span className="text-sm font-medium">
                        {summaryStats?.prsOpened && summaryStats?.prsClosed
                          ? summaryStats.prsOpened - summaryStats.prsClosed
                          : 0}
                      </span>
                    </div>
                    <Progress 
                      value={
                        summaryStats?.prsOpened && summaryStats?.prsClosed
                          ? ((summaryStats.prsOpened - summaryStats.prsClosed) / summaryStats.prsOpened) * 100
                          : 0
                      }
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
                          ((summaryStats?.commits ? summaryStats.commits / parseInt(timeRange) : 0) +
                          (summaryStats?.prsClosed && summaryStats?.prsOpened ? (summaryStats.prsClosed / summaryStats.prsOpened * 100) : 0) +
                          (summaryStats?.issuesClosed && summaryStats?.issuesOpened ? (summaryStats.issuesClosed / summaryStats.issuesOpened * 100) : 0)) / 3
                        )}%
                      </p>
                    </div>
                    <Progress 
                      value={Math.round(
                        ((summaryStats?.commits ? summaryStats.commits / parseInt(timeRange) : 0) +
                        (summaryStats?.prsClosed && summaryStats?.prsOpened ? (summaryStats.prsClosed / summaryStats.prsOpened * 100) : 0) +
                        (summaryStats?.issuesClosed && summaryStats?.issuesOpened ? (summaryStats.issuesClosed / summaryStats.issuesOpened * 100) : 0)) / 3
                      )} 
                      className="w-[60px]" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Daily Commits</span>
                        <span className="text-sm font-medium">
                          {summaryStats?.commits 
                            ? (summaryStats.commits / parseInt(timeRange)).toFixed(1)
                            : '0.0'}
                        </span>
                      </div>
                      <Progress 
                        value={
                          summaryStats?.commits 
                            ? (summaryStats.commits / parseInt(timeRange)) * 10
                            : 0
                        }
                        className="h-2" 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Contributors</span>
                        <span className="text-sm font-medium">
                          {summaryStats?.totalContributors ?? 0}
                        </span>
                      </div>
                      <Progress 
                        value={summaryStats?.totalContributors ? summaryStats.totalContributors * 10 : 0} 
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
                      { name: 'README.md', status: healthData?.documentationStatus?.find(doc => doc.name === 'README.md')?.status ?? false },
                      { name: 'LICENSE', status: healthData?.documentationStatus?.find(doc => doc.name === 'LICENSE')?.status ?? false },
                      { name: 'CONTRIBUTING.md', status: healthData?.documentationStatus?.find(doc => doc.name === 'CONTRIBUTING.md')?.status ?? false },
                      { name: 'CODE_OF_CONDUCT.md', status: healthData?.documentationStatus?.find(doc => doc.name === 'CODE_OF_CONDUCT.md')?.status ?? false }
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
