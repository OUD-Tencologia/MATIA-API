FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps

ENV TZ=America/Cuiaba

COPY . .

EXPOSE 3002

CMD ["npm", "run", "dev"]