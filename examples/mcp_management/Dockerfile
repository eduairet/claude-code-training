FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY contracts/ contracts/
COPY test/ test/
COPY hardhat.config.ts tsconfig.json ./

CMD ["npx", "hardhat", "test"]
