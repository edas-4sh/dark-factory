FROM node:20-alpine
WORKDIR /app
COPY package.json turbo.json tsconfig.json ./
COPY packages/ packages/
COPY services/ services/
RUN npm install && npm run build
EXPOSE 3001 5173
