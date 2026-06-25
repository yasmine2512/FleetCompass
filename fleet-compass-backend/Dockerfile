# --- STAGE 1: Build the Application ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies needed for building TypeScript)
RUN npm ci

# Copy the rest of your application code
COPY . .

# Build the production-ready NestJS TypeScript code into JavaScript
RUN npm run build

# Remove development dependencies to keep the image small
RUN npm prune --production

# --- STAGE 2: Run the Application ---
FROM node:20-alpine AS runner

WORKDIR /app

# Copy production dependencies and built application from stage 1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Expose the API/WebSocket port (3000)
EXPOSE 3000

# Run the NestJS application in production mode
CMD ["node", "dist/main.js"]