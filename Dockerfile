FROM node:22.14.0-bookworm-slim
ENV TZ=Asia/Tokyo
RUN corepack enable pnpm
RUN corepack use pnpm
WORKDIR /app
COPY . /app
RUN pnpm install
ENV NODE_ENV=production
ENV PORT=443
CMD ["pnpm", "start"]
