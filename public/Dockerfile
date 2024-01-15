FROM nginx:alpine

ARG PIC_CLIENT_PORT
ENV PIC_CLIENT_PORT=3381

RUN echo "ARG PIC_CLIENT_PORT=${PIC_CLIENT_PORT}"

COPY . /usr/share/nginx/html

COPY default.conf /etc/nginx/conf.d/

EXPOSE ${PIC_CLIENT_PORT}