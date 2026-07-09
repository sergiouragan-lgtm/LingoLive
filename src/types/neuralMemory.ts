// src/types/neuralMemory.ts

export interface MemoriaCognitiva {
  alunoId: string;
  nivelAtual: 'Iniciante' | 'Intermediário' | 'Avançado';
  scoreFluidez: number; // 0.00 a 1.00 (peso neural)
  
  // Memória de Longo Prazo (Padrões consolidados)
  errosRecorrentes: {
    categoria: string; // ex: "Conjugação Passado", "Artigos"
    frequencia: number;
    ultimoErro: Date;
  }[];

  // Grafo de Vocabulário (Retenção e Spaced Repetition)
  vocabularioNativoRendido: {
    termo: string;       // ex: "Mufete"
    pesoRetencao: number; // 0.00 a 1.00 (1.00 = totalmente dominado)
    proximaRevisao: Date;  // Algoritmo de repetição espaçada
    historicoTurnos: number[]; // Turnos em que o aluno interagiu com a palavra
  }[];

  interessesCulturaisDetetados: string[]; // ex: ["Funge", "Kuduro", "Mussulo"]
}
