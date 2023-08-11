import { EventSubscriber } from "../events.ts"
import { RETROSPECTIVE_ANSWER_TASK_TEMPLATE_ID, RetrospectiveAnswerEvent, RetrospectiveAnswerTaskFulfiller } from "./answer-retrospective.ts"
import { CHECK_IN_TASK_TEMPLATE_ID, CheckInEvent, CheckInTaskFulfiller } from "./check-in.ts"
import { TaskRepository } from "./task.ts"

type Args = {
    eventSubscriber: EventSubscriber
    taskRepository: TaskRepository
}

export default ({ eventSubscriber, taskRepository }: Args) => {
    
    // Key Result Check In
    const checkInFulfiller = new CheckInTaskFulfiller(taskRepository)

    eventSubscriber.subscribe<CheckInEvent>(CHECK_IN_TASK_TEMPLATE_ID, async (event) => {
        await checkInFulfiller.ingest(event)
    })

    // Retrospective Answer
    const retrospectiveAnswerFulfiller = new RetrospectiveAnswerTaskFulfiller(taskRepository)

    eventSubscriber.subscribe<RetrospectiveAnswerEvent>(RETROSPECTIVE_ANSWER_TASK_TEMPLATE_ID, async (event) => {
        await retrospectiveAnswerFulfiller.ingest(event)
    })
}