import { Event } from "../events.ts";

export type TaskScope = {
    userId: string
    teamId: string
    weekId: string
}

export type TaskId = TaskScope & {
    templateId: string
}

export type Task = TaskId & {
    score: number
    availableSubtasks: Set<string>
    completedSubtasks: Set<string>
}

export interface TaskRepository {
    createMany(tasks: Task[]): Promise<void>
    findMany(taskId: Partial<TaskId>): Promise<Task[]>
    addStep(taskId: TaskId, stepId: string): Promise<void>
}

/**
 * Acionado no momento em que as tasks devem ser criadas (ou para todos os usuários num job agendado no Domingo, ou sob demanda no primeiro acesso da semana)
 */
export interface TaskAssigner {
    // Verifica se deve ser criado uma Task para este Template neste contexto (user, team)
    // Defini a interface como responsável por retornar uma lista de Tasks pensando em deixar mais flexível para casos futuros, mas acho que todas as implementações atuais vão retornar uma única task, ou um vetor vazio
    assign(scope: TaskScope): Promise<Task[]>
}
  
/**
 * Acionado no momento em que eventos ocorrem na plataforma e checamos quais tasks são cumpridas por estes eventos
 * Existe uma implementação para cada template de task
 */
export interface TaskFulfiller<T extends Event> {
    // Verifica se a task foi cumprida após a ocorrência do evento
    ingest(event: T): Promise<void>
}