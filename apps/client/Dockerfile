# 在 monorepo 根目录构建：docker build -f apps/client/Dockerfile .
FROM node:22-alpine as build-stage
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json

RUN npm ci --workspace=client --include-workspace-root

COPY apps/client ./apps/client
RUN npm run build --workspace=client

FROM nginx:alpine as production-stage
COPY --from=build-stage /repo/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
