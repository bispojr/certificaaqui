FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD sh -c 'if [ "$RUN_MIGRATIONS" = "true" ]; then npx sequelize-cli db:migrate; fi && npm start'