import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";
import { ConstantClock, createEngine } from "@clockwyrks/simple-2d";
import { game } from "./game";
import {
  BALL_R,
  FIELD_CX,
  FIELD_CY,
  HOLD_TIME,
  P1_X1,
  PADDLE_SPEED,
  SERVE_SPEED,
} from "./constants";

function setup(step = 10) {
  const target = new EventTarget();
  const engine = createEngine({
    canvas: createCanvas(1280, 720) as unknown as HTMLCanvasElement,
    width: 1280,
    height: 720,
    game,
    clock: new ConstantClock(step),
    surface: {
      cssWidth: () => 1280,
      cssHeight: () => 720,
      dpr: () => 1,
      events: () => target,
    },
  });
  return { engine, target };
}
function key(target: EventTarget, code: string, type: "keydown" | "keyup") {
  const event = new Event(type) as Event & { code: string; repeat: boolean };
  Object.defineProperties(event, {
    code: { value: code },
    repeat: { value: false },
  });
  target.dispatchEvent(event);
}
describe("Carom simulation", () => {
  it("initializes the full title state and serves after the hold", async () => {
    const { engine } = setup();
    await engine.initialize();
    const d = engine.debug;
    expect(d.snapshot(engine.state)).toMatchObject({
      screen: "title",
      score: { p1: 0, p2: 0 },
      obstacleClock: 0,
    });
    engine.apply((s) => d.setScreen(s, "countdown"));
    engine.apply((s) => d.setBallServeSign(s, 1));
    await engine.advance(100);
    expect(engine.state.screen).toBe("playing");
    expect(engine.state.ball?.held).toBe(false);
    expect(
      Math.hypot(engine.state.ball?.vx ?? 0, engine.state.ball?.vy ?? 0),
    ).toBeCloseTo(SERVE_SPEED);
    expect(engine.state.ball?.x).toBe(FIELD_CX);
    expect(engine.state.ball?.y).toBe(FIELD_CY);
    expect(engine.state.ball?.holdTimer).toBe(0);
    expect(engine.state.ball?.trail).toEqual([]);
    expect(engine.state.simTime).toBeCloseTo(HOLD_TIME);
    engine.destroy();
  });
  it("moves and clamps paddles, then freezes on pause", async () => {
    const { engine, target } = setup();
    await engine.initialize();
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    key(target, "KeyS", "keydown");
    await engine.advance(1);
    expect(engine.state.paddles.left.vy).toBe(PADDLE_SPEED);
    const y = engine.state.paddles.left.cy;
    key(target, "Escape", "keydown");
    await engine.advance(1);
    expect(engine.state.screen).toBe("paused");
    await engine.advance(10);
    expect(engine.state.paddles.left.cy).toBe(y);
    expect(engine.state.obstacleClock).toBeCloseTo(0.01);
    engine.destroy();
  });
  it("adds spin on a moving paddle face hit", async () => {
    const { engine } = setup();
    await engine.initialize();
    const d = engine.debug;
    engine.apply((s) => d.clearWorld(s));
    engine.apply((s) => d.spawnBall(s));
    engine.apply((s) => d.setScreen(s, "playing"));
    engine.apply((s) => d.setBallHeld(s, false));
    engine.apply((s) => d.setBallPosition(s, P1_X1 + BALL_R + 3, FIELD_CY));
    engine.apply((s) => d.setBallVelocity(s, -500, 0));
    engine.apply((s) => d.setPaddleDriven(s, "left", true));
    engine.apply((s) => d.setPaddleVy(s, "left", 200));
    await engine.advance(1);
    expect(engine.state.ball?.vx).toBeGreaterThan(0);
    expect(engine.state.ball?.spin).toBeCloseTo(170);
    expect(engine.state.paddles.left.vy).toBe(200);
    engine.destroy();
  });
  it("scores after a complete goal crossing and parks for the receiver", async () => {
    const { engine } = setup();
    await engine.initialize();
    const d = engine.debug;
    engine.apply((s) => d.clearWorld(s));
    engine.apply((s) => d.spawnBall(s));
    engine.apply((s) => d.setScreen(s, "playing"));
    engine.apply((s) => d.setBallHeld(s, false));
    engine.apply((s) => d.setBallPosition(s, 1270, 200));
    engine.apply((s) => d.setBallVelocity(s, 900, 0));
    await engine.advance(3);
    expect(engine.state.score.p1).toBe(1);
    expect(engine.state.screen).toBe("countdown");
    expect(engine.state.receiver).toBe("right");
    expect(engine.state.ball?.held).toBe(true);
    expect(engine.state.ball?.trail).toEqual([]);
    engine.destroy();
  });
  it("ends at eleven only with a two-point lead", async () => {
    const { engine } = setup();
    await engine.initialize();
    const d = engine.debug;
    engine.apply((s) => d.clearWorld(s));
    engine.apply((s) => d.spawnBall(s));
    engine.apply((s) => d.setScreen(s, "playing"));
    engine.apply((s) => d.setScore(s, 10, 10));
    engine.apply((s) => d.setBallHeld(s, false));
    engine.apply((s) => d.setBallPosition(s, 1270, 200));
    engine.apply((s) => d.setBallVelocity(s, 900, 0));
    await engine.advance(3);
    expect(engine.state.score).toEqual({ p1: 11, p2: 10 });
    expect(engine.state.screen).toBe("countdown");
    engine.apply((s) => d.setScreen(s, "playing"));
    engine.apply((s) => d.setBallHeld(s, false));
    engine.apply((s) => d.setBallPosition(s, 1270, 200));
    engine.apply((s) => d.setBallVelocity(s, 900, 0));
    await engine.advance(3);
    expect(engine.state.screen).toBe("matchover");
    expect(engine.state.winner).toBe("left");
    engine.destroy();
  });
  it("reflects from a rotated obstacle and keeps the clock pose coherent", async () => {
    const { engine } = setup();
    await engine.initialize();
    const d = engine.debug;
    engine.apply((s) => d.setScreen(s, "playing"));
    engine.apply((s) => d.setObstacleClock(s, 0.45));
    engine.apply((s) => d.setObstacleClockRunning(s, false));
    engine.apply((s) => d.setBallHeld(s, false));
    const obstacle = engine.state.obstacles[0];
    engine.apply((s) => d.setBallPosition(s, obstacle.cx - 24, obstacle.cy));
    engine.apply((s) => d.setBallVelocity(s, 600, 0));
    await engine.advance(2);
    expect(engine.state.ball?.vx).toBeLessThan(600);
    expect(engine.state.obstacleClock).toBe(0.45);
    expect(engine.state.obstacles[0]).toEqual(obstacle);
    engine.destroy();
  });
});
