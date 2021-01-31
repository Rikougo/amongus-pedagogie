FROM node:12.13 AS builder
WORKDIR /app
COPY package.json /app
RUN npm i
COPY . /app

CMD ["npm", "start"]

EXPOSE 2001

