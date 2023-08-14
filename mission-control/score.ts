// Aggregate Score
export type Score = {
    teamId: string
    weekId: string
    progress: number
    available: number
}

// DDD: um Repository é uma camada de dados cujo escopo está ligado a um único Aggregate
// Opção 1: ScoreRepository lê da tabela Score, pré-computada com os dados de progresso
// Opção 2: ScoreRepository funciona como uma "view", que lê da tabela de Tasks utilizando filtros específicos e calcula o progresso (importante aplicar índices aqui)
export interface ScoreRepository {
    getScore(teamId: string, weekId: string): Promise<Score>
}

/**
 * Opção 1:
 * ========
 * - TABLE Score
 * - TABLE Task
 * - Ao criar as Tasks da semana, o Score semanal do time também deve ser criado na tabela Score
 * - Ao concluir cada Task, o Score deve ser atualizado
 * - Tradeoffs:
 *   - Leitura mais rápida -> dados pré-computados
 *   - Escrita mais lenta -> a cada atualização o Score precisa ser recalculado
 *   - Maior complexidade de escrita -> cada mudança feita em cada Task deve disparar um recálculo de Score -> necessidade de transações ou outro pattern equivalente
 * - Conclusão: abordagem para grandes quantidades de informação (muitos times, muitas tasks, muitos key-results) -> horizonte distante
 * 
 * Opção 2:
 * ========
 * - TABLE Task
 * - Ao criar as Tasks da semana, nada mais precisa ser feito
 * - Ao concluir cada Task, nada mais precisa ser feito
 * - Tradeoffs:
 *   - Leitura "mais lenta" -> apenas com GRANDES quantidades de dados, mas com o uso de índices (e outras técnicas) isso é postergado
 *   - Escrita mais "rápida" -> INSERT-only e sem transações, pois só escreve em uma única tabela (Tasks)
 * - Ela serve como 1o passo para a Opção 1, se um dia ela for necessária
 * - Conclusão: abordagem para pequenas e médias quantidades de informação -> contexto atual
 */