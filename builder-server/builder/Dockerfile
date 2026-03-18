FROM node:20-alpine

RUN apk add --no-cache git bash su-exec

RUN addgroup -S builder && adduser -S builder -G builder

WORKDIR /home/app

COPY package*.json ./
RUN npm install

COPY script.js .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

RUN mkdir -p /home/app/output

CMD ["./entrypoint.sh"]