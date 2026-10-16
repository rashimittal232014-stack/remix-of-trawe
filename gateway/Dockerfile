FROM node:20-slim

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

COPY . .

ENV PORT=8787
ENV TRAWE_WA_DATA_DIR=/data/sessions
VOLUME ["/data"]
EXPOSE 8787

CMD ["node", "server.js"]
