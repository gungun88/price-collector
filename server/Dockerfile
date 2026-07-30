FROM node:24-alpine AS deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev

FROM node:24-alpine AS runner
WORKDIR /app/server
ENV NODE_ENV=production
COPY --from=deps /app/server/node_modules ./node_modules
COPY server/package.json ./package.json
COPY server/src ./src
COPY server/scripts ./scripts
COPY database /app/database
EXPOSE 4100
CMD ["node", "src/index.mjs"]
