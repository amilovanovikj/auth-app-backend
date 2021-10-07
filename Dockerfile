# Build
FROM node:16-alpine AS build
WORKDIR /usr/src/app

COPY package.json yarn.lock tsconfig.json ./
RUN yarn install --frozen-lockfile --prod

COPY ./src ./src
RUN yarn build
 
# Package
FROM node:16-alpine AS package
RUN apk add dumb-init

ENV NODE_ENV production
USER node

WORKDIR /usr/src/app
COPY --chown=node:node --from=build /usr/src/app/node_modules node_modules
COPY --chown=node:node --from=build /usr/src/app/dist dist
COPY --chown=node:node BaltimoreCyberTrustRoot.crt.pem BaltimoreCyberTrustRoot.crt.pem

EXPOSE 4000
CMD ["dumb-init", "node", "dist/index.js"]