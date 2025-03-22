FROM node:22.14.0-bookworm-slim
ENV TZ=Asia/Tokyo
RUN corepack enable pnpm
RUN corepack use pnpm
WORKDIR /app
COPY . /app
RUN pnpm install
ENV NODE_ENV=development
ENV API_BASE_URL=https://35.212.130.190/api
RUN cd workspaces/client && pnpm build
ENV NODE_ENV=production
ENV HTTPS=true
ENV PORT=443
CMD ["pnpm", "start"]
