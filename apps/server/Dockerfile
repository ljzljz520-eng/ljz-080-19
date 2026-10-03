# 在 monorepo 根目录构建：docker build -f apps/server/Dockerfile .
FROM node:22-alpine
WORKDIR /repo

# 先拷贝 workspace 清单以利用缓存
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/client/package.json apps/client/package.json

RUN npm ci --workspace=server --include-workspace-root

COPY apps/server ./apps/server
RUN npm run build --workspace=server

EXPOSE 3000
WORKDIR /repo/apps/server
CMD ["node", "dist/main.js"]
