FROM node:20-alpine

WORKDIR /app

ARG ALBUM_LIST_PATH
ENV ALBUM_LIST_PATH=${ALBUM_LIST_PATH}
ARG PIC_SERVER_PORT
ENV PIC_SERVER_PORT=${PIC_SERVER_PORT}

RUN echo "ARG ALBUM_LIST_PATH=${ALBUM_LIST_PATH}"
RUN echo "ARG PIC_SERVER_PORT=${PIC_SERVER_PORT}"

# for debug
RUN ls -la /app
# User permissions for HestiaCP
RUN adduser -D -u 1001 dns && chown -R dns:dns /app

COPY package*.json ./

RUN npm install

COPY public /app/public

COPY . .

# Set correct permissions
RUN chown -R dns:dns /app

EXPOSE ${PIC_SERVER_PORT}

USER dns

CMD ["node", "server.js"]