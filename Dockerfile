# ─── Stage 1: Build TypeScript ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL deps (including devDeps for tsc)
COPY backend/package*.json ./
RUN npm ci

# Copy source and compile
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# ─── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV PORT=8080

# Only copy production deps
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy .env file so environment variables are available at runtime
COPY backend/.env ./.env

# Expose the port Express listens on
EXPOSE 8080

# Use node directly against the compiled entry point
CMD ["node", "dist/index.js"]
