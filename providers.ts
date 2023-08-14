import { EventEmitter } from 'node:events'
import { Event, EventPublisher, EventSubscriber } from './events.ts'
import { KeyResultRepository, User, UserRepository } from './repositories.ts'
import { Task, TaskId, TaskRepository, TaskScope } from './mission-control/task.ts'
import { Score, ScoreRepository } from './mission-control/score.ts'
import { TaskCreationConsumer, TaskCreationProducer } from './mission-control/task-queue.ts'

export const localQueue = new EventEmitter()

export const localTaskCreationConsumer: TaskCreationConsumer = {
    consume(callback: (scope: TaskScope) => void) {
        localQueue.on('create-task', callback)
    }
}

export const localTaskCreationProducer: TaskCreationProducer = {
    async produce(scope: TaskScope) {
        localQueue.emit('create-task', scope)
    }
}

export const localEventSubscriber: EventSubscriber = {
    subscribe<T extends Event>(topic: string, callback: (event: T) => void) {
        localQueue.on(`event:${topic}`, callback)
    }
}

export const localEventPublisher: EventPublisher = {
    async publish(topic: string, event: Event) {
        localQueue.emit(`event:${topic}`, event)
    }
}

export const STATIC_USERS: User[] = [{
    userId: 'user_1',
    companyId: 'company_1',
    teamIds: ['team_1', 'team_2']
}, {
    userId: 'user_2',
    companyId: 'company_1',
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

    async addSubtask(taskId: TaskId, stepId: string): Promise<void> {
        const task = STATIC_TASKS.find(candidate => (
            candidate.userId === taskId.userId &&
            candidate.teamId === taskId.teamId &&
            candidate.weekId === taskId.weekId &&
            candidate.templateId === taskId.templateId
        ))

        if (task) {
            task.completedSubtasks.add(stepId)
            task.availableSubtasks.add(stepId)  // Evita que Subtasks criadas depois da criação da Task não sejam consideradas no cálculo total
        }
    }
}

export const scoreRepository: ScoreRepository = {
    async getScore(teamId: string, weekId: string): Promise<Score> {
        
        const tasks = STATIC_TASKS.filter(candidate => (
            candidate.teamId === teamId &&
            candidate.weekId === weekId
        ))

        /**
         * Implementação da Opção 2:
         * =========================
         * Na implementação real, fazer o cálculo utilizando funções de agregação do Postgres
         * 
         * A análise da query abaixo vai determinar quais índices precisamos incluir na tabela Tasks:
         * 
         * SELECT teamId,
         *        weekId,
         *        SUM(score * SIZE(completed_subtasks)) AS progress,
         *        SUM(score * SIZE(available_subtasks)) AS available
         * FROM tasks
         * WHERE teamId = :teamId AND weekId = :weekId
         */
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