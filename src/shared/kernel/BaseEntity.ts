export interface Entity<T> {
  readonly id: T;
}

export abstract class AggregateRoot<T> implements Entity<T> {
  readonly id: T;
  
  constructor(id: T) {
    this.id = id;
  }
}
