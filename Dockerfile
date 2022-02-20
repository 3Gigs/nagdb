FROM node:17-alpine3.14

RUN ["apk", "update"]
RUN ["apk", "upgrade"]
RUN ["apk", "add", "libsodium", "make", "libtool", "autoconf", "automake", "python3", "g++"]

WORKDIR nagdb/
COPY package*.json ./
COPY ./build/ ./build/
RUN ["npm", "install"]
CMD ["npm", "run", "start"]

