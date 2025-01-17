"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Search, Filter, Loader2, Tag, Clock, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityDialogProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  type: "issues" | "pullRequests" | "releases" | "commits";
  data: any[];
  labels?: string[];
  isLoading?: boolean;
  hasNextPage?: boolean;
  onSearch: (query: string) => void;
  onFilter?: (filter: string) => void;
  onLabelSelect?: (label: string) => void;
  onLoadMore?: () => void;
}

export function ActivityDialog({
  title,
  isOpen,
  onClose,
  type,
  data,
  labels = [],
  isLoading = false,
  hasNextPage = false,
  onSearch,
  onFilter,
  onLabelSelect,
  onLoadMore,
}: ActivityDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"open" | "closed">("open");
  const [selectedLabel, setSelectedLabel] = useState("all");

  const handleSearch = () => {
    if (type === "commits") {
      setSelectedFilter("open");
      setSelectedLabel("all");
    }
    onSearch(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleFilterChange = (value: "open" | "closed") => {
    setSelectedFilter(value);
    onFilter?.(value);
  };

  const handleLabelChange = (value: string) => {
    setSelectedLabel(value);
    onLabelSelect?.(value);
  };

  function formatActivityDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    // If created today and less than 24 hours ago, show relative time
    if (hours < 24 && date.getDate() === now.getDate()) {
      if (minutes < 60) return `${minutes}m ago`;
      return `${hours}h ago`;
    }

    // Format the date based on the year
    const isCurrentYear = date.getFullYear() === now.getFullYear();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: isCurrentYear ? undefined : '2-digit'
    });
  }

  const renderContent = () => {
    switch (type) {
      case "issues":
        return (
          <div className="space-y-4">
            {data.map((issue: any) => (
              <a
                key={issue.id}
                href={issue.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={issue.user.avatar_url}
                    alt={issue.user.login}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm sm:text-base line-clamp-2">{issue.title}</h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {issue.labels.map((label: any) => (
                        <Badge
                          key={label.id}
                          style={{
                            backgroundColor: `#${label.color}`,
                            color: getContrastColor(label.color),
                          }}
                          className="text-xs px-1.5 py-0.5"
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      #{issue.number} • {formatActivityDate(issue.created_at)} • {issue.user.login}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        );

      case "pullRequests":
        return (
          <div className="space-y-4">
            {data.map((pr: any) => (
              <a
                key={pr.id}
                href={pr.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={pr.user.avatar_url}
                    alt={pr.user.login}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm sm:text-base line-clamp-2">{pr.title}</h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {pr.labels.map((label: any) => (
                        <Badge
                          key={label.id}
                          style={{
                            backgroundColor: `#${label.color}`,
                            color: getContrastColor(label.color),
                          }}
                          className="text-xs px-1.5 py-0.5"
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      #{pr.number} • {formatActivityDate(pr.created_at)} • {pr.user.login}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        );

      case "releases":
        return (
          <div className="space-y-4">
            {data.map((release: any, index: number) => (
              <a
                key={release.id}
                href={release.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={release.author.avatar_url}
                    alt={release.author.login}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm sm:text-base line-clamp-1">
                        {release.name || release.tag_name}
                      </h4>
                      {index === 0 && (
                        <Badge variant="default" className="bg-green-500 text-xs">
                          Latest
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      {release.tag_name} • {formatActivityDate(release.published_at)} • {release.author.login}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        );

      case "commits":
        return (
          <div className="space-y-4">
            {data.map((commit: any) => {
              // Split commit message into title and description
              const [title, ...descriptionLines] = commit.commit.message.split('\n').map((line: string) => line.trim());
              const filteredDescLines = descriptionLines.filter((line: string) => line.length > 0);
              const hasMoreLines = filteredDescLines.length > 2;
              const description = filteredDescLines.slice(0, 2).join('\n');
              
              // Handle null author cases
              const authorName = commit.author?.login || commit.commit.author.name || 'Unknown';
              const avatarUrl = commit.author?.avatar_url || 'https://github.com/identicons/default.png';

              return (
                <a
                  key={commit.sha}
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={avatarUrl}
                      alt={authorName}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base line-clamp-2">{title}</h4>
                      {description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {description}
                          {hasMoreLines && (
                            <span className="text-xs text-primary ml-1">...</span>
                          )}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-muted-foreground">
                        <span className="font-medium">{authorName}</span>
                        <span>•</span>
                        <span>{formatActivityDate(commit.commit.author.date)}</span>
                        <span>•</span>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {commit.sha.substring(0, 7)}
                        </code>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 border-b shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                size="icon"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {onFilter && (
              <Select 
                value={selectedFilter} 
                onValueChange={handleFilterChange}
                data-state-filter="issues"
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            )}
            {labels.length > 0 && (
              <Select value={selectedLabel} onValueChange={handleLabelChange}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Tag className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Labels</SelectItem>
                  {labels.map((label) => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6 space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-sm text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <p>No items found</p>
                </div>
              ) : (
                <>
                  {renderContent()}
                  {(hasNextPage || isLoading) && (
                    <div className="pt-4">
                      {hasNextPage && !isLoading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onLoadMore}
                          className="w-full h-8 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                          Load more
                        </Button>
                      )}
                      {isLoading && (
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading...
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to determine text color based on background
function getContrastColor(hexcolor: string) {
  const r = parseInt(hexcolor.slice(0, 2), 16);
  const g = parseInt(hexcolor.slice(2, 4), 16);
  const b = parseInt(hexcolor.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}
