FROM node:20-slim

WORKDIR /app

# Copy agent package.json and install dependencies
COPY agent/package.json ./
RUN npm install

# Copy agent source
COPY agent/src ./src
COPY agent/tsconfig.json ./

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]
