import type { Lancamento, Obrigacao } from './contrato.ts';

/**
 * Divisão da contribuição pelas contas de destino.
 *
 * Percentagens em pontos-base (1 pb = 0,01%) para que a aritmética seja
 * inteira do princípio ao fim:
 *   plataforma  100 pb = 1,0%
 *   mãe          50 pb = 0,5%
 *   operadora    50 pb = 0,5%
 *
 * A armadilha: 1% de 2.500.001 cêntimos é 25.000,01. Se cada parcela for
 * arredondada à parte, as quatro somas deixam de fechar em zero e a constraint
 * do razão rejeita a transação inteira — em produção isso seria um pagamento
 * legítimo a falhar por causa de um cêntimo.
 *
 * Regra: as comissões arredondam para BAIXO e o resto vai para o fundo do
 * grupo. O grupo nunca perde cêntimos para o arredondamento, e a soma fecha
 * sempre por construção, porque o fundo é calculado por subtracção.
 */

export const PB_PLATAFORMA = 100;
export const PB_MAE = 50;
export const PB_OPERADORA = 50;

export interface DivisaoContribuicao {
  fundoGrupo: number;
  plataforma: number;
  mae: number;
  operadora: number;
}

export function dividirContribuicao(montanteKz: number, canalDigital: boolean): DivisaoContribuicao {
  if (!Number.isSafeInteger(montanteKz) || montanteKz <= 0) {
    throw new RangeError(`Montante tem de ser um inteiro positivo de cêntimos, recebido: ${montanteKz}`);
  }

  // Pagamento em numerário não gera comissão: a plataforma só cobra sobre o
  // que consegue verificar com um terceiro. Ver arquitetura-antifraude.html.
  if (!canalDigital) {
    return { fundoGrupo: montanteKz, plataforma: 0, mae: 0, operadora: 0 };
  }

  const plataforma = Math.floor((montanteKz * PB_PLATAFORMA) / 10_000);
  const mae = Math.floor((montanteKz * PB_MAE) / 10_000);
  const operadora = Math.floor((montanteKz * PB_OPERADORA) / 10_000);
  const fundoGrupo = montanteKz - plataforma - mae - operadora;

  return { fundoGrupo, plataforma, mae, operadora };
}

/** Traduz a divisão em lançamentos de partida dobrada. Somam sempre zero. */
export function lancamentosContribuicao(o: Obrigacao, canalDigital: boolean): Lancamento[] {
  const d = dividirContribuicao(o.montanteKz, canalDigital);
  const linhas: Lancamento[] = [
    { conta: `grupo:${o.grupoId}:fundo`, montanteKz: d.fundoGrupo },
    { conta: `membro:${o.devedorId}:obrigacao`, montanteKz: -o.montanteKz },
  ];
  if (d.plataforma > 0) linhas.push({ conta: 'plataforma:receita_taxa', montanteKz: d.plataforma });
  if (d.mae > 0) linhas.push({ conta: `mae:${o.maeId}:comissao`, montanteKz: d.mae });
  if (d.operadora > 0) {
    linhas.push({ conta: `operadora:${o.canal ?? 'KWIK'}:processamento`, montanteKz: d.operadora });
  }
  return linhas;
}

/** Estorno: os mesmos lançamentos com o sinal trocado. Nunca um UPDATE. */
export function lancamentosEstorno(linhas: Lancamento[]): Lancamento[] {
  return linhas.map((l) => ({ conta: l.conta, montanteKz: -l.montanteKz }));
}
