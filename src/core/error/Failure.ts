export abstract class Failure {
  abstract readonly message: string;
}

export class ServerFailure extends Failure {
  constructor(readonly message: string) {
    super();
  }
}

export class CacheFailure extends Failure {
  constructor(readonly message: string) {
    super();
  }
}
