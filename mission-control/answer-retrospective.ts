import { Event } from "../events.ts"
import { Task, TaskAssigner, TaskFulfiller, TaskId, TaskRepository, TaskScope } from './task.ts'
import { buildWeekId } from './util.ts'

export const RETROSPECTIVE_ANSWER_TASK_TEMPLATE_ID = 'answer-retrospective'
export const RETROSPECTIVE_ANSWER_TASK_SCORE = 10

// Retrospective Answer is a single-step task, so we just need a simple, constant value to mark it as fulfilled
const SINGLE_STEP = 'answered'

export type RetrospectiveAnswerEvent = Event<{}>

export class RetrospectiveAnswerTaskAssigner implements TaskAssigner {

    async assign(scope: TaskScope): Promise<Task[]> {
        return [{
            userId: scope.userId,
            teamId: scope.teamId,
            weekId: scope.weekId,
            templateId: RETROSPECTIVE_ANSWER_TASK_TEMPLATE_ID,
            score: RETROSPECTIVE_ANSWER_TASK_SCORE,
            // Retrospective Answer is a single-step task, so we just need a simple, constant value to mark it as fulfilled
            availableSubtasks: new Set(SINGLE_STEP),
            completedSubtasks: new Set()
        }]
    }
}
  
export class RetrospectiveAnswerTaskFulfiller implements TaskFulfiller<RetrospectiveAnswerEvent> {

    constructor(
        private readonly taskRepository: TaskRepository
    ) {}

    async ingest(event: RetrospectiveAnswerEvent): Promise<void> {

        // Retrospective Answer events do not relate to an specific team
        // So we need to find all the tasks assigned to this user
        const tasks = await this.taskRepository.findMany({
            userId: event.userId,
            weekId: buildWeekId(),
            templateId: RETROSPECTIVE_ANSWER_TASK_TEMPLATE_ID
        })
        
        for (const task of tasks) {
            const taskId: TaskId = {
                userId: task.userId,
                teamId: task.teamId,
                weekId: task.weekId,
                templateId: task.templateId
            }

            console.log('Computing score for retrospective-answer task:', taskId)

            // Retrospective Answer is a single-step task, so we just need a simple, constant value to mark it as fulfilled
            this.taskRepository.addStep(taskId, SINGLE_STEP)
        }
    }
}