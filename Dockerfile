# ================================
# FlameMitra - Sandhyaflames UI
# Angular 20 | Multi-stage Dockerfile
# ================================

# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build Angular production
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS final

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Add custom nginx config for Angular routing
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/sandhyaflames.conf

# Copy built Angular files
COPY --from=build /app/dist/sandhyaflames-ui/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
