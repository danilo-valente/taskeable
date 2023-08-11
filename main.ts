import { CHECK_IN_TASK_TEMPLATE_ID, CheckInEvent } from "./mission-control/check-in.ts";
import { RETROSPECTIVE_ANSWER_TASK_TEMPLATE_ID, RetrospectiveAnswerEvent } from "./mission-control/answer-retrospective.ts";
import consumeTasks from "./mission-control/consumer.ts";
import createTasks from "./mission-control/scheduler.ts";
import { buildWeekId } from "./mission-control/util.ts";
import { STATIC_TEAM_IDS, keyResultRepository, localEventPublisher, localEventSubscriber, scoreRepository, taskRepository, userRepository } from "./providers.ts";

createTasks({
    userRepository,
    taskRepository,
    keyResultRepository
}).then(taskCount =>
    console.log(`The weekly just started and ${taskCount} tasks were created`)
)

consumeTasks({
    eventSubscriber: localEventSubscriber,
    taskRepository
})

export async function getScores(date = new Date()) {
    const list = await Promise.all(
        [...STATIC_TEAM_IDS].map(async teamId => {
            const { progress, available } = await scoreRepository.getScore(teamId, buildWeekId(date))

            const percentage = Math.round(progress / available * 100)

            return { [teamId]: { progress, available, percentage } }
        })
    )

    return list.reduce((map, score) => ({ ...map, ...score }), {})
}

export function printScores(date = new Date()) {
    getScores(date).then(scores => console.table(scores))
}

export async function checkInKeyResult(userId: string, keyResultId: string) {

    const user = await userRepository.findById(userId)
    
    localEventPublisher.publish<CheckInEvent>(CHECK_IN_TASK_TEMPLATE_ID, {
        userId: userId,
        companyId: 'TODO',
        payload: {
            teamId: user!.teamIds[0],
            keyResultId: keyResultId
        }
    })
}

export async function answerRetrospective(userId: string) {
    localEventPublisher.publish<RetrospectiveAnswerEvent>(RETROSPECTIVE_ANSWER_TASK_TEMPLATE_ID, {
        userId: userId,
        companyId: 'TODO',
        payload: {}
    })
}
