FROM node:20-alpine
WORKDIR /backend
# Bağımlılıkları kopyala ve yükle
COPY package*.json ./
RUN npm ci
# Tüm kodu kopyala
COPY . .
# Slayttaki gibi portu 9000 yapıyoruz
ENV PORT=9000
EXPOSE 9000
# Senin dosyanın adı server.js olduğu için bunu çalıştırıyoruz
CMD ["node", "server.js"]