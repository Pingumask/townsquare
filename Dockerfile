FROM node:24-alpine
RUN apk update
WORKDIR /app/townsquare
COPY . .
RUN npm rebuild && npm clean-install
EXPOSE 5173
CMD ["npm","run","dev"]
