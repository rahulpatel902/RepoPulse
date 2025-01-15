"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { GitHubAPI, Repository, Issue, PullRequest, Release, Commit } from "@/lib/github";
import { RepositoryCard } from "@/components/repository-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2, Maximize2, Minimize2, ExternalLink, ArrowDown, ChevronDown, MoreHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityDialog } from "@/components/activity-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RepositoryAnalytics } from "@/components/analytics/repository-analytics";

interface ActivityState {
  data: any[];
  page: number;
  hasNextPage: boolean;
  isLoading: boolean;
}

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 0) return `${seconds}s ago`;
  return 'just now';
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Repository[]>([]);
  const [trackedRepos, setTrackedRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [issues, setIssues] = useState<ActivityState>({
    data: [],
    page: 1,
    hasNextPage: false,
    isLoading: false,
  });
  const [pullRequests, setPullRequests] = useState<ActivityState>({
    data: [],
    page: 1,
    hasNextPage: false,
    isLoading: false,
  });
  const [releases, setReleases] = useState<ActivityState>({
    data: [],
    page: 1,
    hasNextPage: false,
    isLoading: false,
  });
  const [commits, setCommits] = useState<ActivityState>({
    data: [],
    page: 1,
    hasNextPage: false,
    isLoading: false,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const [openDialog, setOpenDialog] = useState<"issues" | "pullRequests" | "releases" | "commits" | null>(null);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [filteredPRs, setFilteredPRs] = useState<PullRequest[]>([]);
  const [filteredReleases, setFilteredReleases] = useState<Release[]>([]);
  const [filteredCommits, setFilteredCommits] = useState<Commit[]>([]);
  const [issueLabels, setIssueLabels] = useState<string[]>([]);
  const [prLabels, setPRLabels] = useState<string[]>([]);

  useEffect(() => {
    if (session?.accessToken && selectedRepo) {
      setIssues({ data: [], page: 1, hasNextPage: false, isLoading: true });
      setPullRequests({ data: [], page: 1, hasNextPage: false, isLoading: true });
      setReleases({ data: [], page: 1, hasNextPage: false, isLoading: true });
      setCommits({ data: [], page: 1, hasNextPage: false, isLoading: true });

      const github = new GitHubAPI(session.accessToken);
      const [owner, repo] = selectedRepo.full_name.split("/");

      Promise.all([
        github.getIssues(owner, repo, 1, 11),
        github.getPullRequests(owner, repo, 1, 11),
        github.getReleases(owner, repo, 1, 11),
        github.getCommits(owner, repo, 1, 11),
      ])
        .then(([issuesData, prsData, releasesData, commitsData]) => {
          setIssues({
            data: issuesData.data.slice(0, 10),
            page: 1,
            hasNextPage: issuesData.data.length > 10,
            isLoading: false,
          });
          setPullRequests({
            data: prsData.data.slice(0, 10),
            page: 1,
            hasNextPage: prsData.data.length > 10,
            isLoading: false,
          });
          setReleases({
            data: releasesData.data.slice(0, 10),
            page: 1,
            hasNextPage: releasesData.data.length > 10,
            isLoading: false,
          });
          setCommits({
            data: commitsData.data.slice(0, 10),
            page: 1,
            hasNextPage: commitsData.data.length > 10,
            isLoading: false,
          });
        })
        .catch((error) => {
          console.error("Failed to fetch repository data:", error);
        });
    }
  }, [session?.accessToken, selectedRepo]);

  useEffect(() => {
    if (issues.data.length > 0) {
      const labels = new Set<string>();
      issues.data.forEach((issue: Issue) => {
        issue.labels.forEach((label: any) => {
          labels.add(label.name);
        });
      });
      setIssueLabels(Array.from(labels));
    }
  }, [issues.data]);

  useEffect(() => {
    if (pullRequests.data.length > 0) {
      const labels = new Set<string>();
      pullRequests.data.forEach((pr: PullRequest) => {
        pr.labels.forEach((label: any) => {
          labels.add(label.name);
        });
      });
      setPRLabels(Array.from(labels));
    }
  }, [pullRequests.data]);

  const handleFilter = async (type: "issues" | "pullRequests", filter: string) => {
    if (!selectedRepo || !session?.accessToken) return;

    switch (type) {
      case "issues":
        setIssues(prev => ({ ...prev, isLoading: true }));
        try {
          const github = new GitHubAPI(session.accessToken);
          const [owner, repo] = selectedRepo.full_name.split("/");
          const response = await github.getIssues(owner, repo, 1, 10, filter as "open" | "closed");
          setIssues({
            data: response.data,
            page: 1,
            hasNextPage: response.hasNextPage,
            isLoading: false,
          });
          setFilteredIssues([]);
        } catch (error) {
          console.error("Failed to fetch issues:", error);
          setIssues(prev => ({ ...prev, isLoading: false }));
        }
        break;

      case "pullRequests":
        setPullRequests(prev => ({ ...prev, isLoading: true }));
        try {
          const github = new GitHubAPI(session.accessToken);
          const [owner, repo] = selectedRepo.full_name.split("/");
          const response = await github.getPullRequests(owner, repo, 1);
          setPullRequests({
            data: response.data,
            page: 1,
            hasNextPage: response.hasNextPage,
            isLoading: false,
          });
          setFilteredPRs([]);
        } catch (error) {
          console.error("Failed to fetch pull requests:", error);
          setPullRequests(prev => ({ ...prev, isLoading: false }));
        }
        break;
    }
  };

  const loadMore = async (
    type: "issues" | "pullRequests" | "releases" | "commits",
    state: ActivityState,
    setState: (state: ActivityState) => void
  ) => {
    if (!selectedRepo || !session?.accessToken) return;

    setState({ ...state, isLoading: true });
    const github = new GitHubAPI(session.accessToken);
    const [owner, repo] = selectedRepo.full_name.split("/");
    const nextPage = state.page + 1;

    try {
      let response;
      switch (type) {
        case "issues":
          // Get the current filter value from the dialog
          const issueState = document.querySelector('[data-state-filter="issues"]') as HTMLSelectElement;
          response = await github.getIssues(
            owner, 
            repo, 
            nextPage, 
            11, 
            (issueState?.value || "open") as "open" | "closed"
          );
          break;
        case "pullRequests":
          response = await github.getPullRequests(owner, repo, nextPage, 11);
          break;
        case "releases":
          response = await github.getReleases(owner, repo, nextPage, 11);
          break;
        case "commits":
          response = await github.getCommits(owner, repo, nextPage, 11);
          break;
      }

      if (response) {
        setState({
          data: [...state.data, ...response.data.slice(0, 10)],
          page: nextPage,
          hasNextPage: response.data.length > 10,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Error loading more items:", error);
      setState({ ...state, isLoading: false });
    }
  };

  const handleSearch = async () => {
    if (!session?.accessToken || !searchQuery) return;

    setIsSearching(true);
    try {
      const github = new GitHubAPI(session.accessToken);
      const results = await github.searchRepositories(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Failed to search repositories:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrackRepository = (repo: Repository) => {
    if (!trackedRepos.find((r) => r.id === repo.id)) {
      setTrackedRepos([...trackedRepos, repo]);
    }
    setSelectedRepo(repo);
  };

  const handleRemoveRepository = (repoToRemove: Repository) => {
    setTrackedRepos(trackedRepos.filter((repo) => repo.id !== repoToRemove.id));
    if (selectedRepo?.id === repoToRemove.id) {
      setSelectedRepo(null);
      setIssues({ data: [], page: 1, hasNextPage: false, isLoading: false });
      setPullRequests({ data: [], page: 1, hasNextPage: false, isLoading: false });
      setReleases({ data: [], page: 1, hasNextPage: false, isLoading: false });
      setCommits({ data: [], page: 1, hasNextPage: false, isLoading: false });
    }
  };

  const handleSearchDialog = async (type: "issues" | "pullRequests" | "releases" | "commits", query: string) => {
    if (!selectedRepo || !session?.accessToken || !query) {
      // Reset filtered data when query is empty
      switch (type) {
        case "issues":
          setFilteredIssues([]);
          break;
        case "pullRequests":
          setFilteredPRs([]);
          break;
        case "releases":
          setFilteredReleases([]);
          break;
        case "commits":
          setFilteredCommits([]);
          break;
      }
      return;
    }

    // Set loading state
    switch (type) {
      case "issues":
        setIssues(prev => ({ ...prev, isLoading: true }));
        break;
      case "pullRequests":
        setPullRequests(prev => ({ ...prev, isLoading: true }));
        break;
      case "releases":
        setReleases(prev => ({ ...prev, isLoading: true }));
        break;
      case "commits":
        setCommits(prev => ({ ...prev, isLoading: true }));
        break;
    }

    try {
      const github = new GitHubAPI(session.accessToken);
      const [owner, repo] = selectedRepo.full_name.split("/");
      let response;

      switch (type) {
        case "issues":
          response = await github.searchIssues(owner, repo, query);
          setFilteredIssues(response.data);
          setIssues(prev => ({ 
            ...prev, 
            hasNextPage: response.hasNextPage,
            isLoading: false 
          }));
          break;

        case "pullRequests":
          response = await github.searchPullRequests(owner, repo, query);
          setFilteredPRs(response.data);
          setPullRequests(prev => ({ 
            ...prev, 
            hasNextPage: response.hasNextPage,
            isLoading: false 
          }));
          break;

        case "releases":
          response = await github.searchReleases(owner, repo, query);
          setFilteredReleases(response.data);
          setReleases(prev => ({ 
            ...prev, 
            hasNextPage: response.hasNextPage,
            isLoading: false 
          }));
          break;

        case "commits":
          response = await github.searchCommits(owner, repo, query);
          setFilteredCommits(response.data);
          setCommits(prev => ({ 
            ...prev, 
            hasNextPage: response.hasNextPage,
            isLoading: false 
          }));
          break;
      }
    } catch (error) {
      console.error(`Failed to search ${type}:`, error);
      // Reset loading state and filtered data on error
      switch (type) {
        case "issues":
          setIssues(prev => ({ ...prev, isLoading: false }));
          setFilteredIssues([]);
          break;
        case "pullRequests":
          setPullRequests(prev => ({ ...prev, isLoading: false }));
          setFilteredPRs([]);
          break;
        case "releases":
          setReleases(prev => ({ ...prev, isLoading: false }));
          setFilteredReleases([]);
          break;
        case "commits":
          setCommits(prev => ({ ...prev, isLoading: false }));
          setFilteredCommits([]);
          break;
      }
    }
  };

  const handleLabelSelect = (type: "issues" | "pullRequests", label: string) => {
    switch (type) {
      case "issues":
        setFilteredIssues(
          issues.data.filter((issue) => {
            if (label === "all") return true;
            return issue.labels.some((l: any) => l.name === label);
          })
        );
        break;
      case "pullRequests":
        setFilteredPRs(
          pullRequests.data.filter((pr) => {
            if (label === "all") return true;
            return pr.labels.some((l: any) => l.name === label);
          })
        );
        break;
    }
  };

  const ActivityList = ({
    title,
    items,
    state,
    type,
    onLoadMore,
    renderItem,
  }: {
    title: React.ReactNode;
    items: any[];
    state: ActivityState;
    type: "issues" | "pullRequests" | "releases" | "commits";
    onLoadMore: () => void;
    renderItem: (item: any) => React.ReactNode;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal text-muted-foreground">
              {items.length} {type === "pullRequests" ? "pull requests" : type}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpenDialog(type)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[340px]">
          <div className="space-y-2 pr-4">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No {type}
              </p>
            ) : (
              <>
                <div className="space-y-2">{items.map(renderItem)}</div>
                {state.hasNextPage && items.length < 100 && (
                  <div className="flex justify-center mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onLoadMore}
                      disabled={state.isLoading}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                    >
                      {state.isLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-3 w-3" />
                          Load more
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-muted-foreground">
          Track your favorite repositories and stay updated with their activities.
        </p>
      </div>

      {/* Search and Add Repository */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Your Repositories</h2>
        <div className="flex items-center gap-2">
          {trackedRepos.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
              <span className="sr-only">
                {isMinimized ? "Expand repositories" : "Minimize repositories"}
              </span>
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Add Repository</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] max-h-[85vh]">
              <DialogHeader>
                <DialogTitle>Add Repository</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search repositories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <ScrollArea className="h-[60vh] w-full pr-4">
                  <div className="grid gap-4 min-w-0">
                    {searchResults.map((repo) => (
                      <div key={repo.id} className="min-w-0">
                        <RepositoryCard
                          repository={repo}
                          onSelect={() => {
                            handleTrackRepository(repo);
                            const dialogClose = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
                            if (dialogClose) dialogClose.click();
                          }}
                        />
                      </div>
                    ))}
                    {searchResults.length === 0 && searchQuery && !isSearching && (
                      <div className="text-center py-8 text-muted-foreground">
                        No repositories found for "{searchQuery}"
                      </div>
                    )}
                    {isSearching && (
                      <div className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Searching repositories...
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tracked Repositories */}
      {trackedRepos.length === 0 ? (
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">
              No repositories tracked yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start by adding repositories you want to monitor
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {trackedRepos.map((repo) => (
            <RepositoryCard
              key={repo.id}
              repository={repo}
              onSelect={() => setSelectedRepo(repo)}
              onRemove={() => handleRemoveRepository(repo)}
              isTracked={true}
              isMinimized={isMinimized}
            />
          ))}
        </div>
      )}

      {/* Selected Repository Details */}
      {selectedRepo && (
        <>
          <h2 className="text-2xl font-semibold tracking-tight mt-12 mb-6">
            Activity for {selectedRepo.full_name}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Commits */}
            <ActivityList
              title={
                <div className="flex items-center justify-between">
                  <span>Recent Commits</span>
                  <a
                    href={`${selectedRepo.html_url}/commits`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-muted"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              }
              items={commits.data}
              state={commits}
              type="commits"
              onLoadMore={() => loadMore("commits", commits, setCommits)}
              renderItem={(commit: Commit) => {
                const title = commit.commit.message.split('\n')[0].trim();
                const authorName = commit.author?.login || commit.commit.author.name || 'Unknown';
                const avatarUrl = commit.author?.avatar_url || 'https://github.com/identicons/default.png';

                return (
                  <a
                    key={commit.sha}
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 hover:bg-muted rounded-lg transition-colors h-[60px]"
                  >
                    <div className="flex items-start gap-2">
                      <img
                        src={avatarUrl}
                        alt={authorName}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-1">
                          {title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{authorName}</span>
                          <span>•</span>
                          <span>{getTimeAgo(commit.commit.author.date)}</span>
                          <span>•</span>
                          <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{commit.sha.substring(0, 7)}</code>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              }}
            />

            {/* Only show Issues card if issues are enabled */}
            {selectedRepo.has_issues && (
              <ActivityList
                title={
                  <div className="flex items-center justify-between">
                    <span>Open Issues</span>
                    <a
                      href={`${selectedRepo.html_url}/issues`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-muted"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                }
                items={issues.data}
                state={issues}
                type="issues"
                onLoadMore={() => loadMore("issues", issues, setIssues)}
                renderItem={(issue: Issue) => (
                  <a
                    key={issue.id}
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 hover:bg-muted rounded-lg transition-colors h-[60px]"
                  >
                    <div className="flex items-start gap-2">
                      <img
                        src={issue.user.avatar_url}
                        alt={issue.user.login}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-1">
                          {issue.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{issue.user.login}</span>
                          <span>•</span>
                          <span>{getTimeAgo(issue.created_at)}</span>
                          <span>•</span>
                          <span>#{issue.number}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                )}
              />
            )}

            {/* Only show Pull Requests card if PRs are enabled */}
            {!selectedRepo.archived && (
              <ActivityList
                title={
                  <div className="flex items-center justify-between">
                    <span>Pull Requests</span>
                    <a
                      href={`${selectedRepo.html_url}/pulls`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-muted"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                }
                items={pullRequests.data}
                state={pullRequests}
                type="pullRequests"
                onLoadMore={() => loadMore("pullRequests", pullRequests, setPullRequests)}
                renderItem={(pr: PullRequest) => (
                  <a
                    key={pr.id}
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 hover:bg-muted rounded-lg transition-colors h-[60px]"
                  >
                    <div className="flex items-start gap-2">
                      <img
                        src={pr.user.avatar_url}
                        alt={pr.user.login}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-1">
                          {pr.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{pr.user.login}</span>
                          <span>•</span>
                          <span>{getTimeAgo(pr.created_at)}</span>
                          <span>•</span>
                          <span>#{pr.number}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                )}
              />
            )}

            {/* Only show Releases card if releases are enabled */}
            {selectedRepo.has_releases !== false && (
              <ActivityList
                title={
                  <div className="flex items-center justify-between">
                    <span>Recent Releases</span>
                    <a
                      href={`${selectedRepo.html_url}/releases`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-muted"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                }
                items={releases.data}
                state={releases}
                type="releases"
                onLoadMore={() => loadMore("releases", releases, setReleases)}
                renderItem={(release: Release) => (
                  <a
                    key={release.id}
                    href={release.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 hover:bg-muted rounded-lg transition-colors h-[60px]"
                  >
                    <div className="flex items-start gap-2">
                      <img
                        src={release.author.avatar_url}
                        alt={release.author.login}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-1">
                          {release.name || release.tag_name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{release.author.login}</span>
                          <span>•</span>
                          <span>{getTimeAgo(release.published_at)}</span>
                          <span>•</span>
                          <span>{release.tag_name}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                )}
              />
            )}
          </div>
        </>
      )}
      {/* Repository Analytics */}
      {selectedRepo && (
        <div className={cn(
          "mt-8",
          isMinimized ? "mt-4" : "mt-8"
        )}>
          <RepositoryAnalytics
            repository={selectedRepo}
            accessToken={session?.accessToken || ""}
          />
        </div>
      )}
      {/* Activity Dialogs */}
      <ActivityDialog
        title="Open Issues"
        isOpen={openDialog === "issues"}
        onClose={() => setOpenDialog(null)}
        type="issues"
        data={filteredIssues.length > 0 ? filteredIssues : issues.data}
        labels={issueLabels}
        isLoading={issues.isLoading}
        hasNextPage={issues.hasNextPage}
        onSearch={(query) => handleSearchDialog("issues", query)}
        onFilter={(filter) => handleFilter("issues", filter)}
        onLabelSelect={(label) => handleLabelSelect("issues", label)}
        onLoadMore={() => loadMore("issues", issues, setIssues)}
      />

      <ActivityDialog
        title="Pull Requests"
        isOpen={openDialog === "pullRequests"}
        onClose={() => setOpenDialog(null)}
        type="pullRequests"
        data={filteredPRs.length > 0 ? filteredPRs : pullRequests.data}
        labels={prLabels}
        isLoading={pullRequests.isLoading}
        hasNextPage={pullRequests.hasNextPage}
        onSearch={(query) => handleSearchDialog("pullRequests", query)}
        onFilter={(filter) => handleFilter("pullRequests", filter)}
        onLabelSelect={(label) => handleLabelSelect("pullRequests", label)}
        onLoadMore={() => loadMore("pullRequests", pullRequests, setPullRequests)}
      />

      <ActivityDialog
        title="Recent Releases"
        isOpen={openDialog === "releases"}
        onClose={() => setOpenDialog(null)}
        type="releases"
        data={filteredReleases.length > 0 ? filteredReleases : releases.data}
        isLoading={releases.isLoading}
        hasNextPage={releases.hasNextPage}
        onSearch={(query) => handleSearchDialog("releases", query)}
        onLoadMore={() => loadMore("releases", releases, setReleases)}
      />

      <ActivityDialog
        title="Recent Commits"
        isOpen={openDialog === "commits"}
        onClose={() => setOpenDialog(null)}
        type="commits"
        data={filteredCommits.length > 0 ? filteredCommits : commits.data}
        isLoading={commits.isLoading}
        hasNextPage={commits.hasNextPage}
        onSearch={(query) => handleSearchDialog("commits", query)}
        onLoadMore={() => loadMore("commits", commits, setCommits)}
      />
    </div>
  );
}
