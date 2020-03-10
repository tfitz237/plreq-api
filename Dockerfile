FROM node:lts

WORKDIR /app
COPY . .
RUN npm install -g @nestjs/cli
RUN npm install
RUN npm run build
CMD [ "npm", "run", "start:prod"]