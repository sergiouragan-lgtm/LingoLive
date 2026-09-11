// ============================================================
// MESTRE CHARCUTEIRO — Motor Técnico de Formulação
// Fase 1: Regras, Limites, Validações e Cálculos
// ============================================================

import {
  FormulaTecnica,
  ResultadoFormulacao,
  ResultadoRegra,
  AlertaFormulacao,
  RegraFormulacao,
  SeveridadeRegra,
  StatusConformidade,
  CategoriaIngrediente,
  ParametrosCalculados,
  ResumoNutricional,
  TipoProcesso,
} from './types';

// -----------------------------------------------------------
// FUNÇÕES AUXILIARES DE CÁLCULO
// -----------------------------------------------------------

function getQuantidadePorCategoria(
  formula: FormulaTecnica,
  categoria: CategoriaIngrediente,
): number {
  return formula.ingredientes
    .filter(i => i.ingrediente.categoria === categoria)
    .reduce((soma, i) => soma + i.quantidade, 0);
}

function getIngredientePorId(formula: FormulaTecnica, id: string) {
  return formula.ingredientes.find(i => i.ingrediente.id === id);
}

function calcularPorcentagem(quantidade: number, massaTotal: number): number {
  return (quantidade / (massaTotal * 1000)) * 100;
}

// -----------------------------------------------------------
// REGRAS DO MOTOR DE FORMULAÇÃO
// Cada regra é independente, testável e auditável
// -----------------------------------------------------------

const REGRAS: RegraFormulacao[] = [
  // REGRA 001 — Limite legal de nitrito (BLOQUEANTE)
  {
    id: 'R001',
    descricao: 'Nitrito de sódio: limite legal máximo',
    severidade: SeveridadeRegra.BLOQUEANTE,
    categoria: 'legal',
    avaliar: (formula) => {
      const item = getIngredientePorId(formula, 'nitrito_sodio');
      if (!item) return { aprovado: true, mensagem: 'Nitrito não utilizado nesta fórmula.' };

      const ppm = item.quantidade * 1000; // g/kg → mg/kg = ppm
      const limite = 150;
      return {
        aprovado: ppm <= limite,
        mensagem: ppm <= limite
          ? `Nitrito: ${ppm.toFixed(1)} ppm — dentro do limite legal (${limite} ppm).`
          : `BLOQUEADO: Nitrito ${ppm.toFixed(1)} ppm excede limite legal de ${limite} ppm.`,
        valor: ppm,
        limite,
        recomendacao: ppm > limite
          ? `Reduzir NaNO₂ para no máximo ${(limite / 1000).toFixed(3)} g/kg.`
          : undefined,
      };
    },
  },

  // REGRA 002 — Limite legal de nitrato (BLOQUEANTE)
  {
    id: 'R002',
    descricao: 'Nitrato de sódio: limite legal máximo',
    severidade: SeveridadeRegra.BLOQUEANTE,
    categoria: 'legal',
    avaliar: (formula) => {
      const item = getIngredientePorId(formula, 'nitrato_sodio');
      if (!item) return { aprovado: true, mensagem: 'Nitrato não utilizado nesta fórmula.' };

      const ppm = item.quantidade * 1000;
      const limite = 300;
      return {
        aprovado: ppm <= limite,
        mensagem: ppm <= limite
          ? `Nitrato: ${ppm.toFixed(1)} ppm — dentro do limite (${limite} ppm).`
          : `BLOQUEADO: Nitrato ${ppm.toFixed(1)} ppm excede limite de ${limite} ppm.`,
        valor: ppm,
        limite,
        recomendacao: ppm > limite
          ? `Reduzir NaNO₃ para no máximo ${(limite / 1000).toFixed(3)} g/kg.`
          : undefined,
      };
    },
  },

  // REGRA 003 — Sal total (qualidade e segurança)
  {
    id: 'R003',
    descricao: 'Concentração de sal total',
    severidade: SeveridadeRegra.CRITICO,
    categoria: 'seguranca',
    avaliar: (formula) => {
      const salTotal = getQuantidadePorCategoria(formula, CategoriaIngrediente.SAL_CURA);
      const minimo = 15;
      const maximo = 40;

      if (salTotal < minimo) {
        return {
          aprovado: false,
          mensagem: `Sal insuficiente: ${salTotal} g/kg. Mínimo recomendado: ${minimo} g/kg.`,
          valor: salTotal,
          limite: minimo,
          recomendacao: 'Concentração de sal abaixo do mínimo compromete a segurança microbiológica e extração proteica.',
        };
      }
      if (salTotal > maximo) {
        return {
          aprovado: false,
          mensagem: `Sal excessivo: ${salTotal} g/kg. Máximo recomendado: ${maximo} g/kg.`,
          valor: salTotal,
          limite: maximo,
          recomendacao: 'Excesso de sal causa produto extremamente salgado e pode desestabilizar a emulsão.',
        };
      }
      return {
        aprovado: true,
        mensagem: `Sal: ${salTotal} g/kg — dentro do intervalo ideal (${minimo}–${maximo} g/kg).`,
        valor: salTotal,
      };
    },
  },

  // REGRA 004 — Fosfatos: limite legal
  {
    id: 'R004',
    descricao: 'Fosfatos: limite máximo legal',
    severidade: SeveridadeRegra.BLOQUEANTE,
    categoria: 'legal',
    avaliar: (formula) => {
      const item = getIngredientePorId(formula, 'fosfato_sodio');
      if (!item) return { aprovado: true, mensagem: 'Fosfato não utilizado nesta fórmula.' };

      const limite = 5; // g/kg como P₂O₅
      return {
        aprovado: item.quantidade <= limite,
        mensagem: item.quantidade <= limite
          ? `Fosfato: ${item.quantidade} g/kg — dentro do limite (${limite} g/kg).`
          : `BLOQUEADO: Fosfato ${item.quantidade} g/kg excede limite legal de ${limite} g/kg.`,
        valor: item.quantidade,
        limite,
      };
    },
  },

  // REGRA 005 — Temperatura interna de cozimento
  {
    id: 'R005',
    descricao: 'Temperatura interna mínima de segurança (cozimento)',
    severidade: SeveridadeRegra.CRITICO,
    categoria: 'seguranca',
    avaliar: (formula) => {
      if (formula.processo !== TipoProcesso.COZIMENTO) {
        return { aprovado: true, mensagem: 'Regra aplicável apenas a processos de cozimento.' };
      }
      const tempInterna = formula.parametrosProcesso.temperaturaInterna;
      const minimo = 72;

      if (!tempInterna) {
        return {
          aprovado: false,
          mensagem: 'Temperatura interna de cozimento não definida.',
          recomendacao: 'Definir temperatura interna alvo. Mínimo obrigatório: 72°C por 15 segundos.',
        };
      }

      return {
        aprovado: tempInterna >= minimo,
        mensagem: tempInterna >= minimo
          ? `Temperatura interna: ${tempInterna}°C — acima do mínimo de segurança (${minimo}°C).`
          : `CRÍTICO: Temperatura interna ${tempInterna}°C abaixo do mínimo de ${minimo}°C.`,
        valor: tempInterna,
        limite: minimo,
        recomendacao: tempInterna < minimo
          ? 'Aumentar temperatura interna para mínimo 72°C/15s para inativação de Salmonella e Listeria.'
          : undefined,
      };
    },
  },

  // REGRA 006 — pH alvo em fermentados
  {
    id: 'R006',
    descricao: 'pH alvo para produtos fermentados',
    severidade: SeveridadeRegra.CRITICO,
    categoria: 'seguranca',
    avaliar: (formula) => {
      if (formula.processo !== TipoProcesso.FERMENTACAO) {
        return { aprovado: true, mensagem: 'Regra aplicável apenas a produtos fermentados.' };
      }
      const phAlvo = formula.parametrosProcesso.phAlvo;
      const maximo = 5.3;

      if (!phAlvo) {
        return {
          aprovado: false,
          mensagem: 'pH alvo não definido para produto fermentado.',
          recomendacao: 'Definir pH alvo. Para segurança: < 5.3 nas primeiras 48h.',
        };
      }

      return {
        aprovado: phAlvo <= maximo,
        mensagem: phAlvo <= maximo
          ? `pH alvo: ${phAlvo} — adequado para inibição de patogénos.`
          : `ATENÇÃO: pH alvo ${phAlvo} acima do máximo recomendado de ${maximo}.`,
        valor: phAlvo,
        limite: maximo,
        recomendacao: phAlvo > maximo
          ? 'Aumentar concentração de açúcares fermentáveis ou rever cultura starter para acidificação mais eficiente.'
          : undefined,
      };
    },
  },

  // REGRA 007 — Aw em produtos maturados
  {
    id: 'R007',
    descricao: 'Atividade de água (Aw) alvo em maturados',
    severidade: SeveridadeRegra.CRITICO,
    categoria: 'seguranca',
    avaliar: (formula) => {
      if (formula.processo !== TipoProcesso.MATURACAO) {
        return { aprovado: true, mensagem: 'Regra aplicável apenas a produtos maturados.' };
      }
      const awAlvo = formula.parametrosProcesso.awAlvo;
      const maximo = 0.92;

      if (!awAlvo) {
        return {
          aprovado: false,
          mensagem: 'Aw alvo não definido para produto maturado.',
          recomendacao: 'Definir Aw alvo. Para estabilidade microbiológica: Aw < 0.92.',
        };
      }

      return {
        aprovado: awAlvo <= maximo,
        mensagem: awAlvo <= maximo
          ? `Aw alvo: ${awAlvo} — dentro do limite de segurança.`
          : `ALERTA: Aw ${awAlvo} acima do máximo recomendado de ${maximo}.`,
        valor: awAlvo,
        limite: maximo,
      };
    },
  },

  // REGRA 008 — Eritorbato não combinado com ascórbico
  {
    id: 'R008',
    descricao: 'Eritorbato e ácido ascórbico não devem ser usados simultaneamente',
    severidade: SeveridadeRegra.AVISO,
    categoria: 'qualidade',
    avaliar: (formula) => {
      const temEritorbato = !!getIngredientePorId(formula, 'eritorbato_sodio');
      const temAscorbico = !!getIngredientePorId(formula, 'acido_ascorbico');

      if (temEritorbato && temAscorbico) {
        return {
          aprovado: false,
          mensagem: 'Eritorbato de sódio e ácido ascórbico usados simultaneamente.',
          recomendacao: 'Use apenas um dos dois aceleradores de cura. Preferir eritorbato de sódio em produtos industriais.',
        };
      }
      return { aprovado: true, mensagem: 'Aceleradores de cura: sem conflito.' };
    },
  },
];

// -----------------------------------------------------------
// MOTOR PRINCIPAL
// -----------------------------------------------------------

export function avaliarFormula(formula: FormulaTecnica): ResultadoFormulacao {
  const resultadosRegras: ResultadoRegra[] = [];
  const alertas: AlertaFormulacao[] = [];

  for (const regra of REGRAS) {
    const resultado = regra.avaliar(formula);
    resultadosRegras.push(resultado);

    if (!resultado.aprovado) {
      const regrasConfig = REGRAS.find(r => r.avaliar === regra.avaliar);
      alertas.push({
        severidade: regrasConfig?.severidade ?? SeveridadeRegra.AVISO,
        mensagem: resultado.mensagem,
        acaoCorretivaRecomendada: resultado.recomendacao,
      });
    }
  }

  const parametrosCalculados = calcularParametros(formula);
  const resumoNutricional = calcularNutricional(formula);
  const statusGeral = determinarStatus(alertas);
  const recomendacoes = gerarRecomendacoes(formula, parametrosCalculados);

  return {
    formulaId: formula.id,
    timestamp: new Date(),
    statusGeral,
    resultadosRegras,
    alertas,
    resumoNutricional,
    parametrosCalculados,
    recomendacoes,
  };
}

function calcularParametros(formula: FormulaTecnica): ParametrosCalculados {
  const proteina = getQuantidadePorCategoria(formula, CategoriaIngrediente.PROTEINA_ANIMAL);
  const gordura = getQuantidadePorCategoria(formula, CategoriaIngrediente.GORDURA);
  const salTotal = getQuantidadePorCategoria(formula, CategoriaIngrediente.SAL_CURA);
  const nitritos = getIngredientePorId(formula, 'nitrito_sodio');

  return {
    percentualSalTotal: calcularPorcentagem(salTotal, formula.massaTotal),
    percentualNitritoTotal: nitritos
      ? calcularPorcentagem(nitritos.quantidade, formula.massaTotal)
      : 0,
    ratioGorduraProteina: proteina > 0 ? gordura / proteina : undefined,
    awEstimado: formula.parametrosProcesso.awAlvo,
    phEstimado: formula.parametrosProcesso.phAlvo,
  };
}

function calcularNutricional(formula: FormulaTecnica): ResumoNutricional {
  const nitritos = getIngredientePorId(formula, 'nitrito_sodio');
  const nitratos = getIngredientePorId(formula, 'nitrato_sodio');

  return {
    proteina: 0,   // requer dados de composição dos ingredientes — Fase 2 expande
    gordura: 0,
    carboidratos: 0,
    sodio: 0,
    nitritos: nitritos ? nitritos.quantidade * 1000 : undefined,
    nitratos: nitratos ? nitratos.quantidade * 1000 : undefined,
  };
}

function determinarStatus(alertas: AlertaFormulacao[]): StatusConformidade {
  if (alertas.some(a => a.severidade === SeveridadeRegra.BLOQUEANTE)) {
    return StatusConformidade.BLOQUEADO;
  }
  if (alertas.some(a => a.severidade === SeveridadeRegra.CRITICO)) {
    return StatusConformidade.CRITICO;
  }
  if (alertas.some(a => a.severidade === SeveridadeRegra.AVISO)) {
    return StatusConformidade.ALERTA;
  }
  return StatusConformidade.CONFORME;
}

function gerarRecomendacoes(formula: FormulaTecnica, params: ParametrosCalculados): string[] {
  const recomendacoes: string[] = [];

  if (params.ratioGorduraProteina !== undefined) {
    if (params.ratioGorduraProteina > 2.5) {
      recomendacoes.push('Ratio gordura/proteína elevado — considerar reduzir gordura para melhor estabilidade de emulsão.');
    }
    if (params.ratioGorduraProteina < 0.5) {
      recomendacoes.push('Produto magro — produto pode ficar seco. Considerar adicionar componente umectante.');
    }
  }

  if (!formula.parametrosProcesso.fasesCura && formula.processo === TipoProcesso.MATURACAO) {
    recomendacoes.push('Definir fases de cura e maturação com temperatura e umidade por fase para melhor controlo do processo.');
  }

  return recomendacoes;
}
