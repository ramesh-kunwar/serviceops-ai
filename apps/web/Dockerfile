
FROM node:24-bookworm-slim AS build

WORKDIR /workspace

RUN npm install -g pnpm@11.25.0

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @repo/web build

FROM nginx:stable-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80
