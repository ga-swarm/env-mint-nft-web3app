FROM debian:buster-slim

RUN mkdir /build

COPY ./build/ /build

#COPY docker-compose-prod.yaml /build

#VOLUME ["/build"]