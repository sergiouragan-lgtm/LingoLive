import Stripe from "stripe";

// CORREÇÃO: antes, 'stripe' era calculado UMA VEZ no arranque do módulo
// (import time). Em plataformas onde as variáveis de ambiente só ficam
// disponíveis depois desse momento (ou em testes que definem a variável
// dinamicamente a meio da execução), o cliente ficava permanentemente
// nulo, mesmo depois da chave estar disponível. Agora é avaliado a cada
// utilização, refletindo sempre o estado atual da variável de ambiente.
export function getStripeClient(): Stripe | null {
  return process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
}
