FROM node:12.13 AS builder
WORKDIR /app
COPY package.json /app
RUN npm i
COPY . /app
RUN npm run build

FROM nginx:latest
COPY --from=builder /app/dist /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80
