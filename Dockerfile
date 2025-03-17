FROM node:20-alpine

WORKDIR /app

ENV ALBUM_LIST_PATH=/data/pics/sys/album-data/album-list.txt
ENV PIC_SERVER_PORT=3000
ENV EMAIL=draste@imola.io
ENV PIC_DOMAIN=cars.imola.io
ENV MAIN_DOMAIN=cars.imola.io
ENV MAIN_HOST=cars.imola.io

RUN mkdir -p /app/logs

COPY package*.json ./

RUN npm install

COPY public /app/public

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
