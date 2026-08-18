export interface DomainEvent {
  readonly id: string;
  readonly type: string;
  readonly occurredOn: Date;
  readonly version: number;
  readonly idempotencyKey: string;
  readonly payload: any;
}

export interface ApplicationEvent {
  readonly id: string;
  readonly type: string;
  readonly occurredOn: Date;
  readonly payload: any;
}

export interface IntegrationEvent {
  readonly id: string;
  readonly type: string;
  readonly occurredOn: Date;
  readonly payload: any;
}
