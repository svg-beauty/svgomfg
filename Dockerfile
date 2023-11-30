FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY . ./
RUN npm run build

FROM nginx:1.25.3-alpine-slim

COPY --from=builder /app/build /usr/share/nginx/html/
