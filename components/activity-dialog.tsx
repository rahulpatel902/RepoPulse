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
import { Search, Filter, Loader2, Tag, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityDialogProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  type: "issues" | "pullRequests" | "releases" | "commits";
  data: any[];
  labels?: string[];
  isLoading?: boolean;
  onSearch: (query: string) => void;
  onFilter?: (filter: string) => void;
  onLabelSelect?: (label: string) => void;
}

export function ActivityDialog({
  title,
  isOpen,
  onClose,
  type,
  data,
  labels = [],
  isLoading = false,
  onSearch,
  onFilter,
  onLabelSelect,
}: ActivityDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedLabel, setSelectedLabel] = useState("all");

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
    onFilter?.(value);
  };

  const handleLabelChange = (value: string) => {
    setSelectedLabel(value);
    onLabelSelect?.(value);
  };

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
                className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={issue.user.avatar_url}
                    alt={issue.user.login}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{issue.title}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {issue.labels.map((label: any) => (
                        <Badge
                          key={label.id}
                          style={{
                            backgroundColor: `#${label.color}`,
                            color: getContrastColor(label.color),
                          }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      #{issue.number} opened {new Date(issue.created_at).toLocaleDateString()} by{" "}
                      {issue.user.login}
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
                className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={pr.user.avatar_url}
                    alt={pr.user.login}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{pr.title}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pr.labels.map((label: any) => (
                        <Badge
                          key={label.id}
                          style={{
                            backgroundColor: `#${label.color}`,
                            color: getContrastColor(label.color),
                          }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      #{pr.number} opened {new Date(pr.created_at).toLocaleDateString()} by{" "}
                      {pr.user.login}
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
                className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={release.author.avatar_url}
                    alt={release.author.login}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {release.name || release.tag_name}
                      </h4>
                      {index === 0 && (
                        <Badge variant="default" className="bg-green-500">
                          Latest
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Released on {new Date(release.published_at).toLocaleDateString()} by{" "}
                      {release.author.login}
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
              const [title, ...descriptionLines] = commit.commit.message.split('\n').map(line => line.trim());
              const filteredDescLines = descriptionLines.filter(line => line.length > 0);
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
                  className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={avatarUrl}
                      alt={authorName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-base">{title}</h4>
                      {description && (
                        <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                          {description}
                          {hasMoreLines && " ..."}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">{authorName}</span>
                        <span>•</span>
                        <span>committed on {new Date(commit.commit.author.date).toLocaleDateString()} at {new Date(commit.commit.author.date).toLocaleTimeString()}</span>
                        <span>•</span>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{commit.sha.substring(0, 7)}</code>
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
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-8"
                />
              </div>
            </div>
            {type !== "releases" && type !== "commits" && (
              <>
                <Select value={selectedFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedLabel} onValueChange={handleLabelChange}>
                  <SelectTrigger className="w-[150px]">
                    <Tag className="w-4 h-4 mr-2" />
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
              </>
            )}
          </div>

          <ScrollArea className="h-[60vh] pr-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm text-muted-foreground mt-2">Loading...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>No items found</p>
              </div>
            ) : (
              renderContent()
            )}
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
