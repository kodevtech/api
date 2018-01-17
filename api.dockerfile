FROM node:8.9.3

COPY package.json ./

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

## Storing node modules on a separate layer will prevent unnecessary npm installs at each build
RUN npm i
RUN npm install pm2 -g
RUN npm install -g sequelize-cli --no-optional

RUN mkdir /api
RUN chown -R node:node /api
RUN cp -R ./node_modules ./api

WORKDIR /api

USER node

COPY . .

RUN mv docker.env .env

RUN sequelize db:migrate
RUN sequelize db:seed:all

CMD ["pm2-runtime", "index.js"]
