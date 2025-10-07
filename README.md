# LinkSnap

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-brightgreen)](https://nodejs.org) [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/atlas) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**LinkSnap** é um encurtador de URL moderno e instantâneo, construído com Node.js, Express e MongoDB. Transforme URLs longas e chatas em links curtos, elegantes e rastreáveis num estalo de dedos. Ideal para projetos web, APIs ou apps mobile. É minimalista, escalável e pronto para produção!

Inspirado em ferramentas como Bitly, mas com foco em simplicidade e privacidade. Suporta analytics básicos (cliques) e é fácil de estender com features como QR codes ou custom URLs.

## 🚀 Funcionalidades

- **Encurtamento Rápido**: Gere links curtos únicos usando `shortid` (ex: `abc123`) ou customizados.
- **Redirecionamento Automático**: Clique no link curto e vá direto para o original, com checagem de expiração.
- **Analytics Básico**: Conta cliques por link (armazenado no MongoDB), com endpoint dedicado.
- **Cache com Redis**: Redirecionamentos rápidos via cache para melhor performance.
- **API RESTful**: Endpoints para encurtar, redirecionar e analytics.
- **Validação**: Verifica se a URL original é válida, evita duplicatas, valida códigos customizados.
- **Expiração de Links**: Defina data de expiração para links temporários.
- **Segurança**: Rate limiting, headers seguros, HTTPS forçado em produção.
- **Logging**: Logs estruturados com Winston para monitoramento.
- **Interface Web**: Aplicação React moderna para encurtar URLs e visualizar analytics.

## 📋 Pré-requisitos

- Node.js (versão LTS 20+)
- MongoDB (use [MongoDB Atlas](https://www.mongodb.com/atlas) para cloud gratuito ou Docker para local)
- Git (opcional, para clonar o repo)
- Docker e Docker Compose (opcional, para MongoDB local)

## 🐳 Configuração com Docker (Opcional)

Para usar MongoDB e Redis locais via Docker em vez do Atlas:

1. Na raiz do projeto, execute:

   ```bash
   docker compose up -d
   ```

   Isso iniciará o MongoDB na porta 27017 e Redis na porta 6379.

2. Atualize o `.env` para usar os serviços locais:

   ```
   MONGODB_URI=mongodb://root:example@localhost:27017/linksnap?authSource=admin
   REDIS_URL=redis://localhost:6379
   PORT=3000
   BASE_URL=http://localhost:3000
   ```

3. Para parar os serviços: `docker compose down`

## 🛠️ Instalação

1. Clone o repositório (ou crie um novo com a estrutura abaixo):

   ```bash
   git clone <seu-repo-url> linksnap
   cd linksnap
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Configure o ambiente:

   - Crie um arquivo `.env` na raiz do projeto:
     ```
     MONGODB_URI=mongodb+srv://seu-user:senha@cluster.mongodb.net/linksnap?retryWrites=true&w=majority
     PORT=3000
     BASE_URL=http://localhost:3000
     ```
     - Para MongoDB Atlas: Substitua `MONGODB_URI` pela string de conexão do seu cluster (crie um gratuito em [MongoDB Atlas](https://www.mongodb.com/atlas)).
     - Para MongoDB local via Docker: Use `MONGODB_URI=mongodb://root:example@localhost:27017/linksnap?authSource=admin` (veja seção Docker acima).
     - `PORT` e `BASE_URL` são opcionais (padrão: 3000 e localhost).

4. Rode o projeto em modo desenvolvimento:
   ```bash
   npm run dev
   ```
   - O servidor inicia em `http://localhost:3000`.
   - Para produção: `npm start`.

### Build do Client

O client é uma aplicação React construída com Vite.

1. Navegue para o diretório client:

   ```bash
   cd client
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Execute o build para produção:
   ```bash
   npm run build
   ```
   - Os arquivos otimizados serão gerados em `client/dist/`.
   - Para preview local: `npm run preview`.
   - Para desenvolvimento: `npm run dev`.

## 📖 Uso

### Via Interface Web

- Acesse `http://localhost:3000` (servidor) ou execute o client separadamente.
- Para o client React: Navegue para `client/`, execute `npm run dev` para desenvolvimento ou `npm run build` para produção.
- Cole uma URL no formulário e clique em "Encurtar!".
- Exemplo: Encurte `https://www.google.com` e receba algo como `http://localhost:3000/abc123`.
- Clique no link curto para redirecionar e ver o analytics no banco.

### Via API (recomendado para integrações)

Use ferramentas como Postman, curl ou fetch em JS.

1. **Encurtar URL** (POST `/api/shorten`):

   ```bash
   curl -X POST http://localhost:3000/api/shorten \
     -H "Content-Type: application/json" \
     -d '{"originalUrl": "https://www.exemplo.com/pagina-longa", "customCode": "meulink", "expiresAt": "2024-12-31T23:59:59Z"}'
   ```

   Parâmetros opcionais: `customCode` (alfanumérico único), `expiresAt` (ISO 8601).

   Resposta:

   ```json
   {
     "shortUrl": "localhost:3000/meulink",
     "message": "URL encurtada com sucesso!"
   }
   ```

2. **Redirecionamento** (GET `/:shortCode`):

   - Acesse `http://localhost:3000/abc123` – redireciona para a URL original e incrementa o contador de cliques. Retorna 410 se expirado.

3. **Analytics** (GET `/api/analytics/:shortCode`):

   ```bash
   curl http://localhost:3000/api/analytics/abc123
   ```

   Resposta:

   ```json
   {
     "originalUrl": "https://www.exemplo.com",
     "shortCode": "abc123",
     "clicks": 42,
     "createdAt": "2023-10-01T00:00:00.000Z",
     "expiresAt": null
   }
   ```

### Ver Analytics

- Use o MongoDB Compass ou shell para query na coleção `urls`:
  ```javascript
  db.urls.find({ shortCode: "abc123" }); // Mostra cliques, data de criação, etc.
  ```

## 🏗️ Estrutura do Projeto

```
linksnap/
├── client/            # Aplicação frontend React com Vite
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── server.js          # Servidor principal (Express + MongoDB)
├── models/
│   └── Url.js         # Schema Mongoose para URLs
├── routes/
│   └── urls.js        # Rotas da API (encurtar e redirecionar)
├── docker-compose.yml # Configuração Docker para MongoDB local (opcional)
├── .env               # Variáveis de ambiente (NÃO commite!)
├── package.json       # Dependências e scripts
└── README.md          # Este arquivo
```
