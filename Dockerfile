# Node 20 on slim Debian
FROM node:20-slim

# System deps for your app:
# - ffmpeg (media features used by fluent-ffmpeg)
# - git (baileys git dependency)
# - ca-certificates (git over HTTPS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Use Yarn Classic from packageManager
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Install deps with caching
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

ENV NODE_ENV=production

# Start the bot (no PM2; Koyeb restarts container on exit)
CMD ["yarn", "start"]
