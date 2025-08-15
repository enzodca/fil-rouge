FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 4200

ENV NG_CLI_ANALYTICS=false

CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll", "2000"]
