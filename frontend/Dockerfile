# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Accept build args
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE
ARG VITE_SUPPORT_EMAIL
ENV VITE_SUPPORT_EMAIL=$VITE_SUPPORT_EMAIL
# The path the gateway serves daily-checkin under (default /daily-checkin/),
# mirroring MTSS's own VITE_BASE_PATH (default /mtss/).
ARG VITE_BASE_PATH=/daily-checkin/
ENV VITE_BASE_PATH=$VITE_BASE_PATH

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:1.27-alpine AS runner

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets into the /daily-checkin subdir so /daily-checkin/* paths
# match naturally, same as MTSS does for its own /mtss subdir.
COPY --from=build /app/dist /usr/share/nginx/html/daily-checkin

# Health check (uses /healthz; root '/' redirects to /daily-checkin/)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/healthz || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
