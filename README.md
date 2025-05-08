<div align="center">
  <div>
    <img src="public/flaticon.svg" alt="RepoPulse Logo" width="120" height="120" />
  </div>
  <h1>RepoPulse</h1>
  <p>Track Your Open-Source Contributions in Real-time</p>
</div>

## 🚀 Overview

RepoPulse is a modern web application designed to help developers monitor and track their open-source contributions and repository activities. With real-time updates and comprehensive analytics, RepoPulse provides all the tools you need to stay on top of your GitHub projects.

<div align="center">
  <img src="https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js" alt="Built with Next.js" />
  <img src="https://img.shields.io/badge/Styled%20with-Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Styled with Tailwind" />
  <img src="https://img.shields.io/badge/Powered%20by-GitHub%20API-181717?style=for-the-badge&logo=github" alt="Powered by GitHub API" />
</div>

## ✨ Features

- **Real-time Updates**: Get instant notifications about issues, pull requests, and repository activities
- **PR Tracking**: Monitor pull request status, reviews, and merge conflicts efficiently
- **Issue Management**: Track and manage issues across multiple repositories in one place
- **Repository Analytics**: Visualize repository activity and contribution metrics with interactive charts
- **Branch Management**: View and monitor branches across your repositories with last commit information
- **Commit History**: Track commit history and changes in your repositories with author details
- **Release Tracking**: Stay updated with the latest releases from your favorite projects
- **Repository Health**: Analyze the overall health and activity of your repositories with comprehensive scoring
- **Language Statistics**: View language distribution and statistics for each repository
- **Contributor Insights**: See who's contributing to repositories and their activity levels
- **Time-Range Analysis**: Filter analytics by different time ranges (today, this week, last month, etc.)
- **Custom Filtering**: Filter issues and PRs by status, labels, and search terms

## 🖥️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with GitHub OAuth (with secure token handling)
- **State Management**: React Hooks and Context API
- **UI Components**: Radix UI primitives with custom styling, Lucide Icons
- **Data Visualization**: Nivo for calendars and heatmaps, Recharts for line and bar charts
- **API Integration**: GitHub REST API via Octokit with efficient caching

## 🏗️ Architecture

RepoPulse follows a modern React application architecture:

- **Component-Based Structure**: Organized into reusable UI components
- **Server-Side Authentication**: Secure GitHub OAuth flow with NextAuth.js
- **Client-Side Data Fetching**: Efficient API calls with caching for performance
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Theme Support**: Dark/light mode with next-themes
- **Protected Routes**: Middleware-based authentication protection for dashboard

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/RepoPulse.git

# Navigate to the project directory
cd RepoPulse

# Install dependencies
npm install

# Create a .env.local file with your GitHub OAuth credentials
# GITHUB_ID=your_github_client_id
# GITHUB_SECRET=your_github_client_secret
# NEXTAUTH_SECRET=your_nextauth_secret
# NEXTAUTH_URL=http://localhost:3000

# Start the development server
npm run dev
```

## 🔑 Environment Variables

To run this project, you'll need to add the following environment variables to your .env.local file:

```
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🔒 Authentication Flow

RepoPulse uses GitHub OAuth for authentication:

1. User clicks "Sign in with GitHub" on the landing page
2. User is redirected to GitHub for authorization
3. GitHub redirects back with a code
4. NextAuth.js exchanges the code for an access token
5. The token is securely stored in the session
6. The token is used for all GitHub API requests

## 📊 Dashboard Features

The RepoPulse dashboard provides a comprehensive view of your repositories with the following features:

- **Repository Cards**: Quick access to key repository metrics with star count, fork count, and language information
- **Activity Feed**: Real-time updates on issues, PRs, commits, and releases with user avatars and timestamps
- **Analytics Panels**: Interactive charts showing commit frequency, PR merge rates, and issue resolution rates
- **Branch Management**: Monitor branch status with protection status and last commit information
- **Issue Tracking**: Filter issues by status (open/closed), labels, and search terms
- **PR Monitoring**: Track pull request status, reviews, and associated labels
- **Repository Health Score**: Composite score based on documentation, code quality, and activity metrics
- **Contributor Leaderboard**: See top contributors with contribution counts and avatars
- **Language Breakdown**: Visual representation of language distribution in repositories
- **Time-Range Selection**: Analyze repository activity over different time periods

## 🔄 Workflow

1. **Sign in with GitHub**: Authenticate with your GitHub account using OAuth
2. **Add Repositories**: Search for and track repositories you contribute to or are interested in
3. **Monitor Activity**: Get real-time updates on repository activity with detailed views
4. **Analyze Metrics**: View interactive charts and visualizations of repository health and activity
5. **Manage Issues & PRs**: Track, filter, and manage issues and pull requests across repositories
6. **Check Repository Health**: Get insights into documentation quality, code practices, and activity metrics
7. **Track Releases**: Stay updated on new releases and version changes
8. **Monitor Branches**: Keep track of branch activity and protection status

## 💡 Key Implementation Details

- **Efficient API Usage**: Smart caching system to minimize GitHub API calls and stay within rate limits
- **Time-Range Based Analytics**: Customizable time ranges for analytics with appropriate data sampling
- **Responsive UI Components**: All components adapt seamlessly to different screen sizes
- **Interactive Visualizations**: Charts and graphs respond to user interactions for deeper insights
- **Optimized Performance**: Careful state management to prevent unnecessary re-renders
- **Secure Authentication**: OAuth tokens are securely handled and never exposed to the client
- **Custom Hooks**: Reusable React hooks for common functionality
- **Accessibility**: Components built with accessibility in mind using Radix UI primitives

## 🌟 Unique Features

- **Repository Health Scoring**: Proprietary algorithm that evaluates repository health based on multiple factors
- **Mouse Trail Effect**: Interactive UI element on the landing page (activated by triple-clicking)
- **Real-time Activity Monitoring**: Live updates of repository activities
- **Branch Comparison**: Compare activity across different branches
- **Label Analysis**: Track issue and PR patterns by label distribution
- **Contributor Insights**: Identify key contributors and their impact

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible UI components
- [GitHub API](https://docs.github.com/en/rest) - GitHub REST API
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icons
- [Nivo](https://nivo.rocks/) - Rich data visualization components
- [Recharts](https://recharts.org/) - Composable charting library
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [next-themes](https://github.com/pacocoursey/next-themes) - Theme management
