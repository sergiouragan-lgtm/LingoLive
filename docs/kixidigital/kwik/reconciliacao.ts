import type { Canal, Divergencia, LinhaExtracto, Repositorio } from './contrato.ts';

/**
 * Reconciliação nocturna: cruza o que a operadora liquidou com o que o nosso
 * razão diz ter recebido. É aqui que uma obrigação passa finalmente a
 * CONFIRMADO — e é a única promoção que liberta uma entrega.
 *
 * Roda todas as noites sobre o dia anterior. A métrica a vigiar desde o
 * primeiro grupo do piloto: nenhuma divergência aberta há mais de 72 horas.
 */

export interface PendenteInterno {
  obrigacaoId: string;
  referenciaExterna: string;
  montanteKz: number;
  desde: Date;
}

export interface ResultadoReconciliacao {
  confirmadas: string[];
  divergencias: Divergencia[];
}

export const PRAZO_SEM_EXTRACTO_MS = 48 * 60 * 60 * 1000;

export async function reconciliar(
  repo: Repositorio,
  operadora: Canal,
  pendentes: PendenteInterno[],
  extracto: LinhaExtracto[],
  agora: Date,
): Promise<ResultadoReconciliacao> {
  const porReferencia = new Map(
    extracto.filter((l) => l.operadora === operadora).map((l) => [l.referenciaExterna, l]),
  );
  const vistas = new Set<string>();
  const confirmadas: string[] = [];
  const divergencias: Divergencia[] = [];

  for (const p of pendentes) {
    const linha = porReferencia.get(p.referenciaExterna);

    if (!linha) {
      // Ainda pode aparecer no extracto de amanhã — as operadoras liquidam com
      // atraso. Só passadas 48h é que a ausência deixa de ter explicação boa.
      if (agora.getTime() - p.desde.getTime() > PRAZO_SEM_EXTRACTO_MS) {
        divergencias.push({
          tipo: 'SEM_EXTRACTO',
          obrigacaoId: p.obrigacaoId,
          detalhe: { referenciaExterna: p.referenciaExterna, desde: p.desde.toISOString() },
        });
      }
      continue;
    }

    vistas.add(p.referenciaExterna);

    if (linha.montanteKz !== p.montanteKz) {
      divergencias.push({
        tipo: 'MONTANTE_DIFERE',
        obrigacaoId: p.obrigacaoId,
        detalhe: { extracto: linha.montanteKz, interno: p.montanteKz },
      });
      await repo.transitar(p.obrigacaoId, ['PENDENTE_RECONCILIACAO'], 'QUARENTENA');
      continue;
    }

    if (await repo.transitar(p.obrigacaoId, ['PENDENTE_RECONCILIACAO'], 'CONFIRMADO')) {
      confirmadas.push(p.obrigacaoId);
    }
  }

  // O sentido inverso, que é o que apanha webhooks perdidos: a operadora
  // liquidou dinheiro que o nosso lado nunca registou. Sem esta metade, um
  // membro paga, o callback perde-se, e ele fica marcado como devedor.
  for (const linha of porReferencia.values()) {
    if (!vistas.has(linha.referenciaExterna)) {
      divergencias.push({
        tipo: 'SEM_WEBHOOK',
        detalhe: {
          referenciaExterna: linha.referenciaExterna,
          montanteKz: linha.montanteKz,
          liquidadoEm: linha.liquidadoEm.toISOString(),
        },
      });
    }
  }

  for (const d of divergencias) await repo.abrirDivergencia(d);
  return { confirmadas, divergencias };
}
