FROM node:20-alpine
WORKDIR /app

# Paket listelerini kopyala
COPY package*.json ./

# Bağımlılıkları kur (Geliştirme paketleri dahil)
RUN npm install

# Kalan dosyaları kopyala
COPY . .

# Portu ayarla
EXPOSE 3000

# Vite'i npx ile direkt node_modules içinden çağırarak çalıştır
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "3000"]