/**
 * KixiDigital — porta de integração com operadoras de pagamento.
 *
 * O núcleo desta integração não sabe o que é a KWiK. Fala com esta interface,
 * e cada operadora — KWiK, Unitel Money, Multicaixa Express — traz o seu
 * adaptador. Quando a documentação de parceiro de uma delas mudar, muda um
 * ficheiro: o núcleo, os testes e o livro-razão ficam intactos.
 *
 * Montantes SEMPRE em cêntimos de kwanza, sempre inteiros. Nunca vírgula
 * flutuante: 0,1 + 0,2 não dá 0,3, e num livro-razão isso é uma divergência.
 */

export type Canal = 'KWIK' | 'UNITEL_MONEY' | 'MULTICAIXA_EXPRESS' | 'DINHEIRO';

export type EstadoPagamento =
  | 'ALEGADO'
  | 'PENDENTE_RECONCILIACAO'
  | 'CONFIRMADO'
  | 'QUARENTENA'
  | 'ANULADO';

export interface Obrigacao {
  id: string;
  rodadaId: string;
  grupoId: string;
  devedorId: string;
  maeId: string;
  /** O que o membro deve, em cêntimos. Definido pelo servidor, nunca pelo payload. */
  montanteKz: number;
  estado: EstadoPagamento;
  canal?: Canal;
  /** Preenchido quando a rodada já entregou os fundos ao beneficiário. */
  rodadaEntregueEm?: Date;
}

/** Corpo cru tal como chegou ao endpoint, antes de qualquer interpretação. */
export interface PedidoCru {
  corpo: string;
  cabecalhos: Record<string, string | undefined>;
  recebidoEm: Date;
}

export type TipoNotificacao = 'LIQUIDADO' | 'REVERTIDO' | 'FALHADO';

/**
 * Forma normalizada de qualquer callback de operadora. É o que o núcleo
 * consome — nenhum campo específico da KWiK passa desta fronteira.
 */
export interface NotificacaoPagamento {
  operadora: Canal;
  /** Identificador da transação do lado da operadora. Base da idempotência. */
  referenciaExterna: string;
  /** A referência que nós demos à operadora ao iniciar a cobrança. */
  referenciaInterna: string;
  /** O que a operadora diz ter movido. Verificado, nunca aceite. */
  montanteKzAlegado: number;
  /** Identidade do pagador, já em hash. Detecta quem paga por conta de quem. */
  pagadorHash: string | null;
  ocorridoEm: Date;
  tipo: TipoNotificacao;
}

export interface LinhaExtracto {
  operadora: Canal;
  referenciaExterna: string;
  montanteKz: number;
  liquidadoEm: Date;
}

export interface PedidoCobranca {
  obrigacaoId: string;
  montanteKz: number;
  telemovelPagador: string;
  descricao: string;
}

export interface CobrancaIniciada {
  referenciaExterna: string;
  /** Deep link que abre a app da operadora com o valor preenchido. */
  ligacao: string;
  expiraEm: Date;
}

export class PayloadInvalido extends Error {
  constructor(public readonly campo: string, mensagem: string) {
    super(`Payload inválido no campo "${campo}": ${mensagem}`);
    this.name = 'PayloadInvalido';
  }
}

export interface ResultadoAssinatura {
  valida: boolean;
  motivo?: 'CABECALHO_AUSENTE' | 'FORA_DA_JANELA' | 'HMAC_NAO_BATE';
}

export interface AdaptadorOperadora {
  readonly canal: Canal;
  /** Verifica autenticidade e frescura. Nunca lança — devolve o motivo. */
  verificarAssinatura(pedido: PedidoCru, agora: Date): ResultadoAssinatura;
  /** Traduz o payload da operadora para a forma do núcleo. Lança PayloadInvalido. */
  normalizar(pedido: PedidoCru): NotificacaoPagamento;
  /** Lê o ficheiro de liquidação diário. É esta a prova, não o webhook. */
  importarExtracto(conteudo: string): LinhaExtracto[];
  iniciarCobranca(pedido: PedidoCobranca): Promise<CobrancaIniciada>;
}

// ---------------------------------------------------------------------------
// Portas de persistência. Implementadas sobre PostgreSQL em produção e em
// memória nos testes — o núcleo não distingue.
// ---------------------------------------------------------------------------

export interface Lancamento {
  conta: string;
  montanteKz: number;
}

export interface Divergencia {
  tipo:
    | 'SEM_OBRIGACAO'
    | 'MONTANTE_DIFERE'
    | 'REVERSAO_APOS_ENTREGA'
    | 'REVERSAO_SEM_LIQUIDACAO'
    | 'PAGADOR_INESPERADO'
    | 'SEM_EXTRACTO'
    | 'SEM_WEBHOOK';
  obrigacaoId?: string;
  detalhe: Record<string, unknown>;
}

export interface Repositorio {
  /** Grava o evento cru. Devolve DUPLICADO se a chave já existir. */
  registarEvento(chave: string, pedido: PedidoCru, assinaturaValida: boolean): Promise<'NOVO' | 'DUPLICADO'>;
  obrigacaoPorReferencia(referenciaInterna: string): Promise<Obrigacao | null>;
  transitar(obrigacaoId: string, de: EstadoPagamento[], para: EstadoPagamento, canal?: Canal): Promise<boolean>;
  /** Escreve uma transação no razão. Os lançamentos têm de somar zero. */
  lancar(chaveIdempotencia: string, tipo: string, ocorridoEm: Date, lancamentos: Lancamento[]): Promise<void>;
  abrirDivergencia(d: Divergencia): Promise<void>;
  sinalRisco(regra: string, detalhe: Record<string, unknown>): Promise<void>;
}
