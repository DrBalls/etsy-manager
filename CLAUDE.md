# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**Etsy Store Manager Pro** - A comprehensive Etsy store management platform leveraging the full Etsy API to provide sellers with advanced tools for inventory management, analytics, customer engagement, and business optimization.

### Architecture

- **Monorepo Structure** (Turborepo/Nx)
  - `/apps/extension` - Browser extensions (Chrome/Firefox/Safari) using Manifest V3
  - `/apps/web` - Next.js 14 web application with App Router
  - `/apps/desktop` - Electron desktop application
  - `/apps/api` - Node.js/Express backend API
  - `/packages/shared` - Shared types, utilities, and API client

### Tech Stack

- **Frontend**: React 18, Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express, PostgreSQL 15+, Redis, Prisma ORM
- **Extension**: Manifest V3, Plasmo/WXT framework, Shadow DOM
- **Desktop**: Electron with React frontend
- **Infrastructure**: Docker, AWS ECS, GitHub Actions
- **Testing**: Jest, Playwright, React Testing Library

## 🚀 Development Commands

### Initial Setup

```bash
# Install dependencies (using pnpm)
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Etsy API credentials

# Initialize database
pnpm db:setup
pnpm db:migrate
pnpm db:seed
```

### Development

```bash
# Start all apps in development mode
pnpm dev

# Start specific apps
pnpm dev:extension    # Browser extension with hot reload
pnpm dev:web         # Next.js web app on http://localhost:3000
pnpm dev:api         # Express API on http://localhost:8000
pnpm dev:desktop     # Electron app

# Database commands
pnpm db:migrate      # Run migrations
pnpm db:studio       # Open Prisma Studio
pnpm db:generate     # Generate Prisma client
```

### Building & Testing

```bash
# Build all apps
pnpm build

# Build specific apps
pnpm build:extension
pnpm build:web
pnpm build:api
pnpm build:desktop

# Testing
pnpm test            # Run all tests
pnpm test:unit       # Unit tests only
pnpm test:e2e        # E2E tests with Playwright
pnpm test:watch      # Watch mode

# Autonomous Testing (AI-Powered)
pnpm tsx scripts/run-autonomous-tests.ts         # Generate and run tests
pnpm tsx scripts/run-autonomous-tests.ts -m      # Continuous monitoring
pnpm tsx scripts/run-autonomous-tests.ts --files apps/web/app/api/auth/route.ts  # Test specific files

# Linting & Formatting
pnpm lint            # ESLint
pnpm format          # Prettier
pnpm typecheck       # TypeScript checks
```

### Extension Development

```bash
# Load extension in Chrome
1. Run: pnpm dev:extension
2. Open chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select: apps/extension/build/chrome-mv3-dev

# Build for production
pnpm build:extension
# Output: apps/extension/build/chrome-mv3-prod
```

## 📁 Key Architecture Decisions

### Etsy API Integration

- **OAuth 2.0 Flow**: Implemented in `/packages/shared/src/auth/`
- **Rate Limiting**: Using p-queue with 10 req/sec limit
- **Caching**: Redis with 5-minute TTL for API responses
- **Error Handling**: Exponential backoff with retry logic

### Database Schema (Prisma)

- Multi-tenant architecture supporting multiple shops per user
- TimescaleDB extension for analytics time-series data
- Proper indexing on high-query fields (shopId, etsyListingId)
- Soft deletes for data retention compliance

### Browser Extension Architecture

- Service Worker for background tasks and API communication
- Content Scripts with Shadow DOM to avoid CSS conflicts
- Message passing between popup, content, and background scripts
- Chrome Storage API for local data persistence

### State Management

- **Web App**: Zustand for global state, React Query for server state
- **Extension**: Chrome Storage Sync API with React Context
- **Desktop**: Electron Store with IPC communication

## 🔧 Task Management with TaskMaster

### Current Development Status

- 20 high-level tasks defined in `.taskmaster/tasks/tasks.json`
- Tasks cover full development lifecycle from setup to deployment
- Use TaskMaster commands to track progress

### Key TaskMaster Commands

```bash
# View all tasks
task-master list

# Get next task to work on
task-master next

# View specific task details
task-master show <id>

# Update task status
task-master set-status --id=<id> --status=in-progress
task-master set-status --id=<id> --status=done

# Expand task into subtasks
task-master expand --id=<id> --research

# Add implementation notes
task-master update-subtask --id=<id> --prompt="implementation details..."
```

### Task Priorities

1. **High Priority**: Core infrastructure (Tasks 1-4, 7)
2. **Medium Priority**: Feature implementation (Tasks 5-6, 8-15)
3. **Low Priority**: Advanced features and optimizations (Tasks 16-20)

## 🏗️ Implementation Guidelines

### API Client Pattern

```typescript
// Always use the centralized EtsyAPIClient
import { etsyClient } from '@etsy-manager/shared';

// Rate limiting is handled automatically
const listings = await etsyClient.getShopListings(shopId);
```

### Component Structure

```typescript
// Use Server Components by default in Next.js
// Client Components only when needed for interactivity
'use client'; // Only when necessary

// Consistent prop typing
interface ComponentProps {
  shopId: string;
  className?: string;
}
```

### Error Handling

```typescript
// Use custom error classes
class EtsyAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
  }
}

// Consistent error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

### Testing Approach

- Unit tests for utilities and hooks
- Integration tests for API endpoints
- E2E tests for critical user flows
- Visual regression tests for UI components

## 🔐 Security Considerations

### API Keys & Secrets

- Never commit API keys - use environment variables
- Etsy OAuth tokens stored encrypted in database
- Use node-keytar for desktop app secret storage
- Extension uses Chrome's secure storage API

### Data Protection

- PII encrypted at rest using AES-256
- HTTPS only for all communications
- CORS properly configured for extension
- Rate limiting on all API endpoints

## 📚 Important Resources

### Etsy API Documentation

- [Etsy API v3 Docs](https://developers.etsy.com/documentation/)
- OAuth Scopes needed: `listings_r`, `listings_w`, `shops_r`, `transactions_r`
- Rate Limits: 10,000 requests/day per app

### Key Dependencies

- `@etsy/oauth2-sdk` - Official Etsy OAuth client
- `p-queue` - Rate limiting queue
- `bullmq` - Background job processing
- `@timescale/timescaledb-node` - Time-series analytics

## 🚧 Development Workflow

### Feature Development

1. Check TaskMaster for next task: `task-master next`
2. Create feature branch: `git checkout -b feature/task-<id>`
3. Implement following existing patterns
4. Write tests alongside implementation
5. Update task status: `task-master set-status --id=<id> --status=done`
6. Create PR with task reference

### Before Committing

```bash
# Run all checks
pnpm lint && pnpm typecheck && pnpm test

# The above is automated with Husky pre-commit hooks
```

## 🚨 Deployment Troubleshooting Guide

### CRITICAL: Build-First Approach

When debugging deployment issues, ALWAYS start with:

```bash
# Step 1: Try to build - this reveals most issues
pnpm build

# Step 2: If build fails, check TypeScript
pnpm typecheck

# Step 3: Check for schema-code mismatches
grep "model" apps/web/prisma/schema.prisma | awk '{print $2}' > /tmp/models.txt
grep -r "prisma\." apps/web/lib apps/web/app | grep -o "prisma\.[a-zA-Z]*" | sort | uniq > /tmp/usage.txt
diff /tmp/models.txt /tmp/usage.txt
```

### Common Deployment Blockers & Fixes

1. **Missing Prisma Models**
   ```bash
   # Before fixing "Property 'modelName' does not exist on PrismaClient"
   grep "model ModelName" apps/web/prisma/schema.prisma
   # If missing, either add to schema or refactor code
   ```

2. **Type Version Mismatches**
   ```bash
   # Check for conflicting versions
   pnpm ls -r --depth 0 | grep "package-name" | sort
   # Use type assertions as temporary fix: as any
   ```

3. **Next.js 14 Client Component Issues**
   - `useSearchParams` requires Suspense boundary
   - Client components need 'use client' directive
   - Check migration guide: https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration

4. **Test File Corruption**
   ```bash
   # Find and fix test files
   find . -name "*.test.ts" -o -name "*.test.tsx" | xargs -I {} sh -c 'echo "Checking {}" && tsc --noEmit {}'
   # Exclude from build if needed via tsconfig.json
   ```

### Pre-Deployment Checklist

```bash
# Run this before ANY deployment
echo "=== Pre-Deployment Validation ==="
pnpm typecheck && echo "✅ TypeScript OK" || echo "❌ Fix TypeScript errors"
pnpm build && echo "✅ Build OK" || echo "❌ Fix build errors"
pnpm test && echo "✅ Tests OK" || echo "⚠️ Tests failing (may not block)"
pnpm lint && echo "✅ Lint OK" || echo "⚠️ Lint warnings"

# Check for common issues
echo "=== Schema-Code Consistency ==="
grep -c "oAuthSession\|etsyToken" apps/web/lib/**/*.ts && echo "⚠️ Check for non-existent models"

echo "=== Dependency Sync ==="
pnpm ls -r --depth 0 | grep -E "(ioredis|@types/)" | sort | uniq -c | awk '$1>1 {print "⚠️ Multiple versions of", $2}'
```

### Schema Evolution Best Practices

1. **Before removing a model**: Search entire codebase for usage
2. **After adding a model**: Run `pnpm db:generate` immediately
3. **When renaming fields**: Use find & replace across project
4. **Track schema changes**: Commit schema.prisma with related code changes

## 🤖 Autonomous Testing Integration

### Test-Driven Development with AI Assistance

When implementing features, follow this autonomous testing workflow:

1. **Generate Tests First**
   ```bash
   # Use mcp__mcp-frontend-testing tools to generate tests
   # For React components
   mcp__mcp-frontend-testing__testReactComponent
   
   # For general code analysis and test generation
   mcp__mcp-frontend-testing__analyzeCode
   mcp__mcp-frontend-testing__generateTest
   ```

2. **Run Tests Continuously**
   ```bash
   # Unit tests in watch mode during development
   pnpm test:watch
   
   # E2E tests with Playwright (self-healing selectors)
   pnpm test:e2e
   ```

3. **Auto-Generate Missing Tests**
   - When adding new features, use AI to generate comprehensive test cases
   - Update existing tests when APIs or UI changes are detected
   - Let the testing framework adapt to minor UI changes automatically

### Autonomous Testing Pipeline

Our testing strategy follows these principles:

1. **Unit Tests** (Fast Feedback)
   - Run automatically on file save
   - Generate with AI based on function signatures
   - Auto-update assertions when logic changes

2. **Integration Tests** (API & Database)
   - Mock external Etsy API calls during development
   - Use real endpoints in staging environment
   - Auto-generate from API specifications

3. **E2E Tests** (UI Automation)
   - Playwright with AI-assisted locators
   - Self-healing selectors that adapt to UI changes
   - Visual regression testing for critical flows

### Testing Commands Enhanced

```bash
# Generate tests for a specific file
mcp__mcp-frontend-testing__generateTest --file="src/components/InventoryTable.tsx" --framework="jest" --type="component"

# Analyze code coverage and suggest missing tests
mcp__mcp-frontend-testing__analyzeCode --file="src/api/etsy-client.ts"

# Run specific test suites
pnpm test:unit              # Fast unit tests only
pnpm test:integration       # API and database tests
pnpm test:e2e              # Full E2E suite
pnpm test:e2e:headed       # E2E with browser UI

# Run tests in CI mode (all tests, no watch)
pnpm test:ci
```

### Test Data Management

```bash
# Seed test database with synthetic data
pnpm db:seed:test

# Reset test environment
pnpm test:reset

# Generate mock data for specific entities
pnpm generate:mock --entity="listing" --count=100
```

## 🔄 Self-Improving Session Protocol

### Session Start Protocol

1. **Check Session History**: Review `.taskmaster/sessions/` for previous retrospectives
2. **Load Improvements**: Apply learnings from past sessions
3. **Verify Environment**: 
   - Confirm all tools and dependencies are accessible
   - Check if PostgreSQL and Redis are running: `docker ps`
   - Verify database migrations are up to date: `cd apps/web && pnpm exec prisma migrate status`
4. **Pre-Development Health Check** (MANDATORY for deployment work):
   ```bash
   # Run these checks before any deployment debugging
   echo "=== Build Status Check ==="
   pnpm build || echo "⚠️ Build failing - fix this first!"
   
   echo "=== TypeScript Status ==="
   pnpm typecheck || echo "⚠️ TypeScript errors present"
   
   echo "=== Prisma Schema Models ==="
   grep "^model" apps/web/prisma/schema.prisma | awk '{print $2}' | sort
   
   echo "=== Dependency Versions ==="
   pnpm ls --recursive --depth 0 | grep -E "(ioredis|next|react|prisma)" | sort | uniq
   ```
5. **Review Current Tasks**: 
   - Use TodoRead/TodoWrite for task tracking instead of external task-master
   - Check completed tasks and identify next priority
6. **Test Environment Health**:
   ```bash
   # Quick health check
   pnpm typecheck  # Verify TypeScript compilation
   cd apps/web && pnpm run db:generate  # Ensure Prisma client is current
   ```
6. **Run Autonomous Tests** (if making significant changes):
   ```bash
   # Generate tests for modified files
   pnpm tsx scripts/run-autonomous-tests.ts --files <modified-files>
   
   # Or start continuous monitoring
   pnpm tsx scripts/run-autonomous-tests.ts --monitor &
   ```

### Session End Protocol (MANDATORY)

Before ending any session, you MUST complete a retrospective:

```bash
# 1. Create session retrospective file
touch .taskmaster/sessions/session-$(date +%Y%m%d-%H%M%S).md

# 2. Document the session using the template below
```

### Retrospective Template

```markdown
# Session Retrospective - [DATE]

## Session Summary

- **Duration**: [Estimated time]
- **Tasks Worked On**: [Task IDs and descriptions]
- **Tasks Completed**: [List completed task IDs]
- **Tasks In Progress**: [List in-progress task IDs]

## Difficulties Encountered

### Tool Usage Issues

- [ ] Incorrect tool selection (used X when should have used Y)
- [ ] Inefficient command sequences
- [ ] Missing tool capabilities
- Examples: [Specific instances]

### Code/Architecture Challenges

- [ ] Misunderstood patterns or conventions
- [ ] Performance bottlenecks identified
- [ ] Security concerns discovered
- Examples: [Specific instances]

### Process Inefficiencies

- [ ] Repeated similar actions unnecessarily
- [ ] Failed to use batch operations
- [ ] Missed automation opportunities
- Examples: [Specific instances]

## Mistakes & Learnings

1. **Mistake**: [What went wrong]
   **Learning**: [How to avoid/fix next time]
   **Action**: [Specific change for next session]

2. **Mistake**: [What went wrong]
   **Learning**: [How to avoid/fix next time]
   **Action**: [Specific change for next session]

## Performance Improvements for Next Session

### High Priority

- [ ] [Specific improvement with clear action]
- [ ] [Specific improvement with clear action]

### Medium Priority

- [ ] [Specific improvement with clear action]
- [ ] [Specific improvement with clear action]

### Tool-Specific Optimizations

- **Preferred Tools**: [Tools that worked well for specific tasks]
- **Avoid**: [Tools or approaches that were inefficient]
- **New Patterns**: [Newly discovered efficient patterns]

## Knowledge Gaps Identified

- [ ] [Topic needing research/clarification]
- [ ] [API/Library documentation to review]
- [ ] [Pattern/Best practice to understand better]

## Session Metrics

- Commands executed: [Approximate count]
- Files modified: [Count]
- Tests run: [Pass/Fail ratio]
- Build time impact: [If measurable]

## Recommendations for Next Session

1. **Start with**: [Specific task or verification]
2. **Prioritize**: [Most important improvement]
3. **Research**: [Topic to investigate before coding]
4. **Verify**: [What to check before beginning work]
```

### Continuous Improvement Actions

1. **Review Pattern**: At session start, always check the last 3 retrospectives
2. **Update CLAUDE.md**: If a pattern appears in 2+ retrospectives, add it to this file
3. **Create Shortcuts**: For repeated command sequences, document them here
4. **Track Success**: Note when previous improvements helped in current session

### Common Patterns to Watch For

- **Tool Selection**:
  - Use `Task` agent for multi-file searches instead of multiple Grep/Glob calls
  - Use `MultiEdit` for multiple edits in same file instead of sequential `Edit`
  - Batch `Read` operations when reviewing multiple files
- **TaskMaster Efficiency**:
  - Update subtask notes during implementation, not just at completion
  - Use `task-master research` for exploring new libraries/patterns
  - Expand complex tasks before starting implementation

- **Development Flow**:
  - Always run `pnpm typecheck` before marking TypeScript tasks complete
  - Use `pnpm test:watch` during TDD instead of repeated full test runs
  - Check for existing patterns with `Grep` before implementing new ones
  - **CRITICAL**: For deployment issues, ALWAYS run `pnpm build` first
  - Verify Prisma models exist before using: `grep "model ModelName" prisma/schema.prisma`
  - Run build after every 3-5 significant code changes

### Session History Integration

```bash
# Quick command to review recent learnings
cat .taskmaster/sessions/session-*.md | grep -A 5 "High Priority" | tail -20

# Find recurring issues
grep -h "Mistake:" .taskmaster/sessions/*.md | sort | uniq -c | sort -rn
```

## 🤖 Autonomous Testing Framework

### Overview

The project includes an AI-powered autonomous testing framework that:
- Generates tests automatically from source code
- Self-heals failing tests when code changes
- Runs continuously in CI/CD pipelines
- Requires minimal human intervention

### Setup Requirements

```bash
# Add OpenAI API key to .env
echo "OPENAI_API_KEY=your-api-key-here" >> .env
```

### Running Autonomous Tests

#### One-Time Test Generation
```bash
# Generate and run tests for entire codebase
pnpm tsx scripts/run-autonomous-tests.ts

# Test specific files
pnpm tsx scripts/run-autonomous-tests.ts --files apps/web/app/api/auth/route.ts

# Generate only specific test types
pnpm tsx scripts/run-autonomous-tests.ts --types unit integration
pnpm tsx scripts/run-autonomous-tests.ts --types e2e

# Disable self-healing
pnpm tsx scripts/run-autonomous-tests.ts --no-heal
```

#### Continuous Monitoring
```bash
# Start continuous test monitoring
pnpm tsx scripts/run-autonomous-tests.ts --monitor

# This will:
# - Watch for file changes
# - Regenerate tests when code changes
# - Self-heal failing tests
# - Run full test suite hourly
```

### Test Generation Process

1. **Discovery**: Scans codebase for TypeScript/React files
2. **Analysis**: Examines dependencies and existing tests
3. **Generation**: Uses GPT-4 to create comprehensive tests
4. **Execution**: Runs generated tests with Jest/Playwright
5. **Self-Healing**: Fixes failing tests automatically
6. **Reporting**: Saves results to `.taskmaster/test-results.json`

### CI/CD Integration

Autonomous tests run automatically on:
- Every push to main/develop branches
- All pull requests
- Scheduled runs every 6 hours
- Manual workflow dispatch

### Test Types Generated

#### Unit Tests (Jest)
- Component testing
- Utility function testing
- Hook testing
- Service testing

#### Integration Tests (Jest)
- API endpoint testing
- Database operations
- Service interactions

#### E2E Tests (Playwright)
- User flow testing
- Cross-browser testing
- Visual regression testing

### Self-Healing Capabilities

- **Selector Updates**: Automatically updates when UI changes
- **Assertion Fixes**: Adjusts expectations based on new behavior
- **Mock Updates**: Refreshes mocks when dependencies change
- **Retry Logic**: Adds resilience for flaky operations

### Monitoring & Alerts

- Test results uploaded as GitHub artifacts
- PR comments with test summaries
- Automatic issue creation for persistent failures
- Slack/Teams notifications (configurable)

### Best Practices

1. **Review Generated Tests**: While AI-generated, review for quality
2. **Maintain Test Data**: Keep test fixtures up to date
3. **Monitor Self-Healing**: Check that fixes align with intended behavior
4. **Custom Test Cases**: Add manual tests for complex scenarios

### Troubleshooting

#### Tests Not Generating
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Verify file discovery
pnpm tsx scripts/run-autonomous-tests.ts --files apps/web/lib/auth.ts
```

#### Self-Healing Not Working
```bash
# Run with verbose output
DEBUG=* pnpm tsx scripts/run-autonomous-tests.ts

# Check test results
cat .taskmaster/test-results.json | jq '.results[] | select(.selfHealed == false)'
```

#### Performance Issues
```bash
# Reduce parallelism
pnpm tsx scripts/run-autonomous-tests.ts --parallel 2

# Test smaller batches
pnpm tsx scripts/run-autonomous-tests.ts --files "apps/web/components/**/*.tsx"
```

## Task Master AI Instructions

**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
