## Multi-stage build for NestJS (Node 24)
## MongoDB is NOT included; provide MONGODB_URI at runtime.

FROM node:24-bookworm-slim AS deps
WORKDIR /app

# Avoid Puppeteer downloading Chrome during install (use system Chromium at runtime).
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


FROM node:24-bookworm-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


FROM node:24-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Chromium + fonts for form PDF export (Puppeteer uses the system binary above).
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-core \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
