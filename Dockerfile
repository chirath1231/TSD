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

# Uploaded images are stored here. In Dokploy, mount a persistent volume at this path
# (Advanced > Volumes) or uploaded files are lost on every redeploy.
ENV UPLOAD_DIR=/app/server/uploads
RUN mkdir -p /app/server/uploads/properties

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server/index.js"]
