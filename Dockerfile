FROM node:17
COPY src /app/src
COPY package.json /app/package.json
WORKDIR /app
RUN npm install
CMD npm start