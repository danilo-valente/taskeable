import { KeyResultRepository, UserRepository } from "../repositories.ts"
import { CheckInTaskAssigner } from "./check-in.ts"
import { RetrospectiveAnswerTaskAssigner } from "./answer-retrospective.ts"
import { TaskAssigner, TaskRepository, TaskScope } from "./task.ts"
import { buildWeekId } from "./util.ts"

type Args = {
    taskRepository: TaskRepository
    keyResultRepository: KeyResultRepository
    userRepository: UserRepository
}

export interface TaskCreationQueue {
    add(scope: TaskScope): Promise<void>
}

export default async ({ taskRepository, keyResultRepository, userRepository }: Args) => {
    
    const assigners: TaskAssigner[] = [
        new CheckInTaskAssigner(keyResultRepository),
        new RetrospectiveAnswerTaskAssigner(),
        // TODO: add other assigners here
    ]

    // TODO: implement an actual queue + processor here (this is just a placeholder)
    const taskCreationQueue: TaskCreationQueue = {
        async add(scope: TaskScope) {
            for (const assigner of assigners) {
                const tasks = await assigner.assign(scope)

                await taskRepository.createMany(tasks)
            }
        }
    }

    const weekId = buildWeekId()

    const users = await userRepository.findAll()

    let count = 0

    for (const user of users) {
        for (const teamId of user.teamIds) {
            taskCreationQueue.add({
                userId: user.userId,
                teamId,
                weekId
            })

            count++
        }
    }

    return count
}