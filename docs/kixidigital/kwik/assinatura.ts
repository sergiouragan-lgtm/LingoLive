import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PedidoCru, ResultadoAssinatura } from './contrato.ts';

/**
 * Verificação de assinatura de webhook, no esquema que praticamente todas as
 * operadoras usam: HMAC-SHA256 sobre "<carimbo>.<corpo>".
 *
 * Três detalhes que decidem se isto serve para alguma coisa:
 *
 *  1. O carimbo entra no HMAC. Sem isso, um atacante que capte um callback
 *     legítimo pode reenviá-lo para sempre — a assinatura continua válida.
 *  2. A comparação é timing-safe. Uma comparação normal (===) vaza, pelo tempo
 *     que demora, quantos bytes iniciais acertaram, e permite reconstruir a
 *     assinatura byte a byte.
 *  3. A janela de tolerância é apertada. Relógios desalinham-se; cinco minutos
 *     chegam para isso e são curtos para um ataque de repetição.
 */

export const JANELA_TOLERANCIA_MS = 5 * 60 * 1000;

export interface OpcoesAssinatura {
  segredo: string;
  cabecalhoAssinatura: string;
  cabecalhoCarimbo: string;
  janelaMs?: number;
}

export function verificarHmac(
  pedido: PedidoCru,
  agora: Date,
  opcoes: OpcoesAssinatura,
): ResultadoAssinatura {
  const assinatura = pedido.cabecalhos[opcoes.cabecalhoAssinatura];
  const carimbo = pedido.cabecalhos[opcoes.cabecalhoCarimbo];
  if (!assinatura || !carimbo) return { valida: false, motivo: 'CABECALHO_AUSENTE' };

  const carimboMs = Number(carimbo) * 1000;
  if (!Number.isFinite(carimboMs)) return { valida: false, motivo: 'CABECALHO_AUSENTE' };

  const janela = opcoes.janelaMs ?? JANELA_TOLERANCIA_MS;
  // Valor absoluto: um carimbo no futuro é tão suspeito como um no passado.
  if (Math.abs(agora.getTime() - carimboMs) > janela) {
    return { valida: false, motivo: 'FORA_DA_JANELA' };
  }

  const esperada = createHmac('sha256', opcoes.segredo)
    .update(`${carimbo}.${pedido.corpo}`)
    .digest();

  let recebida: Buffer;
  try {
    recebida = Buffer.from(assinatura, 'hex');
  } catch {
    return { valida: false, motivo: 'HMAC_NAO_BATE' };
  }
  // timingSafeEqual exige comprimentos iguais; comparar antes evita a excepção
  // e não vaza nada de útil, porque o comprimento do HMAC é público.
  if (recebida.length !== esperada.length) return { valida: false, motivo: 'HMAC_NAO_BATE' };
  if (!timingSafeEqual(recebida, esperada)) return { valida: false, motivo: 'HMAC_NAO_BATE' };

  return { valida: true };
}

/** Usado nos testes e no simulador de sandbox para produzir cabeçalhos válidos. */
export function assinar(corpo: string, segredo: string, agora: Date): { assinatura: string; carimbo: string } {
  const carimbo = String(Math.floor(agora.getTime() / 1000));
  const assinatura = createHmac('sha256', segredo).update(`${carimbo}.${corpo}`).digest('hex');
  return { assinatura, carimbo };
}
