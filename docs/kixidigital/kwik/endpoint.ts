import express from 'express';
import type { Request, Response, Router } from 'express';
import { AdaptadorKWiK, type PerfilKWiK } from './adaptador-kwik.ts';
import { receberWebhook } from './webhook.ts';
import { RepositorioPostgres, type PoolPg } from './repositorio-postgres.ts';
import type { PedidoCru, Repositorio } from './contrato.ts';

/**
 * Router Express para o webhook da KWiK.
 *
 * NÃO está montado em server.ts — a KixiDigital não é parte do runtime do
 * LingoLive (ver docs/kixidigital/relatorio.html, decisão #5). Isto é a
 * referência de como ligar o núcleo de webhook.ts a um servidor real, pronta
 * a montar assim que o produto tiver o seu próprio processo:
 *
 *   import { routerKWiK } from './endpoint.ts';
 *   app.use('/webhooks', routerKWiK(pool, perfilKWiK));
 *
 * `repositorio-postgres.ts` não importa `pg` (ver o seu próprio comentário de
 * topo), por isso este ficheiro também não obriga o LingoLive a instalar essa
 * dependência só para tornar este ficheiro válido — `pool` é fornecido por
 * quem monta o router, tipicamente uma instância real de `pg.Pool`.
 *
 * O único ponto delicado: a verificação HMAC precisa dos BYTES exactos do
 * corpo, tal como a KWiK os assinou. Se `express.json()` correr primeiro, o
 * corpo já foi parseado e reserializado — e um reserializado nem sempre é
 * byte-a-byte igual ao original (ordem de chaves, espaços). Por isso esta
 * rota usa `express.text()` com o próprio content-type, nunca o parser JSON
 * global da aplicação.
 */
export function routerKWiK(pool: PoolPg, perfil: PerfilKWiK): Router {
  const router = express.Router();
  const repo: Repositorio = new RepositorioPostgres(pool);
  const adaptador = new AdaptadorKWiK(perfil);

  router.post(
    '/kwik',
    express.text({ type: '*/*', limit: '256kb' }),
    async (req: Request, res: Response) => {
      const pedido: PedidoCru = {
        corpo: typeof req.body === 'string' ? req.body : '',
        cabecalhos: cabecalhosPlanos(req),
        recebidoEm: new Date(),
      };

      try {
        const resultado = await receberWebhook(adaptador, repo, pedido, new Date());
        // O corpo da resposta nunca ecoa dados internos: a operadora só
        // precisa de saber que recebemos, não do estado da nossa obrigação.
        res.status(resultado.estadoHttp).json({ recebido: resultado.estadoHttp < 400 });
      } catch (erro) {
        // Um 500 aqui faz a KWiK repetir mais tarde, que é o comportamento
        // certo para uma falha nossa (ligação à base de dados, por exemplo) —
        // ao contrário de um payload inválido, que é sempre 4xx e nunca repete.
        console.error('Falha ao processar webhook KWiK:', erro);
        res.status(500).json({ recebido: false });
      }
    },
  );

  return router;
}

function cabecalhosPlanos(req: Request): Record<string, string | undefined> {
  const saida: Record<string, string | undefined> = {};
  for (const [chave, valor] of Object.entries(req.headers)) {
    saida[chave] = Array.isArray(valor) ? valor[0] : valor;
  }
  return saida;
}
