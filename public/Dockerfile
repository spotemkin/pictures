FROM nginx:alpine

ARG PIC_CLIENT_PORT
ENV PIC_CLIENT_PORT=3381

RUN echo "ARG PIC_CLIENT_PORT=${PIC_CLIENT_PORT}"

COPY . /usr/share/nginx/html

COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE ${PIC_CLIENT_PORT}