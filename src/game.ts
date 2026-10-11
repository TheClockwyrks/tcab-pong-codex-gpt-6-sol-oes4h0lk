import type { Game, UpdateApi, RenderApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as C from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
  readonly theta: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly obstacleClock: number;
  readonly obstacleClockRunning: boolean;
  readonly simTime: number;
  readonly muted: boolean;
  readonly pointerStarts: Readonly<Record<number, number>>;
}
export interface MenuRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface CaromDebugApi {
  readonly version: number;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, index: number): CaromState;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleDriven(
    s: DeepReadonly<CaromState>,
    side: Side,
    v: boolean,
  ): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    vx: number,
    vy: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, v: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setObstacleClock(s: DeepReadonly<CaromState>, v: number): CaromState;
  setObstacleClockRunning(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): object;
  menuItemRect(s: DeepReadonly<CaromState>, index: number): MenuRect | null;
}
export const BACKGROUND = "#080f1a";
const clamp = (v: number, a: number, b: number): number =>
  Math.max(a, Math.min(b, v));
const newSign = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const park = (): BallState => ({
  x: C.FIELD_CX,
  y: C.FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: C.HOLD_TIME,
  serveSign: newSign(),
  trail: [],
});
const pose = (index: number, t: number): ObstacleState => ({
  index,
  cx: C.OBSTACLE_CENTERS[index].x,
  cy:
    C.OBSTACLE_CENTERS[index].y +
    (index === 0 ? 1 : -1) *
      C.OBSTACLE_SWAY_AMP *
      Math.sin((2 * Math.PI * t) / C.OBSTACLE_SWAY_PERIOD),
  theta: C.OBSTACLE_SPIN_RATE * t,
});
const initial = (muted: boolean): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: 0,
  titleIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: {
    left: { cy: C.FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    right: { cy: C.FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
  },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: park(),
  obstacles: [pose(0, 0), pose(1, 0)],
  obstacleClock: 0,
  obstacleClockRunning: true,
  simTime: 0,
  muted,
  pointerStarts: {},
});
const title = (s: DeepReadonly<CaromState>): CaromState => ({
  ...initial(s.muted),
  simTime: s.simTime,
  titleIndex: s.titleIndex,
  menuIndex: s.titleIndex,
});
const start = (s: DeepReadonly<CaromState>, mode: Mode): CaromState => ({
  ...s,
  screen: "countdown",
  mode,
  resumeScreen: "playing",
  menuIndex: 0,
  score: { p1: 0, p2: 0 },
  winner: null,
  receiver: "left",
  ball: park(),
  paddles: {
    left: { ...s.paddles.left, cy: C.FIELD_CY, vy: 0 },
    right: { ...s.paddles.right, cy: C.FIELD_CY, vy: 0 },
  },
  obstacleClock: 0,
  obstacleClockRunning: true,
  obstacles: s.obstacles.map((o) => pose(o.index, 0)),
  pointerStarts: {},
});
const withClock = (s: DeepReadonly<CaromState>, t: number): CaromState => ({
  ...s,
  obstacleClock: t,
  obstacles: s.obstacles.map((o) => pose(o.index, t)),
});
const move = (
  p: DeepReadonly<PaddleState>,
  v: number,
  dt: number,
): PaddleState => {
  const cy = clamp(p.cy + v * dt, C.PADDLE_MIN_CY, C.PADDLE_MAX_CY);
  return {
    ...p,
    cy,
    vy: dt > 0 && cy !== p.cy + v * dt ? (cy - p.cy) / dt : v,
  };
};
const menuItems = (s: DeepReadonly<CaromState>): readonly string[] =>
  s.screen === "title"
    ? C.TITLE_ITEMS
    : s.screen === "paused"
      ? C.PAUSE_ITEMS
      : s.screen === "matchover"
        ? C.MATCHOVER_ITEMS
        : s.screen === "howto"
          ? ["BACK TO MENU"]
          : [];
const menuRect = (s: DeepReadonly<CaromState>, i: number): MenuRect | null =>
  i < 0 || i >= menuItems(s).length
    ? null
    : {
        x: C.FIELD_CX - 185,
        y:
          (s.screen === "howto" ? 580 : s.screen === "title" ? 392 : 382) +
          67 * i,
        w: 370,
        h: 53,
      };
const ballRequired = (s: DeepReadonly<CaromState>): DeepReadonly<BallState> => {
  if (!s.ball) throw Error("ball is absent");
  return s.ball;
};
const ballSet = (
  s: DeepReadonly<CaromState>,
  v: Partial<BallState>,
): CaromState => ({ ...s, ball: { ...ballRequired(s), ...v } });
const paddleSet = (
  s: DeepReadonly<CaromState>,
  side: Side,
  v: Partial<PaddleState>,
): CaromState => ({
  ...s,
  paddles: { ...s.paddles, [side]: { ...s.paddles[side], ...v } },
});
function makeDebug(): CaromDebugApi {
  return {
    version: C.CAROM_DEBUG_VERSION,
    clearWorld: (s) => ({ ...s, ball: null, obstacles: [] }),
    spawnBall: (s) => ({ ...s, ball: park() }),
    spawnObstacle: (s, index) => {
      if (index !== 0 && index !== 1) throw Error("invalid obstacle index");
      return {
        ...s,
        obstacles: [
          ...s.obstacles.filter((o) => o.index !== index),
          pose(index, s.obstacleClock),
        ].sort((a, b) => a.index - b.index),
      };
    },
    reset: (s) => initial(s.muted),
    reconcile: (s) => withClock(s, s.obstacleClock),
    setScreen: (s, screen) => ({ ...s, screen }),
    setMode: (s, mode) => ({ ...s, mode }),
    setMenuIndex: (s, menuIndex) => ({ ...s, menuIndex }),
    setTitleIndex: (s, titleIndex) => ({ ...s, titleIndex }),
    setResumeScreen: (s, resumeScreen) => ({ ...s, resumeScreen }),
    setScore: (s, p1, p2) => ({ ...s, score: { p1, p2 } }),
    setWinner: (s, winner) => ({ ...s, winner }),
    setReceiver: (s, receiver) => ({ ...s, receiver }),
    setPaddleCy: (s, side, cy) => paddleSet(s, side, { cy }),
    setPaddleVy: (s, side, drivenVy) => paddleSet(s, side, { drivenVy }),
    setPaddleDriven: (s, side, driven) => paddleSet(s, side, { driven }),
    setBallPosition: (s, x, y) => ballSet(s, { x, y }),
    setBallVelocity: (s, vx, vy) => ballSet(s, { vx, vy }),
    setBallSpin: (s, spin) => ballSet(s, { spin }),
    setBallHeld: (s, held) => ballSet(s, { held }),
    setBallHoldTimer: (s, holdTimer) => ballSet(s, { holdTimer }),
    setBallServeSign: (s, serveSign) => ballSet(s, { serveSign }),
    drawBallServeSign: (s) => ballSet(s, { serveSign: newSign() }),
    setAiTracking: (s, tracking) => ({ ...s, ai: { ...s.ai, tracking } }),
    setAiMovement: (s, movement) => ({ ...s, ai: { ...s.ai, movement } }),
    setMuted: (s, muted) => {
      return { ...s, muted };
    },
    setObstacleClock: (s, t) => withClock(s, t),
    setObstacleClockRunning: (s, obstacleClockRunning) => ({
      ...s,
      obstacleClockRunning,
    }),
    menuItemRect: menuRect,
    snapshot: (s) => ({
      version: C.CAROM_DEBUG_VERSION,
      screen: s.screen,
      mode: s.mode,
      menuIndex: s.menuIndex,
      titleIndex: s.titleIndex,
      resumeScreen: s.resumeScreen,
      score: { ...s.score },
      winner: s.winner,
      muted: s.muted,
      paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
      ai: { ...s.ai },
      receiver: s.receiver,
      ball: s.ball
        ? {
            ...s.ball,
            speed: Math.hypot(s.ball.vx, s.ball.vy),
            trail: s.ball.trail.map((p) => ({ ...p })),
          }
        : null,
      obstacles: s.obstacles.map((o) => pose(o.index, s.obstacleClock)),
      obstacleClock: s.obstacleClock,
      obstacleClockRunning: s.obstacleClockRunning,
      simTime: s.simTime,
    }),
  };
}

interface Events {
  paddle: boolean;
  wall: boolean;
  obstacle: boolean;
  score: boolean;
}
type MovingBall = { -readonly [P in keyof BallState]: BallState[P] };
function paddleCollision(
  b: MovingBall,
  p: PaddleState,
  side: Side,
  e: Events,
): void {
  const x0 = side === "left" ? C.P1_X0 : C.P2_X0,
    x1 = side === "left" ? C.P1_X1 : C.P2_X1,
    y0 = p.cy - C.PADDLE_HALF,
    y1 = p.cy + C.PADDLE_HALF;
  if (!(
    b.x > x0 - C.BALL_R &&
    b.x < x1 + C.BALL_R &&
    b.y > y0 - C.BALL_R &&
    b.y < y1 + C.BALL_R
  ))
    return;
  const d = [
      b.x - x0 + C.BALL_R,
      x1 + C.BALL_R - b.x,
      b.y - y0 + C.BALL_R,
      y1 + C.BALL_R - b.y,
    ],
    face = d.indexOf(Math.min(...d));
  if (face < 2) {
    b.x = side === "left" ? C.P1_X1 + C.BALL_R : C.P2_X0 - C.BALL_R;
    const speed = Math.min(Math.hypot(b.vx, b.vy) * C.SPEED_MULT, C.SPEED_CAP),
      angle = clamp((b.y - p.cy) / C.PADDLE_HALF, -1, 1) * C.MAX_BOUNCE_ANGLE;
    b.vx = (side === "left" ? 1 : -1) * speed * Math.cos(angle);
    b.vy = speed * Math.sin(angle);
    b.spin = clamp(
      b.spin + p.vy * C.SPIN_FROM_PADDLE,
      -C.SPIN_CLAMP,
      C.SPIN_CLAMP,
    );
    e.paddle = true;
  } else {
    b.y = face === 2 ? y0 - C.BALL_R : y1 + C.BALL_R;
    if ((face === 2 && b.vy > 0) || (face === 3 && b.vy < 0)) {
      b.vy = -b.vy;
      e.wall = true;
    }
  }
}
function obstacleCollision(b: MovingBall, o: ObstacleState, e: Events): void {
  const c = Math.cos(o.theta),
    s = Math.sin(o.theta),
    dx = b.x - o.cx,
    dy = b.y - o.cy,
    lx = dx * c + dy * s,
    ly = -dx * s + dy * c;
  const qx = clamp(lx, -C.OBSTACLE_HW, C.OBSTACLE_HW),
    qy = clamp(ly, -C.OBSTACLE_HH, C.OBSTACLE_HH);
  let nx = lx - qx,
    ny = ly - qy;
  const dist = Math.hypot(nx, ny);
  if (dist >= C.BALL_R) return;
  let push: number;
  if (dist > 0) {
    nx /= dist;
    ny /= dist;
    push = C.BALL_R - dist;
  } else {
    const px = C.OBSTACLE_HW - Math.abs(lx),
      py = C.OBSTACLE_HH - Math.abs(ly);
    if (px <= py) {
      nx = lx >= 0 ? 1 : -1;
      ny = 0;
      push = C.BALL_R + px;
    } else {
      nx = 0;
      ny = ly >= 0 ? 1 : -1;
      push = C.BALL_R + py;
    }
  }
  const wx = nx * c - ny * s,
    wy = nx * s + ny * c,
    dot = b.vx * wx + b.vy * wy;
  if (dot < 0) {
    b.vx -= 2 * dot * wx;
    b.vy -= 2 * dot * wy;
    e.obstacle = true;
  }
  b.x += wx * push;
  b.y += wy * push;
}
function fly(
  ball: DeepReadonly<BallState>,
  paddles: CaromState["paddles"],
  obstacles: readonly ObstacleState[],
  dt: number,
  e: Events,
): BallState {
  const b: MovingBall = { ...ball, trail: [...ball.trail] },
    n = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * dt) / C.MAX_SUBSTEP)),
    h = dt / n;
  for (let i = 0; i < n; i++) {
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > 0) {
      const a = (b.spin / speed) * h,
        c = Math.cos(a),
        s = Math.sin(a),
        vx = b.vx;
      b.vx = vx * c - b.vy * s;
      b.vy = vx * s + b.vy * c;
    }
    b.spin *= 0.5 ** (h / C.SPIN_HALFLIFE);
    b.x += b.vx * h;
    b.y += b.vy * h;
    if (b.y - C.BALL_R < 0 && b.vy < 0) {
      b.y = C.BALL_R;
      b.vy = -b.vy;
      e.wall = true;
    } else if (b.y + C.BALL_R > C.FIELD_H && b.vy > 0) {
      b.y = C.FIELD_H - C.BALL_R;
      b.vy = -b.vy;
      e.wall = true;
    }
    paddleCollision(b, paddles.left, "left", e);
    paddleCollision(b, paddles.right, "right", e);
    for (const o of obstacles) obstacleCollision(b, o, e);
  }
  return b;
}
function confirm(s: DeepReadonly<CaromState>): CaromState {
  if (s.screen === "title") {
    if (s.menuIndex === 2)
      return { ...s, screen: "howto", titleIndex: 2, menuIndex: 0 };
    return start(
      { ...s, titleIndex: s.menuIndex },
      s.menuIndex === 0 ? "solo" : "versus",
    );
  }
  if (s.screen === "howto") return title(s);
  if (s.screen === "paused")
    return s.menuIndex === 0
      ? { ...s, screen: s.resumeScreen }
      : s.menuIndex === 1
        ? start(s, s.mode)
        : title(s);
  if (s.screen === "matchover")
    return s.menuIndex === 0 ? start(s, s.mode) : title(s);
  return { ...s };
}
function readInput(s: DeepReadonly<CaromState>, api: UpdateApi): CaromState {
  const input = api.input,
    screen = s.screen;
  const up = input.pressed("p1-up") || input.pressed("p2-up"),
    down = input.pressed("p1-down") || input.pressed("p2-down"),
    ok = input.pressed("confirm"),
    back = input.pressed("back"),
    pause = input.pressed("pause"),
    mute = input.pressed("mute");
  if (mute) api.audio.setMuted(!s.muted);
  else if (api.audio.muted() !== s.muted) api.audio.setMuted(s.muted);
  let next: CaromState = { ...s, muted: api.audio.muted() };
  if (screen === "countdown" || screen === "playing") {
    if (pause)
      next = { ...next, screen: "paused", resumeScreen: screen, menuIndex: 0 };
    return next;
  }
  if (screen === "howto" && (ok || back)) return title(next);
  if (screen === "paused" && (pause || back))
    return { ...next, screen: next.resumeScreen };
  if (screen === "matchover" && back) return title(next);
  const count = menuItems(next).length;
  if (!count) return next;
  if (up) next = { ...next, menuIndex: (next.menuIndex - 1 + count) % count };
  else if (down) next = { ...next, menuIndex: (next.menuIndex + 1) % count };
  else if (ok) return confirm(next);
  const starts = { ...next.pointerStarts };
  const hit = (x: number, y: number): number => {
    for (let i = 0; i < count; i++) {
      const r = menuRect(next, i);
      if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)
        return i;
    }
    return -1;
  };
  let clicked = false;
  for (const p of input.pointerSamples()) {
    if (p.button !== "primary" && p.type !== "move") continue;
    const i = hit(p.x, p.y);
    if (i >= 0) next = { ...next, menuIndex: i };
    if (p.type === "down") starts[p.id] = i;
    if (p.type === "up") {
      if (i >= 0 && starts[p.id] === i) clicked = true;
      delete starts[p.id];
    }
  }
  next = { ...next, pointerStarts: starts };
  return clicked && !ok ? confirm(next) : next;
}
export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api) {
    for (const name of C.ACTIONS)
      api.input.register(name, { keys: [...C.BINDINGS[name]] });
    api.audio.define(C.CUES.paddleHit, {
      wave: "triangle",
      freq: 520,
      freqTo: 330,
      durationMs: 75,
      gain: 0.18,
    });
    api.audio.define(C.CUES.wallBounce, {
      wave: "sine",
      freq: 310,
      freqTo: 220,
      durationMs: 55,
      gain: 0.12,
    });
    api.audio.define(C.CUES.obstacleBounce, {
      wave: "square",
      freq: 190,
      freqTo: 410,
      durationMs: 85,
      gain: 0.09,
    });
    api.audio.define(C.CUES.score, {
      wave: "sine",
      freq: 660,
      freqTo: 930,
      durationMs: 240,
      gain: 0.23,
    });
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("mode", (s) => s.mode);
    api.diagnostics.register("score", (s) => s.score.p1 + " : " + s.score.p2);
    api.diagnostics.register("ball", (s) =>
      s.ball ? s.ball.x.toFixed(0) + ", " + s.ball.y.toFixed(0) : "none",
    );
    api.diagnostics.register("velocity", (s) =>
      s.ball ? s.ball.vx.toFixed(0) + ", " + s.ball.vy.toFixed(0) : "none",
    );
    api.diagnostics.register("speed", (s) =>
      s.ball ? Math.hypot(s.ball.vx, s.ball.vy).toFixed(0) : "0",
    );
    api.diagnostics.register("spin", (s) =>
      s.ball ? s.ball.spin.toFixed(0) : "0",
    );
    api.diagnostics.register(
      "left",
      (s) => s.paddles.left.cy.toFixed(0) + ", " + s.paddles.left.vy.toFixed(0),
    );
    api.diagnostics.register(
      "right",
      (s) =>
        s.paddles.right.cy.toFixed(0) + ", " + s.paddles.right.vy.toFixed(0),
    );
    return [initial(false), makeDebug()];
  },
  update(state, api, dt) {
    const entered = readInput(state, api);
    let s: CaromState = { ...entered, simTime: state.simTime + dt };
    if (s.screen !== "playing" && s.screen !== "countdown") return s;
    const val = (n: C.ActionName): number => (api.input.value(n) > 0 ? 1 : 0);
    const left = s.paddles.left,
      right = s.paddles.right;
    const lvy = left.driven
      ? left.drivenVy
      : ((s.mode === "solo"
          ? Math.max(val("p1-down"), val("p2-down"))
          : val("p1-down")) -
          (s.mode === "solo"
            ? Math.max(val("p1-up"), val("p2-up"))
            : val("p1-up"))) *
        C.PADDLE_SPEED;
    let rvy: number;
    if (right.driven) rvy = right.drivenVy;
    else if (s.mode === "versus")
      rvy = (val("p2-down") - val("p2-up")) * C.PADDLE_SPEED;
    else {
      let target = C.AI_HOME_Y,
        zone = C.AI_HOME_DEADZONE;
      if (s.ai.tracking && s.screen === "playing" && s.ball && s.ball.vx > 0) {
        target = s.ball.y - s.ball.vy * C.AI_REACT;
        zone = C.AI_DEADZONE;
      }
      const diff = target - right.cy;
      rvy =
        !s.ai.movement || Math.abs(diff) <= zone || dt <= 0
          ? 0
          : Math.sign(diff) * Math.min(C.AI_SPEED, Math.abs(diff) / dt);
    }
    s = {
      ...s,
      paddles: { left: move(left, lvy, dt), right: move(right, rvy, dt) },
    };
    const e: Events = {
      paddle: false,
      wall: false,
      obstacle: false,
      score: false,
    };
    let sampleTrail = false;
    if (s.ball && s.screen === "countdown") {
      const holdTimer = s.ball.holdTimer - dt;
      sampleTrail = holdTimer > 0;
      s =
        holdTimer <= 0
          ? {
              ...s,
              screen: "playing",
              ball: {
                ...s.ball,
                held: false,
                holdTimer: 0,
                vx:
                  (s.receiver === "left" ? -1 : 1) *
                  C.SERVE_SPEED *
                  Math.cos(C.SERVE_ANGLE),
                vy: s.ball.serveSign * C.SERVE_SPEED * Math.sin(C.SERVE_ANGLE),
                trail: [],
              },
            }
          : { ...s, ball: { ...s.ball, holdTimer } };
    } else if (s.ball && s.screen === "playing" && !s.ball.held) {
      const b = fly(s.ball, s.paddles, s.obstacles, dt, e);
      sampleTrail = true;
      if (b.x - C.BALL_R > C.FIELD_W || b.x + C.BALL_R < 0) {
        const scorer: Side = b.x > C.FIELD_CX ? "left" : "right",
          score = {
            p1: s.score.p1 + (scorer === "left" ? 1 : 0),
            p2: s.score.p2 + (scorer === "right" ? 1 : 0),
          },
          won =
            (scorer === "left" ? score.p1 : score.p2) >= C.WIN_SCORE &&
            Math.abs(score.p1 - score.p2) >= C.WIN_LEAD;
        s = {
          ...s,
          score,
          winner: won ? scorer : null,
          screen: won ? "matchover" : "countdown",
          menuIndex: won ? 0 : s.menuIndex,
          receiver: scorer === "left" ? "right" : "left",
          ball: won ? b : park(),
        };
        e.score = true;
        sampleTrail = false;
      } else s = { ...s, ball: b };
    }
    if (s.ball && sampleTrail)
      s = {
        ...s,
        ball: {
          ...s.ball,
          trail: [
            ...s.ball.trail,
            { x: s.ball.x, y: s.ball.y, t: s.simTime },
          ].filter((p) => p.t >= s.simTime - C.TRAIL_TIME),
        },
      };
    if (s.obstacleClockRunning) s = withClock(s, s.obstacleClock + dt);
    if (e.paddle) api.audio.play(C.CUES.paddleHit);
    if (e.wall) api.audio.play(C.CUES.wallBounce);
    if (e.obstacle) api.audio.play(C.CUES.obstacleBounce);
    if (e.score) api.audio.play(C.CUES.score);
    return s;
  },
  render(s, api) {
    draw(s, api);
  },
};

function draw(s: DeepReadonly<CaromState>, api: RenderApi): void {
  const c = api.ctx;
  c.fillStyle = BACKGROUND;
  c.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
  c.strokeStyle = "#1b3446";
  c.lineWidth = 2;
  c.strokeRect(27, 27, C.FIELD_W - 54, C.FIELD_H - 54);
  c.setLineDash([8, 16]);
  c.beginPath();
  c.moveTo(C.NET_X, 36);
  c.lineTo(C.NET_X, C.FIELD_H - 36);
  c.strokeStyle = "#294355";
  c.stroke();
  c.setLineDash([]);
  for (const o of s.obstacles) {
    c.save();
    c.translate(o.cx, o.cy);
    c.rotate(o.theta);
    c.shadowColor = "#ffb65c";
    c.shadowBlur = 25;
    c.fillStyle = "#f6a94d";
    c.beginPath();
    c.roundRect(-C.OBSTACLE_HW, -C.OBSTACLE_HH, C.OBSTACLE_W, C.OBSTACLE_H, 8);
    c.fill();
    c.restore();
  }
  for (const [side, p] of [
    ["left", s.paddles.left],
    ["right", s.paddles.right],
  ] as const) {
    c.fillStyle = side === "left" ? "#54dfec" : "#f783bd";
    c.shadowColor = c.fillStyle;
    c.shadowBlur = 22;
    c.beginPath();
    c.roundRect(
      side === "left" ? C.P1_X0 : C.P2_X0,
      p.cy - C.PADDLE_HALF,
      C.PADDLE_W,
      C.PADDLE_H,
      8,
    );
    c.fill();
  }
  c.shadowBlur = 0;
  if (s.ball) {
    const b = s.ball;
    for (let i = 0; i < b.trail.length; i++) {
      const p = b.trail[i];
      c.globalAlpha = ((i + 1) / b.trail.length) * 0.5;
      c.fillStyle = "#fff0cd";
      c.beginPath();
      c.arc(
        p.x,
        p.y,
        C.BALL_R * (0.2 + (0.6 * (i + 1)) / b.trail.length),
        0,
        Math.PI * 2,
      );
      c.fill();
    }
    c.globalAlpha = 1;
    c.shadowColor = "#ffe8a9";
    c.shadowBlur = 28;
    c.fillStyle = "#fff4d5";
    c.beginPath();
    c.arc(b.x, b.y, C.BALL_R, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;
  }
  c.textAlign = "center";
  c.fillStyle = "#d8eaf2";
  c.font = "600 20px system-ui";
  if (s.screen !== "title" && s.screen !== "howto") {
    c.fillText(
      s.mode === "solo" ? "SOLO / FIRST TO 11" : "VERSUS / FIRST TO 11",
      C.FIELD_CX,
      61,
    );
    c.font = "700 64px system-ui";
    c.fillStyle = "#54dfec";
    c.fillText(String(s.score.p1), C.FIELD_CX - 92, 116);
    c.fillStyle = "#f783bd";
    c.fillText(String(s.score.p2), C.FIELD_CX + 92, 116);
  }
  if (s.screen === "countdown" && s.ball) {
    c.fillStyle = "#dbeaf2";
    c.font = "700 54px system-ui";
    c.fillText(
      String(Math.max(1, Math.ceil(s.ball.holdTimer))),
      C.FIELD_CX,
      293,
    );
  }
  if (s.screen === "playing" || s.screen === "countdown") return;
  c.fillStyle = "rgba(8,15,26,.83)";
  c.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
  c.fillStyle = "#fff4db";
  c.font = "800 94px system-ui";
  if (s.screen === "title") {
    c.fillText(C.TITLE_TEXT, C.FIELD_CX, 250);
    c.font = "24px system-ui";
    c.fillStyle = "#8aa8ba";
    c.fillText("CURVE THE SHOT. OWN THE ANGLE.", C.FIELD_CX, 302);
  }
  if (s.screen === "howto") {
    c.font = "700 54px system-ui";
    c.fillText("HOW TO PLAY", C.FIELD_CX, 139);
    c.font = "22px system-ui";
    c.fillStyle = "#c0d7e3";
    for (const [i, line] of [
      "W / S  ·  LEFT PADDLE",
      "↑ / ↓  ·  RIGHT PADDLE",
      "MOVE AS YOU STRIKE TO BEND THE BALL",
      "BANK SHOTS OFF THE SWAYING OBSTACLES",
      "FIRST TO 11 · WIN BY TWO",
      "P OR ESC  ·  PAUSE     M  ·  MUTE",
    ].entries())
      c.fillText(line, C.FIELD_CX, 218 + i * 52);
  }
  if (s.screen === "paused") {
    c.font = "800 73px system-ui";
    c.fillText("PAUSED", C.FIELD_CX, 265);
  }
  if (s.screen === "matchover") {
    c.font = "800 64px system-ui";
    c.fillText(
      s.winner === "left" ? "LEFT SIDE WINS" : "RIGHT SIDE WINS",
      C.FIELD_CX,
      246,
    );
    c.font = "30px system-ui";
    c.fillStyle = "#b6ccdb";
    c.fillText(
      String(s.score.p1) + " — " + String(s.score.p2),
      C.FIELD_CX,
      306,
    );
  }
  menuItems(s).forEach((item, i) => {
    const r = menuRect(s, i);
    if (!r) return;
    const selected = i === s.menuIndex;
    c.fillStyle = selected ? "#f6b75e" : "#132b3b";
    c.beginPath();
    c.roundRect(r.x, r.y, r.w, r.h, 10);
    c.fill();
    c.fillStyle = selected ? BACKGROUND : "#cfdee7";
    c.font = "700 21px system-ui";
    c.fillText(item, C.FIELD_CX, r.y + 35);
  });
}
