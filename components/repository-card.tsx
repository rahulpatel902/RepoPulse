"use client";

import { Repository } from "@/lib/github";
import { Card, CardContent } from "@/components/ui/card";
import { Star, GitFork, X, ExternalLink, Globe, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RepositoryCardProps {
  repository: Repository;
  onSelect?: () => void;
  onRemove?: () => void;
  isTracked?: boolean;
}

export function RepositoryCard({
  repository,
  onSelect,
  onRemove,
  isTracked = false,
}: RepositoryCardProps) {
  const handleExternalClick = (e: React.MouseEvent, url: string | null) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank');
    }
  };

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
        <div className="space-y-4">
          {/* Header with avatar and name */}
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
              <p className="text-sm text-muted-foreground mt-1">
                by {repository.owner.login}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {repository.description || "No description provided"}
          </p>

          {/* Topics */}
          {repository.topics && repository.topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {repository.topics.slice(0, 4).map((topic) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="text-xs"
                >
                  {topic}
                </Badge>
              ))}
              {repository.topics.length > 4 && (
                <Badge
                  variant="secondary"
                  className="text-xs"
                >
                  +{repository.topics.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Stats and links */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
