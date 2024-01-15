FROM node:20-alpine

WORKDIR /usr/src/app

ARG ALBUM_LIST_PATH
ENV ALBUM_LIST_PATH ${ALBUM_LIST_PATH}
ARG PIC_SERVER_PORT
ENV PIC_SERVER_PORT ${PIC_SERVER_PORT}

RUN echo "ARG ALBUM_LIST_PATH=${ALBUM_LIST_PATH}"
RUN echo "ARG PIC_SERVER_PORT=${PIC_SERVER_PORT}"

COPY package*.json ./

RUN npm install

COPY server.js .
# COPY album-list.txt .  //from server volume

EXPOSE ${PIC_SERVER_PORT}

CMD ["node", "server.js"]