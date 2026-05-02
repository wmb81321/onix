FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install

# Install Stripe Link CLI globally so agent can create/poll spend requests
RUN npm install -g @stripe/link-cli

COPY src ./src
COPY tsconfig.json ./

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]
