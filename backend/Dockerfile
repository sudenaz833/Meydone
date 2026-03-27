# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
  && npm cache clean --force

COPY . .

RUN chown -R node:node /app

USER node

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "server.js"]
