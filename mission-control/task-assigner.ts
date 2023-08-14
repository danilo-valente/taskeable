import { KeyResultRepository } from "../repositories.ts"
import { CheckInTaskAssigner } from "./check-in.ts"
import { RetrospectiveAnswerTaskAssigner } from "./answer-retrospective.ts"
import { Task, TaskAssigner, TaskRepository, TaskScope } from "./task.ts"
import { TaskCreationConsumer } from "./task-queue.ts"

type Args = {
    queue: TaskCreationConsumer
    taskRepository: TaskRepository
    keyResultRepository: KeyResultRepository
}

export default ({ queue, keyResultRepository, taskRepository }: Args) => {
    
    const assigners: TaskAssigner[] = [
        new CheckInTaskAssigner(keyResultRepository),
        new RetrospectiveAnswerTaskAssigner(),
        // TODO: add other assigners here
    ]

    // Fluxo 2.2. Designação e criação de tarefas
    // Cada worker da fila vai executar essa função
    // TODO: implement an actual queue + processor here (this is just a placeholder)
    queue.consume(async (scope: TaskScope) => {
        const tasks: Task[] = [];
        for (const assigner of assigners) {
            try {
                tasks.push(
                    ...await assigner.assign(scope)
                );
            } catch (error) {
                // TODO: loga o erro mas não prejudica outros assigners
                console.error(`Failed to assign tasks for ${scope.userId} in ${scope.teamId} for ${scope.weekId} with ${assigner.constructor.name}:`, error)
            }
        }
        
        // Otimização: um único INSERT para várias entidades
        await taskRepository.createMany(tasks)
    })
}