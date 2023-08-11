export type Event<T = unknown> = {
    userId: string
    companyId: string
    payload: T
}

export interface EventPublisher {
    publish<T extends Event>(topic: string, event: T)
}

export interface EventSubscriber {
    subscribe<T extends Event>(topic: string, callback: (event: T) => void)
}