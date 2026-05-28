FROM node:20-alpine AS frontend
WORKDIR /app
COPY web/package*.json ./
RUN npm ci
COPY web/ .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=frontend /app/dist /usr/share/nginx/html/admin
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
