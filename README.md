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

This repository includes a production-oriented GitHub Actions setup for validation, image publishing, security checks, and deployment.

### Workflows

- `CI` in `.github/workflows/ci.yml`
  Runs linting, TypeScript type checking, application build, and Docker build validation on pushes and pull requests.

- `Docker Publish` in `.github/workflows/docker-publish.yml`
  Builds and pushes the production Docker image to GitHub Container Registry (`ghcr.io`) on `main` and `master`.

- `Preview Image` in `.github/workflows/preview-image.yml`
  Builds and pushes pull request preview images tagged like `pr-<number>`.

- `Security` in `.github/workflows/security.yml`
  Runs `npm audit` and a Trivy security scan on pushes, pull requests, and on a weekly schedule.

- `Deploy` in `.github/workflows/deploy.yml`
  Manually deploys a selected image tag to a remote Docker host over SSH.

- `Docker Build` in `.github/workflows/docker-build.yml`
  Manual Docker-only smoke build for quick validation when needed.

### Container Registry

Published images are pushed to GitHub Container Registry using a name like:

```text
ghcr.io/<github-owner>/nextnews:latest
ghcr.io/<github-owner>/nextnews:sha-<commit>
ghcr.io/<github-owner>/nextnews:pr-<number>
```

### Required GitHub Variables

Add these repository variables in GitHub if you want the publish pipeline to use real public build values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

If these are not set, the workflows fall back to safe placeholder values for CI builds.

### Required GitHub Secrets For Deployment

Add these secrets before using the deploy workflow:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH`
- `GHCR_PAT`

`GHCR_PAT` should be a token that can pull packages from GitHub Container Registry on the target server.

### Typical Flow

1. Open a pull request and let `CI`, `Security`, and `Preview Image` run.
2. Merge into `main` or `master`.
3. Let `Docker Publish` push the production image to `ghcr.io`.
4. Run `Deploy` manually with the image tag you want to release.

### Notes

- Preview images are pushed to the registry, but they are not automatically deployed to a live preview URL.
- The deploy workflow assumes the destination server already has Docker and Docker Compose installed.
- The production Docker image is built from the standalone Next.js output for a smaller and safer runtime container.

## Marketing Poster

![image alt](https://github.com/GalibMorsed/NextNews/blob/d4729ba5fd4eb45ba185b3f44175f9bdd1223fb3/public/NextNews-Poster.png)
