
FROM node:24-bookworm-slim

WORKDIR /workspace

RUN npm install -g pnpm@11.25.0

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @repo/api build

WORKDIR /workspace/apps/api

EXPOSE 4000

CMD ["node", "dist/index.js"]
