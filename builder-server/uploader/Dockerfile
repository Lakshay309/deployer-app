FROM node:20-alpine

RUN addgroup -S uploader && adduser -S uploader -G uploader

WORKDIR /home/app

COPY package*.json .
RUN npm install

COPY script.js .

RUN mkdir -p /home/app/output/dist && chown uploader:uploader /home/app/output

USER uploader

CMD ["node","script.js"]