FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node apps ./apps
COPY --chown=node:node packages ./packages
COPY --chown=node:node .opencode/tools ./.opencode/tools
COPY --chown=node:node .opencode/lib ./.opencode/lib
COPY --chown=node:node opencode.json ./opencode.json
COPY --chown=node:node scripts/backup.ts ./scripts/backup.ts
RUN mkdir -p /data /home/node/.local/share /home/node/.cache /home/node/.config && chown -R node:node /data /home/node /app/.opencode
USER node
ENV NODE_ENV=production TASK_AGENT_DB=/data/tasks.db TASK_AGENT_HOST=0.0.0.0 TASK_AGENT_PORT=7331
EXPOSE 7331
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:7331/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "apps/task-agent/src/remote.ts"]
