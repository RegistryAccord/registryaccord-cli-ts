# syntax=docker/dockerfile:1

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage (non-root for safer key perms)
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Copy package + lockfile so npm ci can work
COPY --from=builder /app/package.json /app/package-lock.json ./
# Also copy manifest, bin, built dist
COPY --from=builder /app/oclif.manifest.json ./
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/dist ./dist
# Install only production deps
RUN npm ci --omit=dev --ignore-scripts
USER node
ENTRYPOINT ["node", "bin/run.js"]