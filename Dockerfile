# Multi-stage Docker build for LingoLive Server
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build
RUN npm run typecheck

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Security: non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001

# Copy built assets from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

USER nodejs

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/service-health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/server.cjs"]
