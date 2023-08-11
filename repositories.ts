export type KeyResultQuery = {
    ownerId: string
    teamId: string
    mode: 'PUBLISHED' | 'DRAFT'
}

export interface KeyResultRepository {
    findMany(query: KeyResultQuery): Promise<string[]>
}

export type User = {
    userId: string
    teamIds: string[]
}

export interface UserRepository {
    findAll(): Promise<User[]>
    findById(userId: string): Promise<User | null>
}