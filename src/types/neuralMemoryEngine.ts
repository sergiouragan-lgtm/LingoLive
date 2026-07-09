import { MemoriaCognitiva } from './neuralMemory';

export class NeuralMemoryEngine {
  
  /**
   * Passo 1: Transforma a memória do banco de dados em contexto legível para a IA
   */
  public gerarContextoMemoria(memoria: MemoriaCognitiva): string {
    const termosParaRevisar = memoria.vocabularioNativoRendido
      .filter(v => new Date(v.proximaRevisao) <= new Date())
      .map(v => v.termo)
      .slice(0, 3); // Pega no máximo 3 termos para não sobrecarregar

    return `
[CÉREBRO NEURAL DO ALUNO - DADOS ATUAIS]
- Nível de Proficiência: ${memoria.nivelAtual} (Score de Fluidez: ${(memoria.scoreFluidez * 100).toFixed(0)}%)
- Interesses Culturais Ativos: ${memoria.interessesCulturaisDetetados.join(', ')}
- Palavras Angolanas em Processo de Retenção: ${memoria.vocabularioNativoRendido.map(v => `${v.termo} (Domínio: ${(v.pesoRetencao * 100).toFixed(0)}%)`).join(', ')}
${termosParaRevisar.length > 0 ? `- DIRETRIZ CRÍTICA: O aluno precisa revisar e usar contextualizadamente hoje os seguintes termos: ${termosParaRevisar.join(', ')}` : ''}
- Erros Gramaticais Críticos a Monitorar: ${memoria.errosRecorrentes.map(e => e.categoria).join(', ')}
    `;
  }

  /**
   * Passo 2: Algoritmo de Aprendizado de Máquina (Atualização de Pesos / Backpropagation)
   */
  public atualizarMatrizMemoria(memoriaAntiga: MemoriaCognitiva, analiseIA: any): MemoriaCognitiva {
    const novaMemoria = { ...memoriaAntiga };

    // 1. Ajuste Dinâmico de Fluidez (Atualização de pesos)
    if (analiseIA.aprendizadoMaquina.nivelEstimado !== novaMemoria.nivelAtual) {
      novaMemoria.nivelAtual = analiseIA.aprendizadoMaquina.nivelEstimado;
    }

    // Suavização exponencial do Score de Fluidez baseado no engajamento cultural e acertos
    const fatorAprendizado = 0.1; // Taxa de aprendizado (Learning Rate)
    const scoreTurno = (analiseIA.aprendizadoMaquina.engajamentoCultural / 5);
    novaMemoria.scoreFluidez = (1 - fatorAprendizado) * novaMemoria.scoreFluidez + fatorAprendizado * scoreTurno;

    // 2. Mapeamento e consolidação de novos termos (Vocab Deck Dinâmico)
    if (analiseIA.vocabularioDoDia && analiseIA.vocabularioDoDia.termo) {
      const termoAtual = analiseIA.vocabularioDoDia.termo;
      const index = novaMemoria.vocabularioNativoRendido.findIndex(v => v.termo.toLowerCase() === termoAtual.toLowerCase());

      if (index === -1) {
        // Novo termo descoberto pelo cérebro do aluno
        novaMemoria.vocabularioNativoRendido.push({
          termo: termoAtual,
          pesoRetencao: 0.3, // Inicializa com peso baixo (aprendizado inicial)
          proximaRevisao: new Date(Date.now() + 24 * 60 * 60 * 1000), // Revisar em 1 dia (Spaced Repetition)
          historicoTurnos: [1]
        });
      } else {
        // Aluno interagiu novamente com o termo: aumenta o peso neural de retenção
        const item = novaMemoria.vocabularioNativoRendido[index];
        item.pesoRetencao = Math.min(1.0, item.pesoRetencao + 0.15);
        
        // Multiplica os dias para a próxima revisão baseando-se no nível de domínio (Algoritmo SuperMemo simplificado)
        const diasExp = Math.round(item.pesoRetencao * 10);
        item.proximaRevisao = new Date(Date.now() + diasExp * 24 * 60 * 60 * 1000);
        item.historicoTurnos.push(Date.now());
      }
    }

    // 3. Atualização de interesses culturais com base nas respostas
    if (analiseIA.aprendizadoMaquina.engajamentoCultural >= 4 && analiseIA.vocabularioDoDia?.termo) {
      if (!novaMemoria.interessesCulturaisDetetados.includes(analiseIA.vocabularioDoDia.termo)) {
        novaMemoria.interessesCulturaisDetetados.push(analiseIA.vocabularioDoDia.termo);
      }
    }

    return novaMemoria;
  }
}
