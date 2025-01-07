import { Octokit } from "@octokit/rest";

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    url: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  master_branch?: string;
  default_branch: string;
  score?: number;
  archived: boolean;
  has_issues: boolean;
  has_releases?: boolean;
  topics: string[];
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: {
    name: string;
    color: string;
    description?: string;
  }[];
  body?: string;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: {
    name: string;
    color: string;
    description?: string;
  }[];
  body?: string;
}

export interface Release {
  id: number;
  name: string;
  tag_name: string;
  created_at: string;
  published_at: string;
  html_url: string;
  body: string;
  author: {
    login: string;
    avatar_url: string;
  };
}

export interface Commit {
  sha: string;
  html_url: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  };
}

export class GitHubAPI {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  async searchRepositories(query: string): Promise<Repository[]> {
    const { data } = await this.octokit.search.repos({
      q: query,
      sort: "updated",
      per_page: 10,
    });
    return data.items as Repository[];
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    const { data } = await this.octokit.repos.get({
      owner,
      repo,
    });
    return data as Repository;
  }

  async getIssues(
    owner: string,
    repo: string,
    page: number = 1,
    per_page: number = 10
  ): Promise<{ data: Issue[]; hasNextPage: boolean }> {
    // Fetch current page
    const { data } = await this.octokit.issues.listForRepo({
      owner,
      repo,
      state: "open",
      page,
      per_page: per_page * 3, // Fetch triple the amount to ensure we have enough after filtering
    });
    
    // Filter out pull requests
    const issues = data.filter((issue: any) => !issue.pull_request);
    
    // Take only the amount we need
    const paginatedIssues = issues.slice(0, per_page);
    
    // Check for next page
    const nextPageResponse = await this.octokit.issues.listForRepo({
      owner,
      repo,
      state: "open",
      page: page + 1,
      per_page: 30, // Fetch enough to check if there are more non-PR issues
    });
    
    const nextPageIssues = nextPageResponse.data.filter((issue: any) => !issue.pull_request);
    const hasNextPage = nextPageIssues.length > 0;
    
    // If we don't have enough issues in current page, get more from next page
    if (paginatedIssues.length < per_page && hasNextPage) {
      const remainingNeeded = per_page - paginatedIssues.length;
      const additionalIssues = nextPageIssues.slice(0, remainingNeeded);
      return {
        data: [...paginatedIssues, ...additionalIssues] as Issue[],
        hasNextPage: nextPageIssues.length > remainingNeeded,
      };
    }
    
    return {
      data: paginatedIssues as Issue[],
      hasNextPage,
    };
  }

  async getPullRequests(
    owner: string,
    repo: string,
    page: number = 1,
    per_page: number = 10
  ): Promise<{ data: PullRequest[]; hasNextPage: boolean }> {
    const { data } = await this.octokit.pulls.list({
      owner,
      repo,
      state: "open",
      page,
      per_page,
    });
    
    // Check if there's a next page by fetching one more item
    const nextPage = await this.octokit.pulls.list({
      owner,
      repo,
      state: "open",
      page: page + 1,
      per_page: 1,
    });
    
    return {
      data: data as PullRequest[],
      hasNextPage: nextPage.data.length > 0,
    };
  }

  async getReleases(
    owner: string,
    repo: string,
    page: number = 1,
    per_page: number = 10
  ): Promise<{ data: Release[]; hasNextPage: boolean }> {
    const { data } = await this.octokit.repos.listReleases({
      owner,
      repo,
      page,
      per_page,
    });
    
    // Check if there's a next page by fetching one more item
    const nextPage = await this.octokit.repos.listReleases({
      owner,
      repo,
      page: page + 1,
      per_page: 1,
    });
    
    return {
      data: data as Release[],
      hasNextPage: nextPage.data.length > 0,
    };
  }

  async getCommits(
    owner: string,
    repo: string,
    page: number = 1,
    per_page: number = 10
  ): Promise<{ data: Commit[]; hasNextPage: boolean }> {
    const { data } = await this.octokit.repos.listCommits({
      owner,
      repo,
      page,
      per_page,
    });
    
    // Check if there's a next page by fetching one more item
    const nextPage = await this.octokit.repos.listCommits({
      owner,
      repo,
      page: page + 1,
      per_page: 1,
    });
    
    return {
      data: data as Commit[],
      hasNextPage: nextPage.data.length > 0,
    };
  }
}
