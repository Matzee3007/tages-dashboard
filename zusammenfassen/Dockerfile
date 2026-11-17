# Container für die Zusammenfassungen der KI-News und die Spielberichte (ADR 0010, ADR 0013). Start über compose.yaml im Wurzelordner.
FROM node:24-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json ./
COPY lib ./lib
COPY zusammenfassen ./zusammenfassen
USER node
CMD ["npx", "tsx", "zusammenfassen/lauf.ts"]
