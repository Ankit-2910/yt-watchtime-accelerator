# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps (cached unless lockfile/package.json change)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .
# Generate Prisma client (no DB needed at build time)
RUN npx prisma generate || true
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy only what's needed to run `next start`
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start"]
