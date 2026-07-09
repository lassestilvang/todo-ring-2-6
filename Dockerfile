# Stage 1: Setup
FROM node:20-alpine AS base

# Install tini (to handle zombie processes nicely)
RUN apk add --no-cache tini

# Run as non-root user for security
ENV NODE_ENV=production
ENV TZ=UTC
ENV PORT=3000

# Install bash and tini init
RUN apk add --no-cache bash tini

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Stage 2: Build
FROM node:20-alpine AS builder

# Install dependencies with proper locking
RUN apk add --no-cache python3 make g++ \
    && cp /usr/share/zoneinfo/UTC /etc/localtime && echo "Asia/Shanghai" > /etc/localtime

# Set working directory
WORKDIR /app

# Install production dependencies first (faster caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Use Build with production environment
ENV NODE_ENV=production
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner

# Use non-root user for security
WORKDIR /app
RUN addgroup --system --gid 1001 appuser \
    && adduser --system --uid 1001 --gid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--enable-cjs"

# Copy necessary files
COPY --from=builder /app/.next .next
COPY --from=builder /app/public .next/../public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Set proper permissions
RUN chown -R nextjs:appuser /app

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget -q -O- http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", ".next/standalone/server.js"]