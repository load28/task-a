ARG NODE_IMAGE
FROM ${NODE_IMAGE}
ARG CODEX_VERSION=0.154.0
RUN npm install --global @openai/codex@${CODEX_VERSION} && codex --version
