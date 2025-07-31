# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy package files
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @etsy-manager/api...

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package and API
RUN pnpm --filter @etsy-manager/shared build
RUN pnpm --filter @etsy-manager/api build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./node_modules/@etsy-manager/shared/dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]