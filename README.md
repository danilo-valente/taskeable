## Setup

- Install Deno: https://deno.land/manual@v1.36.1/getting_started/installation

## Run

```bash
deno repl -A --eval "import { getScores, printScores, checkInKeyResult, answerRetrospective } from './main.ts'"
```

### The following operations will run on startup

- All available tasks are created and assigned
- Subscribers are initialized to listen to events

### Constraints

- Tasks might have different multipliers according to the number of their subtasks
    - e.g.: an user might have 3 key-results to check-in, while another one might have a single one or even none
- The total score is calculated taking into consideration the each task's score * the number of completed subtasks; the same applies to calculate the total possible score for a team
- A subtask is scored only once, even if duplicate events affecting this task are dispatched

## Commands

The following commands are available in REPL:

- Show all team scores: `await getScores()`
- Simulate key-result check-in:
    - `await checkInKeyResult('user_1', 'key_result_1')`
    - `await checkInKeyResult('user_1', 'key_result_2')`
- Simulate retrospective answer:
    - `await answerRetrospective('user_1')`
    - `await answerRetrospective('user_2')`