FROM node:20-alpine

RUN apk add --no-cache git bash

RUN addgroup -S builder && adduser -S builder -G builder

WORKDIR /home/app

COPY package*.json ./
RUN npm install

COPY script.js .

RUN mkdir -p /home/app/output && chown builder:builder /home/app/output

USER builder

CMD ["node", "script.js"]