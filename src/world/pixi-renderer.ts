import { Application, Container, Graphics, Sprite } from "pixi.js";
import type { SceneRenderer } from "./mount-scene";

const WIDTH = 640;
const HEIGHT = 256;

/** A small original code-drawn placeholder; expression sprite sheets belong to T10. */
function drawRocket() {
  const pixels = [
    "        rr          ",
    "      rrrr          ",
    "    cccccccccc      ",
    "  ccccccccccccc     ",
    "ttccccccbbbcccccc   ",
    "hhcccccbdddbcccccc  ",
    "ttcccccbdddbccccccc ",
    "hhccccccbbbccccccc  ",
    "ttccccccccccccccc   ",
    "  ccccccccccccc     ",
    "    cccccccccc      ",
    "      rrrr          ",
    "        rr          ",
  ];
  const colors: Record<string, number> = {
    r: 0xeb8d7a,
    c: 0xf8efd9,
    b: 0x57b9ca,
    d: 0x193b50,
    h: 0xf5c879,
    t: 0xe9a360,
  };
  const graphic = new Graphics();
  pixels.forEach((row, y) => {
    [...row].forEach((pixel, x) => {
      if (colors[pixel]) graphic.rect(x * 2, y * 2, 2, 2).fill(colors[pixel]);
    });
  });
  return graphic;
}

export async function createPixiRenderer(): Promise<SceneRenderer> {
  const app = new Application();
  try {
    await app.init({
      width: WIDTH,
      height: HEIGHT,
      preference: ["webgl"],
      background: 0x0d1928,
      antialias: false,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoStart: false,
      sharedTicker: false,
      eventFeatures: {
        move: false,
        globalMove: false,
        click: false,
        wheel: false,
      },
    });
    const world = new Container();
    app.stage.addChild(world);
    const stars = new Graphics();
    for (let i = 0; i < 64; i++) {
      const x = (i * 197 + 29) % WIDTH;
      const y = (i * 89 + 17) % HEIGHT;
      const size = i % 7 === 0 ? 2 : 1;
      stars
        .rect(x, y, size, size)
        .fill({ color: 0xc4d1dd, alpha: i % 3 === 0 ? 0.7 : 0.3 });
    }
    world.addChild(stars);
    const trajectory = world.addChild(new Graphics());
    const destination = world.addChild(new Graphics());
    const drawing = drawRocket();
    const texture = app.renderer.generateTexture({
      target: drawing,
      resolution: 1,
    });
    texture.source.scaleMode = "nearest";
    drawing.destroy();
    const rocket = world.addChild(new Sprite(texture));
    rocket.anchor.set(0.5);
    const canvas = app.canvas;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";

    return {
      canvas,
      render(state, width, height) {
        if (app.screen.width !== width || app.screen.height !== height)
          app.renderer.resize(width, height);
        world.scale.set(width / WIDTH, height / HEIGHT);
        const endY = 128 - state.predictionOffset * 78;
        const targetY =
          state.targetOffset === null ? 128 : 128 - state.targetOffset * 78;
        trajectory.clear();
        trajectory
          .moveTo(86, 166)
          .quadraticCurveTo(310, 48, 532, endY)
          .stroke({ color: 0xf5c879, width: 2, alpha: 0.85 });
        trajectory.circle(532, endY, 5).stroke({ color: 0xf5c879, width: 2 });
        if (state.targetOffset !== null) {
          trajectory
            .moveTo(86, 166)
            .quadraticCurveTo(310, 48, 532, targetY)
            .stroke({ color: 0x7bdeea, width: 1, alpha: 0.75 });
        }
        destination.clear();
        // Neutral destination before reveal: no accuracy-dependent hints.
        destination
          .ellipse(532, targetY, 40, 13)
          .stroke({ color: 0x546b83, width: 2 });
        destination.circle(532, targetY, 23).fill(0x294557);
        destination.circle(525, targetY - 7, 7).fill(0x3d6170);
        destination.circle(540, targetY + 8, 5).fill(0x20394e);
        const revealed = state.targetOffset !== null;
        rocket.position.set(revealed ? 504 : 86, revealed ? endY : 166);
        rocket.rotation = revealed
          ? state.outcome === "miss"
            ? 0.45
            : 0
          : -0.25 - state.predictionOffset * 0.08;
        app.render();
      },
      destroy() {
        app.destroy(
          { removeView: true },
          { children: true, texture: true, textureSource: true, context: true }
        );
      },
    };
  } catch (error) {
    // init() may reject before a renderer exists, when Application.destroy is unsafe.
    if (app.renderer) app.destroy({ removeView: true }, { children: true });
    else app.stage.destroy({ children: true });
    throw error;
  }
}
