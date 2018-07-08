FROM node:10.4.0

RUN mkdir -p /daemon
WORKDIR /daemon

COPY . .

RUN npm install
RUN npm run build
RUN npm link
