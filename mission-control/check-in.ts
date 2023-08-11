import { Event } from "../events.ts"
import { KeyResultRepository } from '../repositories.ts'
import { Task, TaskAssigner, TaskFulfiller, TaskId, TaskRepository, TaskScope } from './task.ts'
import { buildWeekId } from './util.ts'

export const CHECK_IN_TASK_TEMPLATE_ID = 'key-result-check-in'
export const CHECK_IN_TASK_SCORE = 2

export type CheckInEvent = Event<{
    teamId: string
    keyResultId: string
}>

export class CheckInTaskAssigner implements TaskAssigner {

    constructor(private readonly keyResultRepository: KeyResultRepository) {}

    async assign(scope: TaskScope): Promise<Task[]> {
        const keyResults = await this.keyResultRepository.findMany({
            ownerId: scope.userId,
            teamId: scope.teamId,
            mode: 'PUBLISHED'
        })

        if (keyResults.length === 0) {
            // User does not own any published key results -> no check-in tasks
            return []
        }

        return keyResults.map(keyResults => {
            return {
                userId: scope.userId,
                teamId: scope.teamId,
                weekId: scope.weekId,
                templateId: CHECK_IN_TASK_TEMPLATE_ID,
                score: CHECK_IN_TASK_SCORE,
                availableSubtasks: new Set(keyResults),
                completedSubtasks: new Set()
            }
        })
    }
}
  
export class CheckInTaskFulfiller implements TaskFulfiller<CheckInEvent> {

    constructor(
        private readonly taskRepository: TaskRepository
    ) {}

    async ingest(event: CheckInEvent): Promise<void> {
        
        const taskId: TaskId = {
            userId: event.userId,
            teamId: event.payload.teamId,
            weekId: buildWeekId(),
            templateId: CHECK_IN_TASK_TEMPLATE_ID
        }

        console.log('Computing score for check-in task:', taskId)

        this.taskRepository.addStep(taskId, event.payload.keyResultId)
    }
}