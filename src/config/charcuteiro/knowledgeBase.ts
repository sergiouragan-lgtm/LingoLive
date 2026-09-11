// ============================================================
// MESTRE CHARCUTEIRO — Base de Conhecimento Técnico
// Fase 2: Produtos, Processos e Segurança Alimentar
// ============================================================

import {
  IngredienteTecnico,
  CategoriaIngrediente,
  TipoProcesso,
} from './types';

// -----------------------------------------------------------
// CATÁLOGO DE INGREDIENTES TÉCNICOS
// Limites baseados em ANVISA RDC 272/2019 e Regulamento EU 1333/2008
// -----------------------------------------------------------

export const INGREDIENTES_BASE: Record<string, IngredienteTecnico> = {
  sal_cura: {
    id: 'sal_cura',
    nome: 'Sal de Cura (Cloreto de Sódio)',
    categoria: CategoriaIngrediente.SAL_CURA,
    quantidadeBase: 25,
    unidade: 'g/kg',
    limiteMinimo: 18,
    limiteMaximo: 35,
    funcaoTecnologica: 'Conservação, sabor, controlo de atividade de água',
  },

  nitrito_sodio: {
    id: 'nitrito_sodio',
    nome: 'Nitrito de Sódio (NaNO₂)',
    categoria: CategoriaIngrediente.NITRITO_NITRATO,
    quantidadeBase: 0.15,
    unidade: 'g/kg',
    limiteMinimo: 0,
    limiteMaximo: 0.15,
    limiteLegal: 0.15,  // 150 ppm — limite ANVISA / UE
    funcaoTecnologica: 'Inibição de Clostridium botulinum, cor rósea, antioxidação',
    observacoes: 'CRÍTICO: nunca exceder 150 ppm. Monitorar nitritos residuais no produto final (máx 50 ppm)',
  },

  nitrato_sodio: {
    id: 'nitrato_sodio',
    nome: 'Nitrato de Sódio (NaNO₃)',
    categoria: CategoriaIngrediente.NITRITO_NITRATO,
    quantidadeBase: 0.3,
    unidade: 'g/kg',
    limiteMinimo: 0,
    limiteMaximo: 0.3,
    limiteLegal: 0.3,  // 300 ppm — para produtos de longa maturação
    funcaoTecnologica: 'Reservatório lento de nitritos para produtos de longa maturação',
    observacoes: 'Apenas para produtos com maturação > 4 semanas',
  },

  sacarose: {
    id: 'sacarose',
    nome: 'Sacarose (Açúcar)',
    categoria: CategoriaIngrediente.ACUCAR,
    quantidadeBase: 5,
    unidade: 'g/kg',
    limiteMinimo: 0,
    limiteMaximo: 30,
    funcaoTecnologica: 'Substrato para fermentação, equilibrio de sabor, redução de aw',
  },

  dextrose: {
    id: 'dextrose',
    nome: 'Dextrose (Glucose)',
    categoria: CategoriaIngrediente.ACUCAR,
    quantidadeBase: 3,
    unidade: 'g/kg',
    limiteMinimo: 0,
    limiteMaximo: 20,
    funcaoTecnologica: 'Fermentação mais rápida, menor dulçor residual',
  },

  fosfato_sodio: {
    id: 'fosfato_sodio',
    nome: 'Fosfato de Sódio',
    categoria: CategoriaIngrediente.ATIVO_FUNCIONAL,
    quantidadeBase: 3,
    unidade: 'g/kg',
    limiteMinimo: 0,
    limiteMaximo: 5,
    limiteLegal: 5,
    funcaoTecnologica: 'Retenção de água, emulsificação, pH buffer',
    observacoes: 'Limite calculado como P₂O₅. Não usar em produtos artesanais com alegação "sem fosfatos"',
  },

  eritorbato_sodio: {
    id: 'eritorbato_sodio',
    nome: 'Eritorbato de Sódio',
    categoria: CategoriaIngrediente.ADITIVO_TECNOLOGICO,
    quantidadeBase: 0.5,
    unidade: 'g/kg',
    limiteMinimo: 0,
    limiteMaximo: 0.55,
    limiteLegal: 0.55,
    funcaoTecnologica: 'Acelerador de cura, antioxidante, estabilizador de cor',
  },

  acido_ascorbico: {
    id: 'acido_ascorbico',
    nome: 'Ácido Ascórbico (Vitamina C)',
    categoria: CategoriaIngrediente.ADITIVO_TECNOLOGICO,
    quantidadeBase: 0.5,
    unidade: 'g/kg',
    limiteMinimo: 0,
    limiteMaximo: 0.5,
    funcaoTecnologica: 'Antioxidante natural, acelerador de cura',
  },
};

// -----------------------------------------------------------
// PARÂMETROS CRÍTICOS DE SEGURANÇA POR PROCESSO
// -----------------------------------------------------------

export interface LimitesSegurancaProcesso {
  processo: TipoProcesso;
  temperaturaMaxima?: number;
  temperaturaMinima?: number;
  awMaximo?: number;
  phMinimo?: number;
  duracaoMinimaHoras?: number;
  observacoes: string[];
}

export const LIMITES_SEGURANCA: Record<TipoProcesso, LimitesSegurancaProcesso> = {
  [TipoProcesso.CURA_SECA]: {
    processo: TipoProcesso.CURA_SECA,
    temperaturaMaxima: 4,
    awMaximo: 0.92,
    observacoes: [
      'Temperatura de cura entre 2°C e 4°C',
      'AW final < 0.92 para inibição de patogénos',
      'Controlar penetração do sal — mínimo 48h por cm de espessura',
    ],
  },
  [TipoProcesso.CURA_UMIDA]: {
    processo: TipoProcesso.CURA_UMIDA,
    temperaturaMaxima: 4,
    observacoes: [
      'Salmoura deve cobrir completamente o produto',
      'Temperatura nunca acima de 4°C',
      'Concentração de sal na salmoura: 15–25 °Baumé',
      'Risco de anaerobiose — monitorar nitrito com atenção',
    ],
  },
  [TipoProcesso.FERMENTACAO]: {
    processo: TipoProcesso.FERMENTACAO,
    phMinimo: 4.6,
    awMaximo: 0.95,
    observacoes: [
      'pH deve baixar para < 5.3 nas primeiras 48h (produtos rápidos)',
      'pH final < 4.6 para segurança sem nitrito em produtos fermentados',
      'Temperatura de fermentação entre 18°C e 26°C conforme cultura starter',
      'AW deve ser controlado durante a secagem',
    ],
  },
  [TipoProcesso.DEFUMACAO]: {
    processo: TipoProcesso.DEFUMACAO,
    temperaturaMaxima: 90,
    temperaturaMinima: 60,
    observacoes: [
      'Defumação a frio: < 30°C — não substitui cozimento',
      'Defumação a quente: 60°C–90°C — atingir T.I. mínima de 72°C/15s',
      'Controlar HAPs (hidrocarbonetos aromáticos policíclicos)',
      'Madeiras recomendadas: carvalho, faia, cerejeira, maçã',
      'Nunca usar madeiras resinosas (pinheiro) ou tratadas',
    ],
  },
  [TipoProcesso.COZIMENTO]: {
    processo: TipoProcesso.COZIMENTO,
    temperaturaMinima: 72,
    observacoes: [
      'Temperatura interna mínima: 72°C por 15 segundos (equivalência letal)',
      'Ou 68°C por 4 minutos para produtos de aves',
      'Resfriamento rápido obrigatório: de 60°C a 10°C em < 2h',
      'Registo contínuo de temperatura durante cozimento',
    ],
  },
  [TipoProcesso.MATURACAO]: {
    processo: TipoProcesso.MATURACAO,
    temperaturaMaxima: 14,
    awMaximo: 0.88,
    observacoes: [
      'Temperatura de maturação entre 10°C e 14°C',
      'Umidade relativa entre 75% e 85%',
      'AW final < 0.88 para segurança microbiológica sem refrigeração',
      'Monitorar formação de fungos — distinguir flora protetora de contaminantes',
    ],
  },
  [TipoProcesso.EMULSIFICACAO]: {
    processo: TipoProcesso.EMULSIFICACAO,
    temperaturaMaxima: 12,
    observacoes: [
      'Temperatura da massa durante cutterização: nunca > 12°C',
      'Ordem de adição dos ingredientes é crítica para emulsão estável',
      'Proteína extraída: mínimo 3% de sal para extração miofibrilar adequada',
    ],
  },
};

// -----------------------------------------------------------
// GUIA DE CULTURAS STARTER (Fase 2 — base de conhecimento)
// -----------------------------------------------------------

export interface CulturaStarter {
  nome: string;
  genero: string;
  funcao: string;
  temperaturaOtima: number;
  phAlvo: number;
  produtos: string[];
  observacoes: string;
}

export const CULTURAS_STARTER: CulturaStarter[] = [
  {
    nome: 'Lactobacillus sakei',
    genero: 'Lactobacillus',
    funcao: 'Acidificação — produção de ácido láctico',
    temperaturaOtima: 22,
    phAlvo: 4.8,
    produtos: ['salame', 'linguiça curada', 'pepperoni'],
    observacoes: 'Excelente competidor frente a patogénos. Uso padrão em embutidos fermentados.',
  },
  {
    nome: 'Staphylococcus carnosus',
    genero: 'Staphylococcus',
    funcao: 'Desenvolvimento de cor e aroma — redução de nitratos',
    temperaturaOtima: 25,
    phAlvo: 5.5,
    produtos: ['salame artesanal', 'bresaola', 'produtos maturados'],
    observacoes: 'Não patogénico. Essencial para cor vermelho-estável em produtos de maturação longa.',
  },
  {
    nome: 'Penicillium nalgiovense',
    genero: 'Penicillium',
    funcao: 'Flora superficial protetora — sabor e controlo de oxidação',
    temperaturaOtima: 12,
    phAlvo: 6.0,
    produtos: ['salame tipo Milano', 'copa', 'presunto curado'],
    observacoes: 'Fungo branco nobre. Inibe fungos patogénos (aflatoxinas). Aplicado por spray ou imersão.',
  },
];

// -----------------------------------------------------------
// GLOSSÁRIO TÉCNICO ESSENCIAL
// -----------------------------------------------------------

export const GLOSSARIO_TECNICO: Record<string, string> = {
  aw: 'Atividade de água (water activity) — disponibilidade de água livre para crescimento microbiano. Escala 0–1.',
  ph: 'Medida de acidez/alcalinidade. pH < 7 = ácido, pH > 7 = alcalino. Fermentação leva o pH para baixo.',
  ppm: 'Partes por milhão — unidade de concentração. 1 ppm = 1 mg/kg.',
  nitrito_residual: 'Nitrito que permanece no produto final após a cura. Limite legal: 50 ppm em produto acabado.',
  emulsao: 'Sistema estável de gordura dispersa em água, estabilizado por proteínas miofibrilares.',
  cutterizacao: 'Processo de mistura/corte em cutter bowl para formação de emulsão em produtos como mortadela.',
  hacp: 'Análise de Perigos e Pontos Críticos de Controlo — sistema de gestão de segurança alimentar.',
  flora_protetora: 'Microrganismos benéficos (starter cultures) que colonizam o produto e inibem patogénos.',
};
