# syntax=docker/dockerfile:1.7-labs

############
# Builder  #
############
FROM node:20-alpine AS builder
WORKDIR /admin

# Install deps first for better caching
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm i --no-audit --no-fund; fi

# Copy rest of the source
COPY . .

# ---- Optional build-time overrides for Vite envs ----
# They override .env.production if provided at build time
ARG VITE_API_BASE_URL
ARG VITE_SERVICE_AUTH_ORIGIN
ARG VITE_SERVICE_APP_ORIGIN
ARG VITE_SERVICE_MARKETING_ORIGIN
ARG VITE_AFTER_LOGIN_URL
ARG VITE_AFTER_LOGOUT_URL
ARG VITE_ABOUT_URL
ARG VITE_TERMS_URL
ARG VITE_PRIVACY_URL
ARG VITE_AUTH_TOKENS_MODE
ARG VITE_ALLOWED_ORIGINS
ARG VITE_APP_NAME

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SERVICE_AUTH_ORIGIN=${VITE_SERVICE_AUTH_ORIGIN}
ENV VITE_SERVICE_APP_ORIGIN=${VITE_SERVICE_APP_ORIGIN}
ENV VITE_SERVICE_MARKETING_ORIGIN=${VITE_SERVICE_MARKETING_ORIGIN}
ENV VITE_AFTER_LOGIN_URL=${VITE_AFTER_LOGIN_URL}
ENV VITE_AFTER_LOGOUT_URL=${VITE_AFTER_LOGOUT_URL}
ENV VITE_ABOUT_URL=${VITE_ABOUT_URL}
ENV VITE_TERMS_URL=${VITE_TERMS_URL}
ENV VITE_PRIVACY_URL=${VITE_PRIVACY_URL}
ENV VITE_AUTH_TOKENS_MODE=${VITE_AUTH_TOKENS_MODE}
ENV VITE_ALLOWED_ORIGINS=${VITE_ALLOWED_ORIGINS}
ENV VITE_APP_NAME=${VITE_APP_NAME}
# -----------------------------------------------------

ENV NODE_ENV=production
RUN npm run build

############
# Runtime  #
############
FROM nginx:1.27-alpine AS runner
# Replace the default site with our SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# App assets
COPY --from=builder /admin/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
