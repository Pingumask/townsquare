FROM node:22
RUN apt update && apt install -y\
    git\
    && apt clean
WORKDIR /app/townsquare
COPY . .
RUN npm rebuild && npm clean-install
EXPOSE 5173 8079
CMD ["npm","run","dev"]
