/**
 * Centralized Error Handling System
 * All domain exceptions should inherit from this base class.
 */
export class BaseException extends Error {
  constructor(public message: string, public code: string, public statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundException extends BaseException {
  constructor(message: string) {
    super(message, "NOT_FOUND", 404);
  }
}
