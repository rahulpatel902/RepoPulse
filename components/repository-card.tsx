"use client";

import { Repository } from "@/lib/github";
import { Card, CardContent } from "@/components/ui/card";
import { Star, GitFork, X, ExternalLink, Globe, Link2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RepositoryCardProps {
  repository: Repository;
  onSelect?: () => void;
  onRemove?: () => void;
  isTracked?: boolean;
  isMinimized?: boolean;
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

export function RepositoryCard({
  repository,
  onSelect,
  onRemove,
  isTracked = false,
  isMinimized = false,
}: RepositoryCardProps) {
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
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <img
              src={repository.owner.avatar_url}
              alt={repository.owner.login}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold leading-none truncate">
                {repository.full_name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>by {repository.owner.login}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {repository.private ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Globe className="w-3.5 h-3.5" />
                  )}
                  <span>{repository.private ? "Private" : "Public"}</span>
                </div>
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
            {isTracked && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            )}
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
      {isTracked && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      )}
      <CardContent className="pt-6">
        <div className="space-y-2">
          {/* Header with avatar and name */}
          <div className="flex items-start gap-3 mb-2">
            <img
              src={repository.owner.avatar_url}
              alt={repository.owner.login}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold leading-none truncate">
                {repository.full_name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <span>by {repository.owner.login}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {repository.private ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Globe className="w-3.5 h-3.5" />
                  )}
                  <span>{repository.private ? "Private" : "Public"}</span>
                </div>
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
            {repository.description || "No description provided"}
          </p>

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
                      <GitFork className="h-4 w-4" />
                      <span>{repository.forks_count.toLocaleString()}</span>
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
