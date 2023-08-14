// Existe em ambos -> replicar a interface em cada microserviço
export type Event<T = unknown> = {
    userId: string
    companyId: string
    date: number    // Usei number para facilitar a serialização
    payload: T
}

// Existe (tanto interface quanto implementação) em cada microserviço
export interface EventPublisher {
    publish<T extends Event>(topic: string, event: T): Promise<void>
}

// Existe apenas no Mission Control
export interface EventSubscriber {
    subscribe<T extends Event>(topic: string, callback: (event: T) => void): void
}