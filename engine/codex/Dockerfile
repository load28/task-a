# Build from engine/: the runner binary is cross-compiled from our AX sources.
ARG NODE_IMAGE=node@sha256:693101c77e947e45e001910202dcb37a659c0b1a4c27619848f1b8b7eaee0def
FROM ${NODE_IMAGE}
ARG CODEX_VERSION=0.154.0
RUN npm install -g @openai/codex@${CODEX_VERSION}
COPY ax/bin/linux/ax-task-runner /usr/local/bin/ax-task-runner
COPY ax/bin/linux/task-agent-exec /usr/local/bin/task-agent-exec
COPY codex/task-agent-codex.mjs /usr/local/bin/task-agent-codex
RUN chmod 755 /usr/local/bin/task-agent-codex
ENTRYPOINT ["/usr/local/bin/ax-task-runner"]
