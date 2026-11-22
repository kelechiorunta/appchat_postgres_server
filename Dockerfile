# Production builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/migrations ./src/migrations
EXPOSE 5467
CMD [ "node", "dist/server.js" ]