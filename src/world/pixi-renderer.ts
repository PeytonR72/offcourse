import {
  Application,
  Container,
  Graphics,
  ImageSource,
  Rectangle,
  Sprite,
  Texture,
} from "pixi.js";
import type { SceneRenderer } from "./mount-scene";
import { flightFrame, trajectoryGeometry } from "./flight-frame";
import { rocketFrames, rocketTokens, type RocketFrameKey } from "./rocket-art";
import { loadRocketSheet, rocketAppearance } from "./rocket-sprites";
import { createUniverse, universeOffsets, type Universe } from "./universe";

const WIDTH = 640;
const HEIGHT = 256;

export async function createPixiRenderer(): Promise<SceneRenderer> {
  const app = new Application();
  let source: ImageSource | undefined;
  const textures = {} as Record<RocketFrameKey, Texture>;
  const releaseArt = () => {
    Object.values(textures).forEach((texture) => texture.destroy(false));
    source?.destroy();
  };
  try {
    const sheet = await loadRocketSheet(async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      return image;
    });
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
    const sky = world.addChild(new Graphics());
    const far = world.addChild(new Graphics());
    const near = world.addChild(new Graphics());
    const debris = world.addChild(new Graphics());
    let paintedUniverse: Universe | undefined;
    const defaultUniverse = createUniverse("offcourse", 0);
    const trajectory = world.addChild(new Graphics());
    const destination = world.addChild(new Graphics());
    const sparks = world.addChild(new Graphics());
    source = new ImageSource({
      resource: sheet.resource,
      scaleMode: "nearest",
    });
    for (const key of Object.keys(rocketFrames) as RocketFrameKey[]) {
      const { x, y, width, height } = rocketFrames[key];
      textures[key] = new Texture({
        source,
        frame: new Rectangle(x, y, width, height),
      });
    }
    const rocket = world.addChild(new Container());
    const exhaust = rocket.addChild(new Sprite(textures["thrust-0"]));
    const body = rocket.addChild(new Sprite(textures.idle));
    exhaust.anchor.set(0.5);
    body.anchor.set(0.5);
    const canvas = app.canvas;
    canvas.dataset.rocketArt = sheet.mode;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";

    return {
      canvas,
      render(state, width, height) {
        if (app.screen.width !== width || app.screen.height !== height)
          app.renderer.resize(width, height);
        world.scale.set(width / WIDTH, height / HEIGHT);
        const { endY, targetY } = trajectoryGeometry(state);
        const frame = flightFrame(state);
        const universe = state.universe ?? defaultUniverse;
        const { region } = universe;
        if (paintedUniverse !== universe) {
          paintedUniverse = universe;
          sky.clear().rect(0, 0, WIDTH, HEIGHT).fill(region.sky);
          sky
            .ellipse(340, 8, 300, 38)
            .fill({ color: region.haze, alpha: 0.35 });
          far.clear();
          near.clear();
          debris.clear();
          for (const star of universe.stars) {
            for (const repeat of [0, WIDTH]) {
              (star.layer === 0 ? far : near)
                .rect(star.x + repeat, star.y, star.radius, star.radius)
                .fill({
                  color: region.accent,
                  alpha: star.layer === 0 ? 0.3 : 0.65,
                });
            }
          }
          for (const planet of universe.planets) {
            const { x, y, radius } = planet;
            if (planet.kind === "ringed")
              near
                .ellipse(x, y, radius * 1.7, radius * 0.4)
                .stroke({ color: region.accent, width: 1 });
            near.circle(x, y, radius).fill(region.planet);
            if (planet.kind === "cratered")
              near
                .circle(x - 2, y - 2, radius * 0.35)
                .fill({ color: region.sky, alpha: 0.6 });
            if (planet.kind === "striped")
              near
                .moveTo(x - radius * 0.8, y)
                .lineTo(x + radius * 0.8, y)
                .stroke({ color: region.accent, width: 2 });
          }
          for (const item of universe.debris)
            debris
              .rect(item.x, item.y, item.radius * 2, item.radius)
              .fill({ color: region.planet, alpha: 0.7 });
        }
        const offsets = universeOffsets(frame.x - 86);
        far.x = offsets.far;
        near.x = offsets.near;
        debris.x = offsets.debris;
        const appearance = rocketAppearance(state);
        body.texture = textures[appearance.expression];
        exhaust.visible = appearance.thruster !== null;
        if (appearance.thruster)
          exhaust.texture = textures[appearance.thruster];
        exhaust.scale.set(frame.flame || 1, 1);
        sparks.clear();
        for (const spark of frame.particles)
          sparks
            .circle(spark.x, spark.y, spark.radius)
            .fill({ color: 0xf5c879, alpha: spark.alpha });
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
          .stroke({ color: region.accent, width: 2 });
        destination.circle(532, targetY, 23).fill(region.planet);
        destination
          .circle(525, targetY - 7, 7)
          .fill({ color: region.accent, alpha: 0.6 });
        destination
          .circle(540, targetY + 8, 5)
          .fill({ color: region.sky, alpha: 0.5 });
        if (state.outcome === "perfect")
          destination
            .circle(504, targetY, 25)
            .stroke({ color: 0xf5c879, width: 2 });
        rocket.position.set(frame.x, frame.y);
        rocket.rotation = frame.rotation;
        rocket.scale.set(
          frame.scaleX * rocketTokens.scale,
          frame.scaleY * rocketTokens.scale
        );
        rocket.alpha = frame.alpha;
        app.render();
      },
      destroy() {
        app.destroy({ removeView: true }, { children: true, context: true });
        releaseArt();
      },
    };
  } catch (error) {
    // init() may reject before a renderer exists, when Application.destroy is unsafe.
    if (app.renderer) app.destroy({ removeView: true }, { children: true });
    else app.stage.destroy({ children: true });
    releaseArt();
    throw error;
  }
}
