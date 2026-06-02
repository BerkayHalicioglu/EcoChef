# ─────────────────────────────────────────────────────────────────────────────
# EcoChef Mobile — Expo / React Native geliştirme sunucusu
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-slim

# curl: sağlık kontrolü için
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Önce bağımlılık dosyalarını kopyala → npm katmanı cache'lenir
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Kaynak kodu kopyala
COPY . .

# Metro bundler + Expo Dev Server portları
EXPOSE 8081 19000 19001 19002

# EXPO_PUBLIC_BACKEND_URL → docker-compose'dan gelir
# Fiziksel cihazın backend'e ulaşması için HOST_IP ortam değişkeni gerekir
ENV EXPO_PACKAGER_PROXY_URL=""

# --tunnel: Expo Go'nun farklı ağlardan bağlanabilmesi için ngrok tüneli kullanır
# Not: İlk çalıştırmada "npx expo login" yapmanız gerekebilir
CMD ["npx", "expo", "start", "--lan", "--non-interactive"]
