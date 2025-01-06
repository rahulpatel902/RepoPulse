"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { GitHubAPI, Repository, Issue, PullRequest, Release } from "@/lib/github";
import { RepositoryCard } from "@/components/repository-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2, Maximize2 } from "lucide-react";
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

interface ActivityState {
  data: any[];
  page: number;
  hasNextPage: boolean;
  isLoading: boolean;
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
  const [isSearching, setIsSearching] = useState(false);

  const [openDialog, setOpenDialog] = useState<"issues" | "pullRequests" | "releases" | null>(null);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [filteredPRs, setFilteredPRs] = useState<PullRequest[]>([]);
  const [filteredReleases, setFilteredReleases] = useState<Release[]>([]);
  const [issueLabels, setIssueLabels] = useState<string[]>([]);
  const [prLabels, setPRLabels] = useState<string[]>([]);

  useEffect(() => {
    if (session?.accessToken && selectedRepo) {
      setIssues({ data: [], page: 1, hasNextPage: false, isLoading: true });
      setPullRequests({ data: [], page: 1, hasNextPage: false, isLoading: true });
      setReleases({ data: [], page: 1, hasNextPage: false, isLoading: true });

      const github = new GitHubAPI(session.accessToken);
      const [owner, repo] = selectedRepo.full_name.split("/");

      Promise.all([
        github.getIssues(owner, repo, 1),
        github.getPullRequests(owner, repo, 1),
        github.getReleases(owner, repo, 1),
      ])
        .then(([issuesData, prsData, releasesData]) => {
          setIssues({
            data: issuesData.data,
            page: 1,
            hasNextPage: issuesData.hasNextPage,
            isLoading: false,
          });
          setPullRequests({
            data: prsData.data,
            page: 1,
            hasNextPage: prsData.hasNextPage,
            isLoading: false,
          });
          setReleases({
            data: releasesData.data,
            page: 1,
            hasNextPage: releasesData.hasNextPage,
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

  const loadMore = async (
    type: "issues" | "pullRequests" | "releases",
    currentState: ActivityState,
    setState: (state: ActivityState) => void
  ) => {
    if (!session?.accessToken || !selectedRepo || !currentState.hasNextPage) return;

    setState({ ...currentState, isLoading: true });
    const github = new GitHubAPI(session.accessToken);
    const [owner, repo] = selectedRepo.full_name.split("/");
    const nextPage = currentState.page + 1;

    try {
      let response;
      switch (type) {
        case "issues":
          response = await github.getIssues(owner, repo, nextPage);
          break;
        case "pullRequests":
          response = await github.getPullRequests(owner, repo, nextPage);
          break;
        case "releases":
          response = await github.getReleases(owner, repo, nextPage);
          break;
      }

      setState({
        data: [...currentState.data, ...response.data],
        page: nextPage,
        hasNextPage: response.hasNextPage,
        isLoading: false,
      });
    } catch (error) {
      console.error(`Failed to load more ${type}:`, error);
      setState({ ...currentState, isLoading: false });
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
    }
  };

  const handleSearchDialog = (type: "issues" | "pullRequests" | "releases", query: string) => {
    const searchLower = query.toLowerCase();
    switch (type) {
      case "issues":
        setFilteredIssues(
          issues.data.filter((issue) =>
            issue.title.toLowerCase().includes(searchLower) ||
            issue.body?.toLowerCase().includes(searchLower)
          )
        );
        break;
      case "pullRequests":
        setFilteredPRs(
          pullRequests.data.filter((pr) =>
            pr.title.toLowerCase().includes(searchLower) ||
            pr.body?.toLowerCase().includes(searchLower)
          )
        );
        break;
      case "releases":
        setFilteredReleases(
          releases.data.filter((release) =>
            release.name?.toLowerCase().includes(searchLower) ||
            release.tag_name.toLowerCase().includes(searchLower) ||
            release.body?.toLowerCase().includes(searchLower)
          )
        );
        break;
    }
  };

  const handleFilter = (type: "issues" | "pullRequests", filter: string) => {
    switch (type) {
      case "issues":
        setFilteredIssues(
          issues.data.filter((issue) => {
            if (filter === "all") return true;
            return filter === issue.state;
          })
        );
        break;
      case "pullRequests":
        setFilteredPRs(
          pullRequests.data.filter((pr) => {
            if (filter === "all") return true;
            return filter === pr.state;
          })
        );
        break;
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
    title: string;
    items: any[];
    state: ActivityState;
    type: "issues" | "pullRequests" | "releases";
    onLoadMore: () => void;
    renderItem: (item: any) => React.ReactNode;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal text-muted-foreground">
              {items.length} items
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
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No {title.toLowerCase()}
              </p>
            ) : (
              <>
                <div className="space-y-2">{items.map(renderItem)}</div>
                {state.hasNextPage && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2"
                    onClick={onLoadMore}
                    disabled={state.isLoading}
                  >
                    {state.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Load More
                  </Button>
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          Your Repositories
        </h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Repository
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh]">
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
              <ScrollArea className="h-[60vh] pr-4">
                <div className="grid gap-4">
                  {searchResults.map((repo) => (
                    <RepositoryCard
                      key={repo.id}
                      repository={repo}
                      onSelect={() => {
                        handleTrackRepository(repo);
                        const dialogClose = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
                        if (dialogClose) dialogClose.click();
                      }}
                    />
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

      {/* Tracked Repositories */}
      <div
        className={cn(
          "grid gap-4",
          trackedRepos.length === 0
            ? "place-items-center h-[200px]"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {trackedRepos.length === 0 ? (
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">
              No repositories tracked yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start by adding repositories you want to monitor
            </p>
          </div>
        ) : (
          trackedRepos.map((repo) => (
            <RepositoryCard
              key={repo.id}
              repository={repo}
              onSelect={() => setSelectedRepo(repo)}
              onRemove={() => handleRemoveRepository(repo)}
              isTracked={true}
            />
          ))
        )}
      </div>

      {/* Selected Repository Details */}
      {selectedRepo && (
        <>
          <h2 className="text-2xl font-semibold tracking-tight mt-12 mb-6">
            Activity for {selectedRepo.full_name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Issues */}
            <ActivityList
              title="Open Issues"
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
                  className="block p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={issue.user.avatar_url}
                      alt={issue.user.login}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium line-clamp-1">
                      {issue.title}
                    </span>
                  </div>
                </a>
              )}
            />

            {/* Pull Requests */}
            <ActivityList
              title="Pull Requests"
              items={pullRequests.data}
              state={pullRequests}
              type="pullRequests"
              onLoadMore={() =>
                loadMore("pullRequests", pullRequests, setPullRequests)
              }
              renderItem={(pr: PullRequest) => (
                <a
                  key={pr.id}
                  href={pr.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={pr.user.avatar_url}
                      alt={pr.user.login}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium line-clamp-1">
                      {pr.title}
                    </span>
                  </div>
                </a>
              )}
            />

            {/* Releases */}
            <ActivityList
              title="Recent Releases"
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
                  className="block p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={release.author.avatar_url}
                      alt={release.author.login}
                      className="w-6 h-6 rounded-full"
                    />
                    <div>
                      <div className="text-sm font-medium line-clamp-1">
                        {release.name || release.tag_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(release.published_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </a>
              )}
            />
          </div>
        </>
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
        onSearch={(query) => handleSearchDialog("issues", query)}
        onFilter={(filter) => handleFilter("issues", filter)}
        onLabelSelect={(label) => handleLabelSelect("issues", label)}
      />

      <ActivityDialog
        title="Pull Requests"
        isOpen={openDialog === "pullRequests"}
        onClose={() => setOpenDialog(null)}
        type="pullRequests"
        data={filteredPRs.length > 0 ? filteredPRs : pullRequests.data}
        labels={prLabels}
        isLoading={pullRequests.isLoading}
        onSearch={(query) => handleSearchDialog("pullRequests", query)}
        onFilter={(filter) => handleFilter("pullRequests", filter)}
        onLabelSelect={(label) => handleLabelSelect("pullRequests", label)}
      />

      <ActivityDialog
        title="Recent Releases"
        isOpen={openDialog === "releases"}
        onClose={() => setOpenDialog(null)}
        type="releases"
        data={filteredReleases.length > 0 ? filteredReleases : releases.data}
        isLoading={releases.isLoading}
        onSearch={(query) => handleSearchDialog("releases", query)}
      />
    </div>
  );
}
