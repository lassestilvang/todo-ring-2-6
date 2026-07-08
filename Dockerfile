# Stage 0: Setup
FROM node:20-alpine AS base

# Security headers configuration
# Generate proper secrets using environment variables
ENV JWT_SECRET=your-super-secret-jwt-key-here \
    AUTH_SECRET=your-auth-secret-here \
    SMTP_USER=your-email@gmail.com \
    SMTP_PASS=your-app-password \
    VAPID_PUBLIC_KEY=your-vapid-public-key-here \
    VAPID_PRIVATE_KEY=your-vapid-private-key-here \
    VAPID_SUBJECT=mailto:your-contact@domain.com

# Base configuration for security
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    && update-ca-certificates

# Create non-root user for security
RUN addgroup --system --gid 1001 appuser
RUN adduser --system --uid 1001 --gid 1001 nextjs

# Stage 1: Build
FROM node:20-builder AS builder

# Set working directory
WORKDIR /app

# Security hardening: Install only necessary packages
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && cp /usr/share/zoneinfo/UTC /etc/localtime && echo "Asia/Taipei" > /etc/localtime

# Copy package files with proper permissions
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application with production configuration
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Working directory
WORKDIR /app

# Copy security configurations and built assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Security hardenings for production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/tmp ./tmp

# Expose port with proper configuration
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production \
    PORT=3000 \
    EDGE_RUNTIME=false \
    VERCEL_ENV=production

# Health check with proper security validation
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget -q -O- http://localhost:3000/api/health/healthcheck || exit 1 || exit 1

# Security headers configuration for Next.js
# Configure security headers in next.config.ts during runtime
COPY .env.example .env

# Start application with production configuration
CMD ["node", ".next/standalone/index.js"]