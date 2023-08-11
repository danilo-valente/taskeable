import { EventEmitter } from 'node:events'
import { Event, EventPublisher, EventSubscriber } from './events.ts'
import { KeyResultRepository, User, UserRepository } from './repositories.ts'
import { Task, TaskId, TaskRepository } from './mission-control/task.ts'
import { Score, ScoreRepository } from './mission-control/score.ts'

export const localQueue = new EventEmitter()

export const localEventSubscriber: EventSubscriber = {
    subscribe<T extends Event>(topic: string, callback: (event: T) => void) {
        localQueue.on(`event:${topic}`, callback)
    }
}

export const localEventPublisher: EventPublisher = {
    publish(topic: string, event: Event) {
        localQueue.emit(`event:${topic}`, event)
    }
}

export const STATIC_USERS: User[] = [{
    userId: 'user_1',
    teamIds: ['team_1', 'team_2']
}, {
    userId: 'user_2',
    teamIds: ['team_1']
}]

export const STATIC_TEAM_IDS = new Set(STATIC_USERS.flatMap<string>(user => user.teamIds))

export const userRepository: UserRepository = {
    async findAll() {
        return STATIC_USERS
    },

    async findById(userId: string) {
        return STATIC_USERS.find(candidate => candidate.userId === userId) ?? null
    }
}

export const STATIC_KEY_RESULTS = {
    [STATIC_USERS[0].userId]: {
        [STATIC_USERS[0].teamIds[0]]: {
            PUBLISHED: ['key_result_1', 'key_result_2'],
            DRAFT: ['key_result_3']
        },
        [STATIC_USERS[0].teamIds[1]]: {
            PUBLISHED: ['key_result_4'],
            DRAFT: []
        }
    },
    [STATIC_USERS[1].userId]: {
        [STATIC_USERS[1].teamIds[0]]: {
            PUBLISHED: ['key_result_5'],
            DRAFT: []
        }
    }
}

export const keyResultRepository: KeyResultRepository = {
    async findMany({ ownerId, teamId, mode }) {
        return STATIC_KEY_RESULTS[ownerId][teamId][mode]
    }
}

export const STATIC_TASKS: Task[] = []

export const taskRepository: TaskRepository = {

    async createMany(tasks: Task[]) {
        STATIC_TASKS.push(...tasks)
    },

    async findMany(taskId: Partial<TaskId>): Promise<Task[]> {
        return STATIC_TASKS.filter(candidate => (
            (!taskId.userId || candidate.userId === taskId.userId) &&
            (!taskId.teamId || candidate.teamId === taskId.teamId) &&
            (!taskId.weekId || candidate.weekId === taskId.weekId) &&
            (!taskId.templateId || candidate.templateId === taskId.templateId)
        ))
    },

    async addStep(taskId: TaskId, stepId: string): Promise<void> {
        const task = STATIC_TASKS.find(candidate => (
            candidate.userId === taskId.userId &&
            candidate.teamId === taskId.teamId &&
            candidate.weekId === taskId.weekId &&
            candidate.templateId === taskId.templateId
        ))

        task?.completedSubtasks.add(stepId)
    }
}

export const scoreRepository: ScoreRepository = {
    async getScore(teamId: string, weekId: string): Promise<Score> {
        
        const tasks = STATIC_TASKS.filter(candidate => (
            candidate.teamId === teamId &&
            candidate.weekId === weekId
        ))
        
        

        return tasks.reduce((score, task) => {
            return {
                ...score,
                // Considera a quantidade de subtasks concluídas
                progress: score.progress + task.score * task.completedSubtasks.size,
                // Considera a quantidade de total de subtasks disponíveis
                available: score.available + task.score * task.availableSubtasks.size
            }
        }, {
            teamId,
            weekId,
            progress: 0,
            available: 0
        })
    }
}