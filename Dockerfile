# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/express-app/mails ./dist/src/express-app/mails
COPY --from=builder /app/.env ./dist/.env
COPY --from=builder /app/.env ./

EXPOSE 8000

# Start the application and keep container running
# CMD ["tail", "-f", "/dev/null"]
#  node dist/src/main
CMD ["node", "dist/src/main"]