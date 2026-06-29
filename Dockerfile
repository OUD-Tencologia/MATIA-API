FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps

ENV TZ=America/Cuiaba

COPY . .

# Build do TypeScript
RUN npm run build

EXPOSE 3002

# Produção: roda o JS compilado
CMD ["npm", "run", "start"]
