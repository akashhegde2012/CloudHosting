FROM node:14

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

ARG PORT=some_default_value 

# ENV PORT=${PORT}

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 8080

EXPOSE 27018

CMD [ "npm", "start" ]