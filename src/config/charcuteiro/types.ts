// ============================================================
// MESTRE CHARCUTEIRO — Tipos e Interfaces do Núcleo Especialista
// Fase 1: Motor Técnico de Formulação
// ============================================================

// -----------------------------------------------------------
// ENUMERAÇÕES BASE
// -----------------------------------------------------------

export enum TipoProcesso {
  CURA_SECA = 'cura_seca',
  CURA_UMIDA = 'cura_umida',
  FERMENTACAO = 'fermentacao',
  DEFUMACAO = 'defumacao',
  COZIMENTO = 'cozimento',
  MATURACAO = 'maturacao',
  EMULSIFICACAO = 'emulsificacao',
}

export enum CategoriaIngrediente {
  PROTEINA_ANIMAL = 'proteina_animal',
  GORDURA = 'gordura',
  SAL_CURA = 'sal_cura',
  NITRITO_NITRATO = 'nitrito_nitrato',
  ACUCAR = 'acucar',
  ESPECIARIA = 'especiaria',
  ATIVO_FUNCIONAL = 'ativo_funcional',
  ADITIVO_TECNOLOGICO = 'aditivo_tecnologico',
  STARTER_CULTURE = 'starter_culture',
}

export enum StatusConformidade {
  CONFORME = 'conforme',
  ALERTA = 'alerta',
  CRITICO = 'critico',
  BLOQUEADO = 'bloqueado',
}

export enum SeveridadeRegra {
  INFO = 'info',
  AVISO = 'aviso',
  CRITICO = 'critico',
  BLOQUEANTE = 'bloqueante',
}

// -----------------------------------------------------------
// INGREDIENTE TÉCNICO
// -----------------------------------------------------------

export interface IngredienteTecnico {
  id: string;
  nome: string;
  categoria: CategoriaIngrediente;
  quantidadeBase: number;   // gramas por kg de massa
  unidade: 'g/kg' | 'ppm' | 'mg/kg' | '%';
  limiteMinimo?: number;
  limiteMaximo: number;
  limiteLegal?: number;     // limite definido por legislação (ex: ANVISA, EU)
  funcaoTecnologica: string;
  observacoes?: string;
}

// -----------------------------------------------------------
// REGRA DE FORMULAÇÃO
// -----------------------------------------------------------

export interface RegraFormulacao {
  id: string;
  descricao: string;
  severidade: SeveridadeRegra;
  categoria: 'seguranca' | 'qualidade' | 'legal' | 'organoletica';
  avaliar: (formula: FormulaTecnica) => ResultadoRegra;
}

export interface ResultadoRegra {
  aprovado: boolean;
  mensagem: string;
  valor?: number;
  limite?: number;
  recomendacao?: string;
}

// -----------------------------------------------------------
// FORMULA TÉCNICA (coração do motor)
// -----------------------------------------------------------

export interface FormulaTecnica {
  id: string;
  nome: string;
  versao: string;
  processo: TipoProcesso;
  massaTotal: number;         // em kg
  ingredientes: IngredienteFormula[];
  parametrosProcesso: ParametrosProcesso;
  metadados: MetadadosFormula;
}

export interface IngredienteFormula {
  ingrediente: IngredienteTecnico;
  quantidade: number;         // gramas por kg de massa
  percentual: number;         // calculado automaticamente
}

export interface ParametrosProcesso {
  temperaturaAmbiente?: number;      // °C
  temperaturaInterna?: number;       // °C alvo
  umidadeRelativa?: number;          // %
  duracaoProcesso?: number;          // horas
  fasesCura?: FaseCura[];
  temperaturaDefumacao?: number;     // °C
  madeiraPara?: string;
  phAlvo?: number;
  awAlvo?: number;                   // atividade de água
}

export interface FaseCura {
  nome: string;
  temperatura: number;
  umidade: number;
  duracao: number;           // horas
  descricao?: string;
}

export interface MetadadosFormula {
  criadoEm: Date;
  atualizadoEm: Date;
  autor: string;
  status: 'rascunho' | 'validada' | 'aprovada' | 'arquivada';
  tags: string[];
  notas?: string;
}

// -----------------------------------------------------------
// RESULTADO DO MOTOR DE FORMULAÇÃO
// -----------------------------------------------------------

export interface ResultadoFormulacao {
  formulaId: string;
  timestamp: Date;
  statusGeral: StatusConformidade;
  resultadosRegras: ResultadoRegra[];
  alertas: AlertaFormulacao[];
  resumoNutricional: ResumoNutricional;
  parametrosCalculados: ParametrosCalculados;
  recomendacoes: string[];
}

export interface AlertaFormulacao {
  severidade: SeveridadeRegra;
  ingrediente?: string;
  parametro?: string;
  mensagem: string;
  acaoCorretivaRecomendada?: string;
}

export interface ResumoNutricional {
  proteina: number;           // g/100g
  gordura: number;
  carboidratos: number;
  sodio: number;              // mg/100g
  nitritos?: number;          // ppm
  nitratos?: number;          // ppm
}

export interface ParametrosCalculados {
  awEstimado?: number;
  phEstimado?: number;
  ratioGorduraProteina?: number;
  percentualSalTotal?: number;
  percentualNitritoTotal?: number;
}

// -----------------------------------------------------------
// LOTE DE PRODUÇÃO (usado nas Fases 4, 5 e 6)
// -----------------------------------------------------------

export interface LoteProducao {
  id: string;
  formulaId: string;
  dataInicio: Date;
  dataPrevistaFim: Date;
  quantidadeKg: number;
  statusLote: 'em_processo' | 'concluido' | 'descartado' | 'em_investigacao';
  leiturasSensores?: LeituraSensor[];
  resultadosLaboratorio?: ResultadoLaboratorio[];
  eventos?: EventoLote[];
}

export interface LeituraSensor {
  sensorId: string;
  tipo: 'temperatura' | 'umidade' | 'ph' | 'aw' | 'peso';
  valor: number;
  unidade: string;
  timestamp: Date;
  dentroLimite: boolean;
}

export interface ResultadoLaboratorio {
  parametro: string;
  valor: number;
  unidade: string;
  limiteMinimo?: number;
  limiteMaximo?: number;
  conforme: boolean;
  dataAnalise: Date;
  laboratorio?: string;
}

export interface EventoLote {
  tipo: 'observacao' | 'ajuste' | 'desvio' | 'acao_corretiva';
  descricao: string;
  timestamp: Date;
  responsavel: string;
}
