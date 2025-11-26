# Dockerfile for Fitted API
# Standalone build - no monorepo dependencies

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy source and build with standalone tsconfig
COPY . ./
RUN npx tsc -p tsconfig.build.json

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/index.js"]
