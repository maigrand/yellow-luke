FROM node:16-alpine

WORKDIR /app

COPY ./package*.json ./
RUN npm install
COPY ./ ./
RUN npm run register-commands
RUN npm run build

CMD [ "node", "build/index.js" ]