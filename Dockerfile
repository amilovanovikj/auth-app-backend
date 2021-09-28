# Build stage
FROM node:16-alpine AS build
WORKDIR /home/auth-app-backend

COPY package.json yarn.lock tsconfig.json ./
RUN yarn

COPY ./src ./src
RUN yarn build

# Package stage
FROM node:16-alpine as package
WORKDIR /home/auth-app-backend

COPY package.json ./
COPY .env .env
RUN yarn
COPY --from=build /home/auth-app-backend/dist ./dist

EXPOSE 4000
CMD node ./dist/index.js
USER node
