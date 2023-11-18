
FROM node:16
WORKDIR /BACKEND_UPLOAD
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD npm start
