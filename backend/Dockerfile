# ─── Stage 1: Build TypeScript ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL deps (including devDeps for tsc)
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV PORT=8080

# Only copy production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port Express listens on
EXPOSE 8080

# Use node directly against the compiled entry point
CMD ["node", "dist/index.js"]
