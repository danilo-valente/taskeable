import { UserRepository } from "../repositories.ts"
import { buildWeekId } from "./util.ts"
import { TaskCreationProducer } from "./task-queue.ts"

type Args = {
    queue: TaskCreationProducer
    userRepository: UserRepository

}

// Fluxo "pesado" -> não pode estar associado a nenhuma chamada de API síncrona
export default async ({ queue, userRepository }: Args) => {
    const weekId = buildWeekId()

    // Query otimizada -> já traz a lista de teamIds para cada usuário (evitar N+1 queries)
    // Preferencialmente, sem fazer nenhuma chamada para a API do business (Repository próprio que consome as mesmas tabelas)
    const users = await userRepository.findAll()

    let count = 0

    // Fluxo 2.1. Agendamento da designação de tarefas
    for (const user of users) {
        for (const teamId of user.teamIds) {
            // Sequencial, pois os INSERTs estão intermediados por uma fila distribuída (ex: sqs.sendMessage())
            queue.produce({
                companyId: user.companyId,
                userId: user.userId,
                teamId,
                weekId
            })

            count++
        }
    }

    return count
}