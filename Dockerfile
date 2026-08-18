# LingoLIVE IA — Dockerfile de Produção (Multi-Stage)
#
# Stage 1 (builder): instala TODAS as dependências (incluindo dev) e compila
# o frontend (Vite) + backend (esbuild) para dist/.
# Stage 2 (runtime): imagem final enxuta, só com dependências de produção e
# os artefactos já compilados — reduz superfície de ataque e tamanho da imagem.

FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Utilizador não-root (boas práticas de segurança de contentores — evita que
# um processo comprometido dentro do contentor tenha privilégios de root).
RUN groupadd --system lingolive && useradd --system --gid lingolive lingolive

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

USER lingolive

EXPOSE 8080
ENV PORT=8080

# Healthcheck nativo do contentor — permite ao Cloud Run e a orquestradores
# genéricos (Kubernetes, Docker Swarm) detetar automaticamente um contentor
# não saudável sem depender só do endpoint externo.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||8080)+'/api/service-health/public',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.cjs"]
