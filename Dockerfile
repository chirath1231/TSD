# TSD Properties: one container serving the React site + Express API
# Build context = repository root

# ---------- 1. Build the React client ----------
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---------- 2. Production server ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server/index.js"]
