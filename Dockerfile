FROM node:24-alpine
RUN apk update
WORKDIR /app/townsquare
COPY . .
RUN npm rebuild && npm clean-install
EXPOSE 80
CMD ["npm","run","dev"]
