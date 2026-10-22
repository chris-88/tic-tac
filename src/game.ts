export type Player = 'X' | 'O'
export type Cell = Player | null
export type Board = readonly Cell[]
export type Mode = 'two' | 'cpu'

export const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export const emptyBoard = (): Board => Array<Cell>(9).fill(null)

export const other = (p: Player): Player => (p === 'X' ? 'O' : 'X')

export function winningLine(board: Board): readonly [number, number, number] | null {
  for (const line of LINES) {
    const [a, b, c] = line
    const v = board[a]
    if (v && v === board[b] && v === board[c]) return line
  }
  return null
}

export type Outcome =
  | { kind: 'win'; player: Player; line: readonly [number, number, number] }
  | { kind: 'draw' }
  | { kind: 'playing' }

export function outcome(board: Board): Outcome {
  const line = winningLine(board)
  if (line) return { kind: 'win', player: board[line[0]] as Player, line }
  if (board.every(Boolean)) return { kind: 'draw' }
  return { kind: 'playing' }
}

export function play(board: Board, index: number, player: Player): Board {
  if (board[index] !== null) return board
  const next = [...board]
  next[index] = player
  return next
}

/** Perfect play via minimax, choosing at random among equally good moves so games differ. */
export function bestMove(board: Board, me: Player): number {
  const empties = board.flatMap((c, i) => (c === null ? [i] : []))
  let best = -Infinity
  let choices: number[] = []
  for (const i of empties) {
    const score = -negamax(play(board, i, me), other(me), me)
    if (score > best) {
      best = score
      choices = [i]
    } else if (score === best) {
      choices.push(i)
    }
  }
  return choices[Math.floor(Math.random() * choices.length)] ?? empties[0] ?? -1
}

// Score from the perspective of `turn`. Shorter wins score higher so the CPU finishes rather than dawdles.
function negamax(board: Board, turn: Player, me: Player, depth = 0): number {
  const o = outcome(board)
  if (o.kind === 'win') return o.player === turn ? 10 - depth : depth - 10
  if (o.kind === 'draw') return 0
  let best = -Infinity
  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue
    best = Math.max(best, -negamax(play(board, i, turn), other(turn), me, depth + 1))
  }
  return best
}
