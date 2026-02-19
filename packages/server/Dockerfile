FROM node:22-slim AS base
RUN npm install -g pnpm@10

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
COPY packages/server/ packages/server/

RUN pnpm --filter @go-stop/shared build
RUN pnpm --filter @go-stop/server build

FROM node:22-slim AS runner
RUN npm install -g pnpm@10

WORKDIR /app

COPY --from=base /app/ ./

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "packages/server/dist/index.js"]
