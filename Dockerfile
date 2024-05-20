#Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

#Production stage
FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]