# Use Node.js 18 LTS
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the TypeScript project (skip linting in Docker)
RUN pnpm run build

# Expose port
EXPOSE 8080

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/app.js"] 