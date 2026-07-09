# Dockerfile
# Multi-stage build for Next.js + Node.js backend
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci --only=production
COPY . .
RUN npm run build

# Development stage
FROM node:20-alpine AS development
RUN apk add --no-cache bash
WORKDIR /app
COPY . .
CMD ["npm", "run", "dev"]

# Final stage
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env.production ./.env.production 2>/dev/null || true
CMD ["npm", "run", "start"]
