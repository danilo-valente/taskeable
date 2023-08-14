import { TaskScope } from "./task.ts"

// Existe apenas no Mission Control
export interface TaskCreationProducer {
  produce(scope: TaskScope): Promise<void>
}

// Existe apenas no Mission Control
export interface TaskCreationConsumer {
  consume(callback: (scope: TaskScope) => void): void
}