export interface DomainEvent {
  readonly type: string;
  readonly payload: unknown;
  readonly timestamp: Date;
  readonly id: string;
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
}
