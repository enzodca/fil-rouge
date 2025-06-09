# Étape 1 : build Angular
FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --configuration=production

# Étape 2 : Nginx pour servir le build Angular
FROM nginx:alpine
COPY --from=builder /app/dist/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
