import { CHECK_IN_TASK_TEMPLATE_ID, CheckInEvent } from "./mission-control/check-in.ts";
import { RETROSPECTIVE_ANSWER_TASK_TEMPLATE_ID, RetrospectiveAnswerEvent } from "./mission-control/answer-retrospective.ts";
import planTasks from "./mission-control/task-planner.ts";
import assignTasks from "./mission-control/task-assigner.ts";
import consumeEvents from "./mission-control/consumer.ts";
import { buildWeekId } from "./mission-control/util.ts";
import { STATIC_TEAM_IDS, keyResultRepository, localEventPublisher, localEventSubscriber, localTaskCreationConsumer, localTaskCreationProducer, scoreRepository, taskRepository, userRepository } from "./providers.ts";

// [business/mission-control/task-planner]
// Fluxo 2.1. Designação de Tasks - Planejamento
// Disparado por um Cron job cadastrado em algum lugar (interno na API, scheduler-microservice, CloudWatch, etc)
planTasks({
    queue: localTaskCreationProducer,
    userRepository
}).then(taskCount =>
    console.log(`The week just started and ${taskCount} tasks were created`)
)

// [business/mission-control/task-assigner]
// Fluxo 2.2. Designação de Tasks - Criação
// Iniciado manualmente, mas consome automaticamente mensagens da fila
// Importante: este fluxo pode (e, idealmente, deveria) ser disparado também quando um usuário é adicionado a um time
assignTasks({
    queue: localTaskCreationConsumer,
    taskRepository,
    keyResultRepository
})

// [business/mission-control/event-consumer]
// Fluxo 3. Cumprimento de Tasks
consumeEvents({
    eventSubscriber: localEventSubscriber,
    taskRepository
})

// [business/mission-control/api] Simula visualização na home -> endpoint do Mission Control
// Fluxo 4. Cálculo de Score
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

// [business/core] Simula a operação (mutation) de check-in de Key-Result que ocorre no business
export async function checkInKeyResult(userId: string, keyResultId: string, companyId = 'company_1') {

    // Check-in é registrado, dados são inseridos no banco, email/notificações é enviado, etc

    const user = await userRepository.findById(userId)
    
    // Fluxo 1. Disparo de eventos
    localEventPublisher.publish<CheckInEvent>(CHECK_IN_TASK_TEMPLATE_ID, {
        userId: userId,
        companyId: companyId,
        date: Date.now(),
        payload: {
            teamId: user!.teamIds[0],   // Na implementação, utilizar o teamId do keyResult
            keyResultId: keyResultId
            // TODO: passar todas as infos necessárias aqui -> evitar queries redudantes no Mission Control
        }
    })
}

// [routines-microservice] Simula a operação que ocorre dentro do routines-microservice
export async function answerRetrospective(userId: string, companyId = 'company_1') {

    // Resposta é registrada, dados são inseridos no banco, email/notificações é enviado, etc

    // Fluxo 1. Disparo de eventos
    localEventPublisher.publish<RetrospectiveAnswerEvent>(RETROSPECTIVE_ANSWER_TASK_TEMPLATE_ID, {
        userId: userId,
        companyId: companyId,
        date: Date.now(),
        payload: {}
    })
}
