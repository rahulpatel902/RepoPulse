export interface Repository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    watchers_count: number;
    forks_count: number;
    open_issues_count: number;
    language: string | null;
    created_at: string;
    updated_at: string;
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

export class GitHubAPI {
    private accessToken: string;
    private baseUrl = 'https://api.github.com';

    constructor(accessToken: string) {
        this.accessToken = accessToken;
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

    async searchRepositories(query: string): Promise<Repository[]> {
        const encodedQuery = encodeURIComponent(query);
        const response = await this.fetchWithAuth(`/search/repositories?q=${encodedQuery}&sort=stars&order=desc`);
        return response.items;
    }

    async getRepository(owner: string, repo: string): Promise<Repository> {
        return this.fetchWithAuth(`/repos/${owner}/${repo}`);
    }

    async getIssues(owner: string, repo: string, page: number = 1, perPage: number = 10, state: 'open' | 'closed' = 'open') {
        const response = await this.fetchWithAuth(
            `/repos/${owner}/${repo}/issues?state=${state}&page=${page}&per_page=${perPage}`
        );
        return {
            data: response,
            hasNextPage: response.length === perPage
        };
    }

    async getPullRequests(owner: string, repo: string, page: number = 1, perPage: number = 10) {
        const response = await this.fetchWithAuth(
            `/repos/${owner}/${repo}/pulls?state=all&page=${page}&per_page=${perPage}`
        );
        return {
            data: response,
            hasNextPage: response.length === perPage
        };
    }

    async getReleases(owner: string, repo: string, page: number = 1, perPage: number = 10) {
        const response = await this.fetchWithAuth(
            `/repos/${owner}/${repo}/releases?page=${page}&per_page=${perPage}`
        );
        return {
            data: response,
            hasNextPage: response.length === perPage
        };
    }

    async getCommits(owner: string, repo: string, page: number = 1, perPage: number = 10) {
        const response = await this.fetchWithAuth(
            `/repos/${owner}/${repo}/commits?page=${page}&per_page=${perPage}`
        );
        return {
            data: response,
            hasNextPage: response.length === perPage
        };
    }

    async getContributors(owner: string, repo: string) {
        return this.fetchWithAuth(`/repos/${owner}/${repo}/contributors`);
    }

    async getLanguages(owner: string, repo: string) {
        const response = await this.fetchWithAuth(`/repos/${owner}/${repo}/languages`);
        const total = Object.values(response).reduce((a: number, b: number) => a + b, 0);
        return Object.entries(response).map(([name, bytes]) => ({
            name,
            percentage: (bytes as number / total) * 100
        }));
    }

    async getCommitActivity(owner: string, repo: string, days: number): Promise<{ date: string; count: number }[]> {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const response = await this.fetchWithAuth(
            `/repos/${owner}/${repo}/commits?since=${since.toISOString()}&per_page=100`
        );

        // Group commits by date
        const commitsByDate = response.reduce((acc: { [key: string]: number }, commit: any) => {
            const date = new Date(commit.commit.author.date).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        // Fill in missing dates with zero commits
        const result = [];
        for (let d = new Date(since); d <= new Date(); d.setDate(d.getDate() + 1)) {
            const date = d.toISOString().split('T')[0];
            result.push({
                date,
                count: commitsByDate[date] || 0
            });
        }

        return result;
    }

    async getIssueActivity(owner: string, repo: string, days: number): Promise<{ date: string; opened: number; closed: number }[]> {
        const since = new Date();
        since.setDate(since.getDate() - days);
        
        const [openedIssues, closedIssues] = await Promise.all([
            this.fetchWithAuth(`/repos/${owner}/${repo}/issues?state=all&since=${since.toISOString()}&per_page=100`),
            this.fetchWithAuth(`/repos/${owner}/${repo}/issues?state=closed&since=${since.toISOString()}&per_page=100`)
        ]);

        // Group issues by date
        const issuesByDate: { [key: string]: { opened: number; closed: number } } = {};
        
        openedIssues.forEach((issue: any) => {
            const date = new Date(issue.created_at).toISOString().split('T')[0];
            if (!issuesByDate[date]) issuesByDate[date] = { opened: 0, closed: 0 };
            issuesByDate[date].opened++;
        });

        closedIssues.forEach((issue: any) => {
            const date = new Date(issue.closed_at).toISOString().split('T')[0];
            if (!issuesByDate[date]) issuesByDate[date] = { opened: 0, closed: 0 };
            issuesByDate[date].closed++;
        });

        // Fill in missing dates
        const result = [];
        for (let d = new Date(since); d <= new Date(); d.setDate(d.getDate() + 1)) {
            const date = d.toISOString().split('T')[0];
            result.push({
                date,
                opened: issuesByDate[date]?.opened || 0,
                closed: issuesByDate[date]?.closed || 0
            });
        }

        return result;
    }

    async getPullRequestActivity(owner: string, repo: string, days: number): Promise<{ date: string; opened: number; closed: number }[]> {
        const since = new Date();
        since.setDate(since.getDate() - days);
        
        const [openedPRs, closedPRs] = await Promise.all([
            this.fetchWithAuth(`/repos/${owner}/${repo}/pulls?state=all&since=${since.toISOString()}&per_page=100`),
            this.fetchWithAuth(`/repos/${owner}/${repo}/pulls?state=closed&since=${since.toISOString()}&per_page=100`)
        ]);

        // Group PRs by date
        const prsByDate: { [key: string]: { opened: number; closed: number } } = {};
        
        openedPRs.forEach((pr: any) => {
            const date = new Date(pr.created_at).toISOString().split('T')[0];
            if (!prsByDate[date]) prsByDate[date] = { opened: 0, closed: 0 };
            prsByDate[date].opened++;
        });

        closedPRs.forEach((pr: any) => {
            const date = new Date(pr.closed_at).toISOString().split('T')[0];
            if (!prsByDate[date]) prsByDate[date] = { opened: 0, closed: 0 };
            prsByDate[date].closed++;
        });

        // Fill in missing dates
        const result = [];
        for (let d = new Date(since); d <= new Date(); d.setDate(d.getDate() + 1)) {
            const date = d.toISOString().split('T')[0];
            result.push({
                date,
                opened: prsByDate[date]?.opened || 0,
                closed: prsByDate[date]?.closed || 0
            });
        }

        return result;
    }
}