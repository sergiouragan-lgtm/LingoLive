/**
 * LingoLIVE IA - Camada de Domínio: Tratamento de Erros e Exceções Padronizados
 * 
 * Estrutura hierárquica de tratamento de erros estritos da Clean Architecture do LingoLIVE,
 * mapeando falhas específicas que ocorrem ao longo do fluxo de execução (Domínio -> Aplicação -> Apresentação).
 */

export class ApplicationError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(message: string, code = 'APPLICATION_ERROR', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Corrige a cadeia de protótipos para herança estrita em TypeScript/JavaScript moderno
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Erro lançado em falhas de validações de campos de dados de negócios.
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Erro lançado quando o processo de autenticação falha ou o token do utilizador expirou.
 */
export class AuthenticationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', details);
  }
}

/**
 * Erro lançado quando o utilizador autenticado não tem a permissão de acesso necessária.
 */
export class AuthorizationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHORIZATION_ERROR', details);
  }
}

/**
 * Erro de falha de conexão de rede, requisições HTTP interrompidas ou timeouts.
 */
export class NetworkError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
  }
}

/**
 * Erro lançado em falhas de orquestração de IA (ex: estouro de tokens, falha do Gemini/OpenAI).
 */
export class AIServiceError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'AI_SERVICE_ERROR', details);
  }
}

/**
 * Erro lançado em falhas de pagamentos, cobranças ou processamento de faturamento.
 */
export class PaymentError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'PAYMENT_ERROR', details);
  }
}
