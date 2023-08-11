export type Score = {
    teamId: string
    weekId: string
    progress: number
    available: number
}

export interface ScoreRepository {
    getScore(teamId: string, weekId: string): Promise<Score>
}