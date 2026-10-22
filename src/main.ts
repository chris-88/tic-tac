import { registerSW } from 'virtual:pwa-register'
import './style.css'
import {
  bestMove,
  emptyBoard,
  other,
  outcome,
  play,
  type Board,
  type Mode,
  type Player,
} from './game'

registerSW({ immediate: true })

type Scores = Record<Player | 'draw', number>
type State = {
  board: Board
  turn: Player
  starter: Player
  mode: Mode
  scores: Scores
  locked: boolean
}

const STORAGE_KEY = 'tic-tac:v1'
const CPU: Player = 'O'

function load(): Pick<State, 'mode' | 'scores'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Pick<State, 'mode' | 'scores'>>
      return {
        mode: parsed.mode === 'cpu' ? 'cpu' : 'two',
        scores: { X: 0, O: 0, draw: 0, ...parsed.scores },
      }
    }
  } catch {
    /* storage unavailable: play without persistence */
  }
  return { mode: 'two', scores: { X: 0, O: 0, draw: 0 } }
}

function save(state: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: state.mode, scores: state.scores }))
  } catch {
    /* ignore */
  }
}

const state: State = { board: emptyBoard(), turn: 'X', starter: 'X', locked: false, ...load() }

const root = document.getElementById('app')!
root.innerHTML = `
  <header class="top">
    <h1 class="brand">Har<span>lyn</span></h1>
    <div class="segmented" role="radiogroup" aria-label="Opponent">
      <button type="button" role="radio" data-mode="two">Two players</button>
      <button type="button" role="radio" data-mode="cpu">Computer</button>
    </div>
  </header>

  <section class="scores" aria-label="Score">
    <div class="score score-x" data-score="X"><span class="score-label">X</span><strong>0</strong></div>
    <div class="score score-draw" data-score="draw"><span class="score-label">Draws</span><strong>0</strong></div>
    <div class="score score-o" data-score="O"><span class="score-label">O</span><strong>0</strong></div>
  </section>

  <section class="board-wrap">
    <div class="board" role="grid" aria-label="Board">
      ${Array.from({ length: 9 }, (_, i) => `<button type="button" class="cell" role="gridcell" data-i="${i}" aria-label="Square ${i + 1}"></button>`).join('')}
    </div>
    <svg class="winline" viewBox="0 0 300 300" aria-hidden="true"><line pathLength="1" /></svg>
  </section>

  <p class="status"><span></span></p>

  <footer class="actions">
    <button type="button" class="btn btn-primary" data-action="again">New round</button>
    <button type="button" class="btn btn-ghost" data-action="reset">Reset scores</button>
  </footer>
`

const cells = Array.from(root.querySelectorAll<HTMLButtonElement>('.cell'))
const statusEl = root.querySelector<HTMLSpanElement>('.status span')!
const winline = root.querySelector<SVGSVGElement>('.winline')!
const line = winline.querySelector('line')!
const boardEl = root.querySelector<HTMLElement>('.board')!

const markSvg = (p: Player) =>
  p === 'X'
    ? `<svg class="mark mark-x" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M28 28 72 72"/><path pathLength="1" d="M72 28 28 72"/></svg>`
    : `<svg class="mark mark-o" viewBox="0 0 100 100" aria-hidden="true"><circle pathLength="1" cx="50" cy="50" r="24"/></svg>`

const centre = (i: number) => ({ x: 50 + (i % 3) * 100, y: 50 + Math.floor(i / 3) * 100 })

function render() {
  const o = outcome(state.board)
  const over = o.kind !== 'playing'
  const winning = o.kind === 'win' ? o.line : null

  cells.forEach((cell, i) => {
    const v = state.board[i] ?? null
    const had = cell.dataset.mark ?? ''
    if (had !== (v ?? '')) {
      cell.innerHTML = v ? markSvg(v) : ''
      cell.dataset.mark = v ?? ''
    }
    cell.disabled = over || v !== null || state.locked
    cell.classList.toggle('dim', !!winning && !winning.includes(i))
    cell.classList.toggle('won', !!winning && winning.includes(i))
    cell.setAttribute('aria-label', v ? `Square ${i + 1}, ${v}` : `Square ${i + 1}, empty`)
  })

  boardEl.dataset.turn = over ? '' : state.turn
  boardEl.classList.toggle('over', over)

  if (winning) {
    const a = centre(winning[0])
    const b = centre(winning[2])
    line.setAttribute('x1', String(a.x))
    line.setAttribute('y1', String(a.y))
    line.setAttribute('x2', String(b.x))
    line.setAttribute('y2', String(b.y))
    winline.dataset.player = o.kind === 'win' ? o.player : ''
    winline.classList.add('show')
  } else {
    winline.classList.remove('show')
  }

  const cpuGame = state.mode === 'cpu'
  const name = (p: Player) => (cpuGame ? (p === CPU ? 'Computer' : 'You') : p)
  const text =
    o.kind === 'win'
      ? cpuGame
        ? o.player === CPU
          ? 'Computer takes it'
          : 'You take it'
        : `${o.player} takes it`
      : o.kind === 'draw'
        ? 'Stalemate'
        : state.locked
          ? 'Computer is thinking…'
          : cpuGame
            ? 'Your move'
            : `${name(state.turn)} to move`
  if (statusEl.textContent !== text) {
    statusEl.textContent = text
    statusEl.classList.remove('pop')
    void statusEl.offsetWidth
    statusEl.classList.add('pop')
  }

  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => {
    const on = b.dataset.mode === state.mode
    b.setAttribute('aria-checked', String(on))
  })
  root.querySelectorAll<HTMLElement>('[data-score]').forEach((el) => {
    const key = el.dataset.score as keyof Scores
    el.querySelector('strong')!.textContent = String(state.scores[key])
    el.classList.toggle('active', !over && key === state.turn)
  })
  root.querySelector<HTMLButtonElement>('[data-action="again"]')!.classList.toggle('show', over)
}

function buzz(ms: number) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}

function settle() {
  const o = outcome(state.board)
  if (o.kind === 'win') {
    state.scores[o.player]++
    buzz(30)
  } else if (o.kind === 'draw') {
    state.scores.draw++
  }
  if (o.kind !== 'playing') save(state)
  return o.kind !== 'playing'
}

function move(i: number) {
  if (state.locked || state.board[i] !== null || outcome(state.board).kind !== 'playing') return
  state.board = play(state.board, i, state.turn)
  buzz(8)
  if (!settle()) {
    state.turn = other(state.turn)
    if (state.mode === 'cpu' && state.turn === CPU) cpuMove()
  }
  render()
}

function cpuMove() {
  state.locked = true
  window.setTimeout(() => {
    state.locked = false
    const i = bestMove(state.board, CPU)
    if (i >= 0) state.board = play(state.board, i, CPU)
    if (!settle()) state.turn = other(CPU)
    render()
  }, 420)
}

function newRound() {
  state.board = emptyBoard()
  state.starter = other(state.starter)
  state.turn = state.starter
  state.locked = false
  render()
  if (state.mode === 'cpu' && state.turn === CPU) cpuMove()
}

root.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('button')
  if (!t) return
  if (t.dataset.i !== undefined) return move(Number(t.dataset.i))
  if (t.dataset.action === 'again') return newRound()
  if (t.dataset.action === 'reset') {
    state.scores = { X: 0, O: 0, draw: 0 }
    state.starter = 'O'
    save(state)
    return newRound()
  }
  if (t.dataset.mode && t.dataset.mode !== state.mode) {
    state.mode = t.dataset.mode as Mode
    state.scores = { X: 0, O: 0, draw: 0 }
    state.starter = 'O'
    save(state)
    newRound()
  }
})

// Tap anywhere on a finished board to start the next round.
boardEl.addEventListener('click', () => {
  if (outcome(state.board).kind !== 'playing') newRound()
})

render()
