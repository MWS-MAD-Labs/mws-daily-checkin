FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache git && npm ci --omit=dev

FROM node:18-alpine AS runner

WORKDIR /app

# The commit this image was built from. The health address reports it.
ARG APP_VERSION=unknown
ENV APP_VERSION=$APP_VERSION

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p logs uploads

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/server.js"]
