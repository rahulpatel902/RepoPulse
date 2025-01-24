export interface Repository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    homepage: string | null;
    stargazers_count: number;
    watchers_count: number;
    forks_count: number;
    open_issues_count: number;
    language: string | null;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    archived: boolean;
    has_wiki: boolean;
    has_issues: boolean;
    has_projects: boolean;
    has_releases: boolean;
    default_branch: string;
    private: boolean;
    topics: string[];
    owner: {
        login: string;
        avatar_url: string;
    };
    license: {
        name: string;
        key: string;
    } | null;
}

export interface Issue {
    id: number;
    number: number;
    title: string;
    state: string;
    created_at: string;
    updated_at: string;
    html_url: string;
    labels: any[];
    user: {
        login: string;
        avatar_url: string;
    };
}

export interface PullRequest {
    id: number;
    number: number;
    title: string;
    state: string;
    created_at: string;
    updated_at: string;
    html_url: string;
    labels: any[];
    user: {
        login: string;
        avatar_url: string;
    };
}

export interface Release {
    id: number;
    tag_name: string;
    name: string;
    created_at: string;
    published_at: string;
    html_url: string;
    author: {
        login: string;
        avatar_url: string;
    };
}

export interface Commit {
    sha: string;
    commit: {
        message: string;
        author: {
            name: string;
            date: string;
        };
    };
    html_url: string;
    author: {
        login: string;
        avatar_url: string;
    } | null;
}

export interface DocumentationStatus {
    name: string;
    status: boolean;
    path: string;
}

export interface RepositoryHealth {
    documentationStatus: DocumentationStatus[];
    hasWiki: boolean;
    hasIssues: boolean;
    hasProjects: boolean;
    defaultBranch: string;
    license: {
        name: string;
        key: string;
    } | null;
}

export interface TimeRangeLimit {
    maxItems: number;
    maxRequests: number;
}

export interface Branch {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
    protected: boolean;
    lastCommit?: {
        date: string;
        count?: number;
    };
}

export const TIME_RANGE_LIMITS: { [key: string]: TimeRangeLimit } = {
    '1': { maxItems: 300, maxRequests: 3 },    // Today
    '2': { maxItems: 300, maxRequests: 3 },    // Yesterday
    '7': { maxItems: 500, maxRequests: 5 },    // This Week
    '14': { maxItems: 700, maxRequests: 7 },   // Last 2 Weeks
    '21': { maxItems: 1000, maxRequests: 10 }, // Last 3 Weeks
    '30': { maxItems: 1500, maxRequests: 15 }, // This Month
    '60': { maxItems: 2000, maxRequests: 20 }, // Last 2 Months
    '90': { maxItems: 2500, maxRequests: 25 }, // Last Quarter
};

export class GitHubAPI {
    private accessToken: string;
    private baseUrl = 'https://api.github.com';
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private getCacheKey(endpoint: string, params: Record<string, string>): string {
        return `${endpoint}?${new URLSearchParams(params).toString()}`;
    }

    private async fetchWithAuth(endpoint: string) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }
        
        return response.json();
    }

    private async fetchWithCache(endpoint: string, params: Record<string, string> = {}) {
        const cacheKey = this.getCacheKey(endpoint, params);
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        const data = await this.fetchWithAuth(`${endpoint}?${new URLSearchParams(params)}`);
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    }

    private async fetchPaginatedBatch(endpoint: string, timeRange: string, params: Record<string, string> = {}) {
        const limits = TIME_RANGE_LIMITS[timeRange];
        if (!limits) {
            throw new Error(`Invalid time range: ${timeRange}`);
        }

        const { maxItems, maxRequests } = limits;
        const perPage = 100; // GitHub's max items per page
        const maxPages = Math.min(Math.ceil(maxItems / perPage), maxRequests);
        
        // Create batch of promises for parallel fetching
        const batchSize = 3; // Fetch 3 pages at a time to avoid rate limits
        const allItems: any[] = [];
        
        for (let batchStart = 1; batchStart <= maxPages; batchStart += batchSize) {
            const batchPromises = [];
            const batchEnd = Math.min(batchStart + batchSize - 1, maxPages);
            
            for (let page = batchStart; page <= batchEnd; page++) {
                const pageParams = {
                    ...params,
                    per_page: perPage.toString(),
                    page: page.toString(),
                };
                batchPromises.push(this.fetchWithCache(endpoint, pageParams));
            }
            
            const batchResults = await Promise.all(batchPromises);
            const items = batchResults.flat();
            
            if (items.length === 0) break;
            
            allItems.push(...items);
            
            if (allItems.length >= maxItems) break;
        }

        return allItems.slice(0, maxItems);
    }

    private async fetchPaginated(endpoint: string, timeRange: string, params: Record<string, string> = {}) {
        const limits = TIME_RANGE_LIMITS[timeRange];
        if (!limits) {
            throw new Error(`Invalid time range: ${timeRange}`);
        }

        const { maxItems, maxRequests } = limits;
        const perPage = 100; // GitHub's max items per page
        const maxPages = Math.min(Math.ceil(maxItems / perPage), maxRequests);
        
        let allItems: any[] = [];
        let page = 1;
        
        while (page <= maxPages && allItems.length < maxItems) {
            const queryParams = new URLSearchParams({
                ...params,
                per_page: perPage.toString(),
                page: page.toString(),
            });

            const items = await this.fetchWithCache(`${endpoint}?${queryParams}`);
            
            if (!items || items.length === 0) break;
            
            allItems = allItems.concat(items);
            page++;
        }

        return allItems.slice(0, maxItems);
    }

    private getDateRangeForTimeRange(timeRange: string): { startDate: Date, endDate: Date } {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        const days = parseInt(timeRange);

        if (timeRange === '1') {
            // Today
            startDate.setHours(0, 0, 0, 0);
        } else if (timeRange === '2') {
            // Yesterday
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
        } else {
            // Other ranges
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);
        }

        return { startDate, endDate };
    }

    async searchRepositories(query: string): Promise<Repository[]> {
        const encodedQuery = encodeURIComponent(query);
        const response = await this.fetchWithCache(`/search/repositories?q=${encodedQuery}&sort=stars&order=desc`);
        return response.items;
    }

    async getRepository(owner: string, repo: string): Promise<Repository> {
        return this.fetchWithCache(`/repos/${owner}/${repo}`);
    }

    async getIssues(owner: string, repo: string, page: number = 1, perPage: number = 10, state: 'open' | 'closed' = 'open') {
        const response = await this.fetchWithCache(
            `/repos/${owner}/${repo}/issues?state=${state}&page=${page}&per_page=${perPage}`
        );
        return {
            data: response,
            hasNextPage: response.length === perPage
        };
    }

    async getPullRequests(owner: string, repo: string, page: number = 1, perPage: number = 10) {
        const response = await this.fetchWithCache(
            `/repos/${owner}/${repo}/pulls?state=all&page=${page}&per_page=${perPage}`
        );
        return {
            data: response,
            hasNextPage: response.length === perPage
        };
    }

    async getReleases(owner: string, repo: string, page: number = 1, perPage: number = 10) {
        const response = await this.fetchWithCache(
            `/repos/${owner}/${repo}/releases?page=${page}&per_page=${perPage}`
        );
        return {
            data: response,
            hasNextPage: response.length === perPage
        };
    }

    async getCommits(owner: string, repo: string, page: number = 1, perPage: number = 10) {
        const response = await this.fetchWithCache(
            `/repos/${owner}/${repo}/commits?page=${page}&per_page=${perPage}`
        );
        return {
            data: response,
            hasNextPage: response.length === perPage
        };
    }

    async getContributors(owner: string, repo: string) {
        return this.fetchWithCache(`/repos/${owner}/${repo}/contributors`);
    }

    async getContributorsInRange(owner: string, repo: string, timeRange: string): Promise<{ login: string; contributions: number }[]> {
        const { startDate, endDate } = this.getDateRangeForTimeRange(timeRange);

        // Get commits in the date range to count unique contributors
        const commits = await this.fetchPaginatedBatch(
            `/repos/${owner}/${repo}/commits`,
            timeRange,
            {
                since: startDate.toISOString(),
                until: endDate.toISOString()
            }
        );

        // Create a map to count contributions per user
        const contributorMap = new Map<string, number>();
        
        for (const commit of commits) {
            if (commit.author) {
                const login = commit.author.login;
                contributorMap.set(login, (contributorMap.get(login) || 0) + 1);
            }
        }

        // Convert map to array and sort by contributions
        const contributors = Array.from(contributorMap.entries()).map(([login, contributions]) => ({
            login,
            contributions
        }));

        return contributors.sort((a, b) => b.contributions - a.contributions);
    }

    async getLanguages(owner: string, repo: string): Promise<{ name: string; percentage: number }[]> {
        const response = await this.fetchWithCache(`/repos/${owner}/${repo}/languages`) as Record<string, number>;
        const total = Object.values(response).reduce((a, b) => a + b, 0);
        return Object.entries(response)
            .map(([name, bytes]) => ({
                name,
                percentage: Number((bytes / total * 100).toFixed(2))
            }))
            .sort((a, b) => b.percentage - a.percentage);
    }

    async getCommitActivity(owner: string, repo: string, timeRange: string): Promise<{ date: string; count: number; total: number }[]> {
        const { startDate, endDate } = this.getDateRangeForTimeRange(timeRange);
        
        // Optimize date range for the query
        const optimizedStartDate = new Date(Math.max(
            startDate.getTime(),
            endDate.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000)
        ));

        const commits = await this.fetchPaginatedBatch(
            `/repos/${owner}/${repo}/commits`,
            timeRange,
            {
                since: optimizedStartDate.toISOString(),
                until: endDate.toISOString(),
            }
        );

        // Use Map for faster lookups
        const commitsByDate = new Map<string, number>();
        commits.forEach((commit: any) => {
            const date = new Date(commit.commit.author.date).toISOString().split('T')[0];
            commitsByDate.set(date, (commitsByDate.get(date) || 0) + 1);
        });

        // Pre-generate dates array for better performance
        const dates: string[] = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]);
        }

        return dates.map(date => ({
            date,
            count: commitsByDate.get(date) || 0,
            total: commits.length
        }));
    }

    async getIssueActivity(owner: string, repo: string, timeRange: string): Promise<{ date: string; opened: number; closed: number; total: number }[]> {
        const { startDate, endDate } = this.getDateRangeForTimeRange(timeRange);
        
        // Optimize by fetching opened and closed issues in parallel with optimized date range
        const optimizedStartDate = new Date(Math.max(
            startDate.getTime(),
            endDate.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000)
        ));

        const [openedIssues, closedIssues] = await Promise.all([
            this.fetchPaginatedBatch(
                `/repos/${owner}/${repo}/issues`,
                timeRange,
                {
                    state: 'all',
                    since: optimizedStartDate.toISOString()
                }
            ),
            this.fetchPaginatedBatch(
                `/repos/${owner}/${repo}/issues`,
                timeRange,
                {
                    state: 'closed',
                    since: optimizedStartDate.toISOString()
                }
            )
        ]);

        // Use Maps for faster lookups
        const issuesByDate = new Map<string, { opened: number; closed: number }>();
        
        // Pre-generate dates array
        const dates: string[] = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const date = d.toISOString().split('T')[0];
            dates.push(date);
            issuesByDate.set(date, { opened: 0, closed: 0 });
        }

        // Process issues in bulk
        openedIssues.forEach((issue: any) => {
            const date = new Date(issue.created_at).toISOString().split('T')[0];
            const current = issuesByDate.get(date) || { opened: 0, closed: 0 };
            current.opened++;
            issuesByDate.set(date, current);
        });

        closedIssues.forEach((issue: any) => {
            const date = new Date(issue.closed_at).toISOString().split('T')[0];
            const current = issuesByDate.get(date) || { opened: 0, closed: 0 };
            current.closed++;
            issuesByDate.set(date, current);
        });

        const total = openedIssues.length + closedIssues.length;
        
        return dates.map(date => {
            const stats = issuesByDate.get(date) || { opened: 0, closed: 0 };
            return {
                date,
                opened: stats.opened,
                closed: stats.closed,
                total
            };
        });
    }

    async getPullRequestActivity(owner: string, repo: string, timeRange: string): Promise<{ date: string; opened: number; closed: number; total: number }[]> {
        const { startDate, endDate } = this.getDateRangeForTimeRange(timeRange);
        
        // Optimize by fetching opened and closed PRs in parallel with optimized date range
        const optimizedStartDate = new Date(Math.max(
            startDate.getTime(),
            endDate.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000)
        ));

        const [openedPRs, closedPRs] = await Promise.all([
            this.fetchPaginatedBatch(
                `/repos/${owner}/${repo}/pulls`,
                timeRange,
                {
                    state: 'all',
                    since: optimizedStartDate.toISOString()
                }
            ),
            this.fetchPaginatedBatch(
                `/repos/${owner}/${repo}/pulls`,
                timeRange,
                {
                    state: 'closed',
                    since: optimizedStartDate.toISOString()
                }
            )
        ]);

        // Use Maps for faster lookups
        const prsByDate = new Map<string, { opened: number; closed: number }>();
        
        // Pre-generate dates array
        const dates: string[] = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const date = d.toISOString().split('T')[0];
            dates.push(date);
            prsByDate.set(date, { opened: 0, closed: 0 });
        }

        // Process PRs in bulk
        openedPRs.forEach((pr: any) => {
            const date = new Date(pr.created_at).toISOString().split('T')[0];
            const current = prsByDate.get(date) || { opened: 0, closed: 0 };
            current.opened++;
            prsByDate.set(date, current);
        });

        closedPRs.forEach((pr: any) => {
            const date = new Date(pr.closed_at).toISOString().split('T')[0];
            const current = prsByDate.get(date) || { opened: 0, closed: 0 };
            current.closed++;
            prsByDate.set(date, current);
        });

        const total = openedPRs.length + closedPRs.length;
        
        return dates.map(date => {
            const stats = prsByDate.get(date) || { opened: 0, closed: 0 };
            return {
                date,
                opened: stats.opened,
                closed: stats.closed,
                total
            };
        });
    }

    async getRepositoryHealth(owner: string, repo: string): Promise<RepositoryHealth> {
        const [repoData, contents] = await Promise.all([
            this.fetchWithCache(`/repos/${owner}/${repo}`),
            this.fetchWithCache(`/repos/${owner}/${repo}/contents`)
        ]);

        const files = new Set(contents.map((file: any) => file.name.toLowerCase()));
        
        const documentationFiles = [
            { name: "README.md", path: "readme.md" },
            { name: "CONTRIBUTING.md", path: "contributing.md" },
            { name: "LICENSE", path: "license" },
            { name: "CODE_OF_CONDUCT.md", path: "code_of_conduct.md" },
            { name: "SECURITY.md", path: "security.md" },
            { name: "CHANGELOG.md", path: "changelog.md" }
        ];

        const documentationStatus = documentationFiles.map(doc => ({
            name: doc.name,
            path: doc.path,
            status: files.has(doc.path.toLowerCase())
        }));

        return {
            documentationStatus,
            hasWiki: repoData.has_wiki,
            hasIssues: repoData.has_issues,
            hasProjects: repoData.has_projects,
            defaultBranch: repoData.default_branch,
            license: repoData.license
        };
    }

    async getBranchActivity(owner: string, repo: string, branch: string): Promise<{ date: string; count: number }> {
        try {
            const endpoint = `/repos/${owner}/${repo}/commits`;
            const params = new URLSearchParams({
                sha: branch,
                per_page: '1'
            }).toString();

            const response = await fetch(`${this.baseUrl}${endpoint}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }

            const commits = await response.json();
            
            if (!Array.isArray(commits) || commits.length === 0) {
                console.warn(`No commits found for branch ${branch}`);
                return { date: '', count: 0 };
            }

            const commit = commits[0];
            if (!commit?.commit?.author?.date) {
                console.warn(`Invalid commit data structure for branch ${branch}`);
                return { date: '', count: 0 };
            }

            return {
                date: commit.commit.author.date,
                count: 1
            };
        } catch (error) {
            console.error(`Error fetching activity for branch ${branch}:`, error);
            return { date: '', count: 0 };
        }
    }

    async getBranches(owner: string, repo: string): Promise<Branch[]> {
        try {
            const endpoint = `/repos/${owner}/${repo}/branches`;
            const branches = await this.fetchWithCache(endpoint);
            
            // Get activity data for each branch in parallel, with error handling
            const branchesWithActivity = await Promise.all(
                branches.map(async (branch: Branch) => {
                    try {
                        const activity = await this.getBranchActivity(owner, repo, branch.name);
                        return {
                            ...branch,
                            lastCommit: activity
                        };
                    } catch (error) {
                        console.error(`Error processing branch ${branch.name}:`, error);
                        return branch;
                    }
                })
            );
            
            return branchesWithActivity;
        } catch (error) {
            console.error('Error fetching branches:', error);
            throw error;
        }
    }
}