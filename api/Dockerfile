FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 4000
CMD ["node", "dist/main.js"]
