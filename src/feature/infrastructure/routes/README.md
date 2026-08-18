# Infrastructure Routes (`feature/infrastructure/routes`)

Especificação dos caminhos, endpoints HTTP, controladores HTTP e middlewares para expor serviços criados nesta funcionalidade para a internet ou para chamadas internas do frontend.

## O que colocar aqui
- Definição de endpoints como `POST /api/sessions/start`.
- Controladores Express (`app.post('/api/create-checkout', (req, res) => { ... })`).
- Middlewares de autorização para as rotas baseados em token ou cookies.
