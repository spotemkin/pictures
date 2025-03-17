FROM node:20-alpine

WORKDIR /app

ENV ALBUM_LIST_PATH=/data/pics/sys/album-data/album-list.txt
ENV PIC_SERVER_PORT=3000
ENV EMAIL=draste@imola.io
ENV PIC_DOMAIN=cars.imola.io
ENV MAIN_DOMAIN=cars.imola.io
ENV MAIN_HOST=cars.imola.io

RUN ls -la /app
# User permissions for HestiaCP
RUN adduser -D -u 1001 dns && chown -R dns:dns /app

COPY package*.json ./

RUN npm install

COPY public /app/public

COPY . .

RUN chown -R dns:dns /app

EXPOSE 3000

USER dns

CMD ["node", "server.js"]