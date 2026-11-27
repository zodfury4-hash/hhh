# Multi-stage production Dockerfile for HEA Link
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY frontend-landing/package*.json ./frontend-landing/

RUN npm ci && npm --prefix frontend-landing ci
COPY . .
RUN npm run build:landing && npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S healink && adduser -S healink -u 1001

COPY --from=builder --chown=healink:healink /app/node_modules ./node_modules
COPY --from=builder --chown=healink:healink /app/package*.json ./
COPY --from=builder --chown=healink:healink /app/server.js ./
COPY --from=builder --chown=healink:healink /app/backend ./backend
COPY --from=builder --chown=healink:healink /app/assets ./assets
COPY --from=builder --chown=healink:healink /app/index.html ./
COPY --from=builder --chown=healink:healink /app/app.html ./
COPY --from=builder --chown=healink:healink /app/404.html ./
COPY --from=builder --chown=healink:healink /app/privacy.html ./
COPY --from=builder --chown=healink:healink /app/terms.html ./
COPY --from=builder --chown=healink:healink /app/report-abuse.html ./
COPY --from=builder --chown=healink:healink /app/r.html ./
COPY --from=builder --chown=healink:healink /app/favicon.svg ./
COPY --from=builder --chown=healink:healink /app/logo.png ./
COPY --from=builder --chown=healink:healink /app/icons.svg ./
COPY --from=builder --chown=healink:healink /app/robots.txt ./
COPY --from=builder --chown=healink:healink /app/sitemap.xml ./
COPY --from=builder --chown=healink:healink /app/qrcode.js ./
COPY --from=builder --chown=healink:healink /app/css ./css
COPY --from=builder --chown=healink:healink /app/js ./js
COPY --from=builder --chown=healink:healink /app/app.js ./
COPY --from=builder --chown=healink:healink /app/app-shell.js ./
COPY --from=builder --chown=healink:healink /app/images ./images
COPY --from=builder --chown=healink:healink /app/locales ./locales
COPY --from=builder --chown=healink:healink /app/pages ./pages
COPY --from=builder --chown=healink:healink /app/content ./content

USER healink
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
