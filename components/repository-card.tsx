"use client";

import { Repository, Branch, GitHubAPI } from "@/lib/github";
import { Card, CardContent } from "@/components/ui/card";
import { Star, GitFork, X, ExternalLink, Globe, Link2, Lock, Activity, CheckCircle2, GitBranch, Loader2, GitMerge, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

interface RepositoryCardProps {
  repository: Repository;
  onSelect?: () => void;
  onRemove?: () => void;
  isTracked?: boolean;
  isMinimized?: boolean;
  isSelected?: boolean;
  accessToken?: string;
}

// Helper function to determine text color based on background
function getContrastColor(hexcolor: string) {
  const r = parseInt(hexcolor.slice(0, 2), 16);
  const g = parseInt(hexcolor.slice(2, 4), 16);
  const b = parseInt(hexcolor.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

// Helper function to get language color
function getLanguageColor(language: string): string {
  const colors: { [key: string]: string } = {
    "JavaScript": "#f1e05a",
    "TypeScript": "#3178c6",
    "Python": "#3572A5",
    "Java": "#b07219",
    "C++": "#f34b7d",
    "C#": "#178600",
    "PHP": "#4F5D95",
    "Ruby": "#701516",
    "Go": "#00ADD8",
    "Rust": "#dea584",
    "Swift": "#ffac45",
    "Kotlin": "#A97BFF",
    "Dart": "#00B4AB",
    "HTML": "#e34c26",
    "CSS": "#563d7c",
    "Shell": "#89e051",
    "Vue": "#41b883",
    "React": "#61dafb",
  };
  return colors[language] || "#858585";
}

// Helper function to format the time difference
function getTimeAgo(date: string) {
  const now = new Date();
  const updatedAt = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - updatedAt.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'yesterday';
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  return updatedAt.toLocaleDateString('en-US', { 
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function RepositoryCard({
  repository,
  onSelect,
  onRemove,
  isTracked = false,
  isMinimized = false,
  isSelected = false,
  accessToken,
}: RepositoryCardProps) {
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(repository.default_branch);
  const [open, setOpen] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!accessToken) {
        setError('No access token available');
        return;
      }
      
      setIsLoadingBranches(true);
      setError(null);
      try {
        const github = new GitHubAPI(accessToken);
        const [owner, repo] = repository.full_name.split('/');
        const branchData = await github.getBranches(owner, repo);
        console.log('Fetched branches:', branchData); // Debug log
        setBranches(branchData);
      } catch (error) {
        console.error('Error fetching branches:', error);
        setError('Failed to fetch branches');
      } finally {
        setIsLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [repository.full_name, accessToken]);

  // Sort branches with default branch at top, then by activity
  const sortedBranches = useMemo(() => {
    if (!branches.length) return [];
    
    const defaultBranch = branches.filter(b => b.name === repository.default_branch);
    const otherBranches = branches
      .filter(b => b.name !== repository.default_branch)
      .sort((a, b) => {
        // Sort by last commit date (most recent first)
        const dateA = a.lastCommit?.date ? new Date(a.lastCommit.date).getTime() : 0;
        const dateB = b.lastCommit?.date ? new Date(b.lastCommit.date).getTime() : 0;
        return dateB - dateA;
      });
    
    return [...defaultBranch, ...otherBranches];
  }, [branches, repository.default_branch]);

  useEffect(() => {
    const checkTruncation = () => {
      if (titleRef.current) {
        setIsTitleTruncated(titleRef.current.scrollWidth > titleRef.current.clientWidth);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [repository.full_name]);

  const handleExternalClick = (e: React.MouseEvent, url: string | null) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (isMinimized) {
    return (
      <Card
        className={cn(
          "transition-colors hover:bg-muted/50 cursor-pointer group relative",
          onSelect && "hover:border-primary"
        )}
        onClick={onSelect}
      >
        {isSelected && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 -translate-y-1/2 right-4 md:group-hover:right-12 md:right-4 transition-all duration-200 h-8 w-8 text-primary right-12"
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-1/2 -translate-y-1/2 right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-8 w-8 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <img
              src={repository.owner.avatar_url}
              alt={repository.owner.login}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col w-full">
                <h3 className="font-semibold truncate h-[20px] w-full" ref={titleRef}>
                  {isTitleTruncated ? (
                    <>
                      <span className="hidden md:inline">{repository.full_name}</span>
                      <span className="md:hidden">{repository.name}</span>
                    </>
                  ) : (
                    repository.full_name
                  )}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  {repository.private ? (
                    <Lock className="w-3.5 h-3.5 -mt-[1px]" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 -mt-[1px]" />
                  )}
                  <span>{repository.private ? "Private" : "Public"}</span>
                </div>
                <span>•</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Activity className="w-4 h-4 text-primary animate-pulse -mt-[1px]" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Last updated: {getTimeAgo(repository.pushed_at)}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {repository.language && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: getLanguageColor(repository.language) }}
                      />
                      <span>{repository.language}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "transition-colors hover:bg-muted/50 cursor-pointer group relative",
        onSelect && "hover:border-primary"
      )}
      onClick={onSelect}
    >
      {isSelected && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 md:group-hover:right-12 md:right-4 transition-all duration-200 h-8 w-8 text-primary right-12"
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      )}
      {isTracked && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-4 right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-8 w-8 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <CardContent className="pt-6">
        <div className="space-y-2">
          {/* Header with avatar and name */}
          <div className="flex items-center gap-3 mb-2">
            <img
              src={repository.owner.avatar_url}
              alt={repository.owner.login}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col w-full">
                <h3 className="font-semibold truncate h-[20px] w-full" ref={titleRef}>
                  {isTitleTruncated ? (
                    <>
                      <span className="hidden md:inline">{repository.full_name}</span>
                      <span className="md:hidden">{repository.name}</span>
                    </>
                  ) : (
                    repository.full_name
                  )}
                </h3>
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {repository.private ? (
                    <Lock className="w-3.5 h-3.5 -mt-[1px]" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 -mt-[1px]" />
                  )}
                  <span>{repository.private ? "Private" : "Public"}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary animate-pulse -mt-[1px]" />
                  <span>{getTimeAgo(repository.pushed_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="text-sm text-muted-foreground line-clamp-1 mb-2">
            {repository.description || "No description provided"}
          </div>

          {/* Topics */}
          <div className="flex flex-wrap gap-1.5 overflow-hidden h-6 mb-2">
            {repository.topics && repository.topics.length > 0 ? (
              <>
                {repository.topics.slice(0, 4).map((topic) => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="text-xs px-2 py-0.5 bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    {topic}
                  </Badge>
                ))}
                {repository.topics.length > 4 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-0.5 bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    +{repository.topics.length - 4} more
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No topics provided</span>
            )}
          </div>

          {/* Stats and links */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {repository.language && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getLanguageColor(repository.language) }}
                        />
                        <span>{repository.language}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Primary Language</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      <span>{repository.stargazers_count}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Stars</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <GitFork className="w-4 h-4" />
                      <span>{repository.forks_count}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Forks</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Popover open={open} onOpenChange={setOpen}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          {selectedBranch === repository.default_branch ? (
                            <GitMerge className="h-4 w-4" />
                          ) : (
                            <GitBranch className="h-4 w-4" />
                          )}
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Branches</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <PopoverContent className="w-[300px] p-0 overflow-hidden" align="start">
                  <Command className="overflow-hidden">
                    <CommandInput 
                      placeholder="Search branches..." 
                      className="border-none focus:ring-0 h-9"
                    />
                    <CommandEmpty className="py-2 px-2 text-sm">No branches found.</CommandEmpty>
                    <div 
                      className="max-h-[300px] overflow-auto [scrollbar-width:thin] [scrollbar-color:rgb(0_0_0_/_0.2)_transparent] hover:[scrollbar-color:rgb(0_0_0_/_0.3)_transparent]"
                      style={{
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'thin',
                      }}
                    >
                      <style jsx>{`
                        div::-webkit-scrollbar {
                          width: 8px;
                          background: transparent;
                        }
                        div::-webkit-scrollbar-thumb {
                          background-color: rgb(0 0 0 / 0.2);
                          border-radius: 9999px;
                          border: 2px solid transparent;
                          background-clip: content-box;
                        }
                        div::-webkit-scrollbar-thumb:hover {
                          background-color: rgb(0 0 0 / 0.3);
                        }
                        div::-webkit-scrollbar-track {
                          background: transparent;
                        }
                      `}</style>
                      <CommandGroup>
                        {isLoadingBranches ? (
                          <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <p className="text-sm text-muted-foreground">Loading branches...</p>
                          </div>
                        ) : error ? (
                          <div className="py-6 text-center text-sm text-destructive">
                            <div className="mb-2">
                              <AlertCircle className="h-8 w-8 mx-auto opacity-50" />
                            </div>
                            {error}
                          </div>
                        ) : sortedBranches.length > 0 ? (
                          sortedBranches.map((branch) => (
                            <CommandItem
                              key={branch.name}
                              value={branch.name}
                              onSelect={() => {
                                setSelectedBranch(branch.name);
                                setOpen(false);
                              }}
                              className="flex items-center justify-between py-1.5 px-2"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {branch.name === repository.default_branch ? (
                                  <GitMerge className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                ) : (
                                  <GitBranch className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                )}
                                <span className="truncate text-sm" title={branch.name}>
                                  {branch.name}
                                </span>
                                {branch.lastCommit?.date && (
                                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                                    {getTimeAgo(branch.lastCommit.date)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                {branch.name === repository.default_branch && (
                                  <Badge 
                                    variant="outline" 
                                    className="h-5 text-[10px] font-medium bg-muted/50 border-0"
                                  >
                                    default
                                  </Badge>
                                )}
                                {branch.protected && (
                                  <Badge 
                                    variant="outline" 
                                    className="h-5 text-[10px] font-medium bg-muted/50 border-0"
                                  >
                                    protected
                                  </Badge>
                                )}
                              </div>
                            </CommandItem>
                          ))
                        ) : (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            <div className="mb-2">
                              <GitBranch className="h-8 w-8 mx-auto opacity-50" />
                            </div>
                            No branches available
                          </div>
                        )}
                      </CommandGroup>
                      {sortedBranches.length > 0 && (
                        <div className="p-2 text-xs text-muted-foreground border-t bg-muted/50">
                          {sortedBranches.length} {sortedBranches.length === 1 ? 'branch' : 'branches'} found
                        </div>
                      )}
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              {repository.homepage && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleExternalClick(e, repository.homepage)}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Visit project website</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleExternalClick(e, repository.html_url)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View on GitHub</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
