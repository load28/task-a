FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates tini && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
ENV PATH=/app/node_modules/.bin:$PATH
USER node
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "scripts/instance-controller.ts"]
