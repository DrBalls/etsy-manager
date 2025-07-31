# CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment.

## Workflows

### CI Workflow (`ci.yml`)

Runs on every push to `main` and `develop` branches, and on all pull requests.

**Jobs:**

1. **Lint** - Checks code style and formatting
2. **Type Check** - Validates TypeScript types
3. **Test** - Runs unit and integration tests (Node 20 & 22)
4. **Build** - Builds all packages
5. **E2E** - Runs end-to-end tests
6. **Security** - Runs security audits

### Deploy Workflow (`deploy.yml`)

Runs on pushes to `main` branch.

**Jobs:**

1. **Deploy Web** - Deploys web app to Vercel
2. **Deploy API** - Builds Docker image and pushes to registry
3. **Deploy Extension** - Uploads to Chrome Web Store (requires `[deploy-extension]` in commit message)
4. **Release Desktop** - Builds desktop app for all platforms (requires `[release-desktop]` in commit message)

### Release Workflow (`release.yml`)

Runs on version tags (e.g., `v1.0.0`).

**Jobs:**

1. **Create Release** - Creates GitHub release with changelog
2. **Build and Upload** - Builds assets for all platforms
3. **Publish Packages** - Publishes NPM packages (requires `[publish-shared]` in commit message)
4. **Docker Release** - Builds and pushes multi-arch Docker images

### PR Check Workflow (`pr-check.yml`)

Runs on all pull requests.

**Jobs:**

1. **Size Check** - Warns if PR is too large (>500 lines)
2. **Dependency Review** - Checks for vulnerable dependencies
3. **Label PR** - Auto-labels based on files changed
4. **Commit Lint** - Validates commit messages

## Required Secrets

### General

- `TURBO_TOKEN` - Turborepo remote cache token
- `NPM_TOKEN` - NPM publish token

### Vercel Deployment

- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

### Docker Registry

- `DOCKER_REGISTRY` - Docker registry URL
- `DOCKER_USERNAME` - Docker registry username
- `DOCKER_PASSWORD` - Docker registry password

### Chrome Web Store

- `CHROME_EXTENSION_ID` - Extension ID
- `CHROME_CLIENT_ID` - OAuth client ID
- `CHROME_CLIENT_SECRET` - OAuth client secret
- `CHROME_REFRESH_TOKEN` - OAuth refresh token

## Environment Variables

- `TURBO_TEAM` - Turborepo team name (set in repository variables)

## Dependabot

Automated dependency updates are configured for:

- NPM packages (weekly, grouped by dev/prod)
- GitHub Actions (weekly)
- Docker base images (weekly)

## Branch Protection

Recommended branch protection rules for `main`:

- Require pull request reviews
- Dismiss stale reviews
- Require review from CODEOWNERS
- Require status checks (lint, typecheck, test, build)
- Require branches to be up to date
- Require conversation resolution
- Require signed commits
- Include administrators

## Deployment Triggers

- **Web App**: Automatic on `main` branch
- **API**: Automatic on `main` branch
- **Extension**: Manual via commit message `[deploy-extension]`
- **Desktop**: Manual via commit message `[release-desktop]`
- **NPM Packages**: Manual via version tag and `[publish-shared]`
