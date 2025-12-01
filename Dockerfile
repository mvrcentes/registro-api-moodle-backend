FROM oven/bun:1 AS app

WORKDIR /app

# 🔧 Instalamos netcat y openssl (requerido por Prisma)
RUN apt-get update && apt-get install -y netcat-openbsd openssl && rm -rf /var/lib/apt/lists/*

# Copiamos manifiestos
COPY package.json bun.lockb* package-lock.json* ./

# Instalamos dependencias
RUN bun install

# Copiamos el resto
COPY . .

ENV NODE_ENV=production
ENV PORT=4000

# EntryPoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bun", "run", "start"]