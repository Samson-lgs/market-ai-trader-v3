FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY realtime-server.js ./
ENV NODE_ENV=production
EXPOSE 8787
CMD ["node", "realtime-server.js"]
