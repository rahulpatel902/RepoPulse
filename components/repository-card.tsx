"use client";

import { Repository } from "@/lib/github";
import { Card, CardContent } from "@/components/ui/card";
import { Star, GitFork, X, ExternalLink, Globe, Link2, Lock, Activity, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface RepositoryCardProps {
  repository: Repository;
  onSelect?: () => void;
  onRemove?: () => void;
  isTracked?: boolean;
  isMinimized?: boolean;
  isSelected?: boolean;
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
}: RepositoryCardProps) {
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

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
                      <span>{repository.stargazers_count.toLocaleString()}</span>
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
