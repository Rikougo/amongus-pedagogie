FROM node:12.13 AS builder
WORKDIR /app
COPY package.json /app
RUN npm i
COPY . /app
RUN npm run build
RUN ls /app/dist/client

FROM nginx:latest
COPY --from=builder /app/dist/client /usr/share/nginx/html
RUN ls /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80
