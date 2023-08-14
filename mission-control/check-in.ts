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
        const keyResultsIds = await this.keyResultRepository.findMany({
            ownerId: scope.userId,
            teamId: scope.teamId,
            mode: 'PUBLISHED'
        })

        // if (keyResults.length === 0) {
        //     // User does not own any published key results -> no check-in tasks
        //     return []
        // }

        return [{
            companyId: scope.companyId,
            userId: scope.userId,
            teamId: scope.teamId,
            weekId: scope.weekId,
            templateId: CHECK_IN_TASK_TEMPLATE_ID,
            score: CHECK_IN_TASK_SCORE,
            availableSubtasks: new Set(keyResultsIds),  // Postgres: usar o tipo SET ou JSON com operações de conjunto
            completedSubtasks: new Set()
        }];
    }
}
  
export class CheckInTaskFulfiller implements TaskFulfiller<CheckInEvent> {

    constructor(
        private readonly taskRepository: TaskRepository
    ) {}

    async ingest(event: CheckInEvent): Promise<void> {
        
        const taskId: TaskId = {
            companyId: event.companyId,
            userId: event.userId,
            teamId: event.payload.teamId,
            weekId: buildWeekId(new Date(event.date)),
            templateId: CHECK_IN_TASK_TEMPLATE_ID
        }

        console.log('Computing score for check-in task:', taskId)

        this.taskRepository.addSubtask(taskId, event.payload.keyResultId)
    }
}