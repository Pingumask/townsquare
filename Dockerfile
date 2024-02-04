FROM node:18
RUN apt update && apt install -y\
    git\
    && apt clean
WORKDIR /app/townsquare
COPY package*.json .
RUN npm rebuild
RUN npm clean-install
# npm rebuild avoids having misconfigurations if npm install has been run in the folder from windows before building the docker image
COPY . .
CMD ["npm","run","serve"]
