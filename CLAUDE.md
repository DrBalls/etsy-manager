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

## 🔄 Self-Improving Session Protocol

### Session Start Protocol

1. **Check Session History**: Review `.taskmaster/sessions/` for previous retrospectives
2. **Load Improvements**: Apply learnings from past sessions
3. **Verify Environment**: Confirm all tools and dependencies are accessible
4. **Review Current Tasks**: Run `task-master list` to understand project state

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

### Session History Integration

```bash
# Quick command to review recent learnings
cat .taskmaster/sessions/session-*.md | grep -A 5 "High Priority" | tail -20

# Find recurring issues
grep -h "Mistake:" .taskmaster/sessions/*.md | sort | uniq -c | sort -rn
```

## Task Master AI Instructions

**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
