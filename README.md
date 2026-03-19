## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Learn More

NextNews is a modern news web application built using Next.js and React that allows users to explore the latest news articles in a fast and responsive interface. The application fetches real-time news data from external APIs and displays them using dynamic routing and server-side rendering to improve performance and SEO.

The project focuses on clean component architecture, reusable UI components, and efficient data fetching. Users can browse news by category, open full articles, and navigate between pages smoothly without reloads. The application is designed with responsive layout techniques to ensure proper usability across desktop and mobile devices.

Through this project, I gained strong experience with Next.js routing, API integration, SSR/CSR concepts, and frontend optimization, along with improving my ability to structure scalable React applications.

## CI/CD Pipelines

This repository keeps a small GitHub Actions setup focused on Docker release flow.

### Workflows

- `Docker Publish` in `.github/workflows/docker-publish.yml`
  Builds and pushes the production Docker image to GitHub Container Registry (`ghcr.io`) on `main` and `master`.

### Dependency Automation

- `Dependabot` in `.github/dependabot.yml`
  Opens update pull requests for npm packages and GitHub Actions on a weekly schedule.

### Container Registry

Published images are pushed to GitHub Container Registry using tags like:

```text
ghcr.io/<github-owner>/nextnews:latest
ghcr.io/<github-owner>/nextnews:sha-<commit>
```

### Required GitHub Variables

Add these repository variables in GitHub if you want the publish pipeline to use real public build values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

If these are not set, the workflows fall back to safe placeholder values for CI builds.

### Typical Flow

1. Merge into `main` or `master`.
2. Let `Docker Publish` push the production image to `ghcr.io`.

### Notes

- The production Docker image is built from the standalone Next.js output for a smaller and safer runtime container.
- If you later want validation, automated server deployment, preview environments, or security scans, those can be added back as separate workflows.

## Marketing Poster

![image alt](https://github.com/GalibMorsed/NextNews/blob/d4729ba5fd4eb45ba185b3f44175f9bdd1223fb3/public/NextNews-Poster.png)
