import { expect, test, vi } from "vitest";
import { mountScene, type SceneRenderer } from "./mount-scene";
import type { SceneState } from "./scene-state";

const initial: SceneState = {
  phase: "answering",
  predictionOffset: 0,
  targetOffset: null,
  outcome: null,
};

// GPU is an external seam: this adapter records frames and resource ownership.
function gpu() {
  const frames: SceneState[] = [];
  const canvas = document.createElement("canvas");
  let live = true;
  const renderer: SceneRenderer = {
    canvas,
    render: (state) => {
      if (!live) throw new Error("Renderer destroyed");
      frames.push(state);
    },
    destroy: () => {
      live = false;
      canvas.remove();
    },
  };
  return { renderer, frames, isLive: () => live };
}

test("mount renders the latest state without replacing the canvas and releases it on disposal", async () => {
  const host = document.createElement("div");
  const device = gpu();
  const scene = mountScene(
    host,
    initial,
    async () => device.renderer,
    () => {}
  );
  scene.update({ ...initial, phase: "aiming", predictionOffset: 1 });
  await vi.waitFor(() =>
    expect(host.querySelectorAll("canvas")).toHaveLength(1)
  );
  expect(device.frames.at(-1)?.predictionOffset).toBe(1);
  scene.update({ ...initial, phase: "aiming", predictionOffset: -1 });
  expect(device.frames.at(-1)?.predictionOffset).toBe(-1);
  expect(host.firstChild).toBe(device.renderer.canvas);
  scene.dispose();
  scene.dispose();
  expect(device.isLive()).toBe(false);
  expect(host.childElementCount).toBe(0);
});

test("a renderer that finishes after unmount is destroyed without attaching over the replacement", async () => {
  const host = document.createElement("div");
  const old = gpu();
  const replacement = gpu();
  let finish!: (renderer: SceneRenderer) => void;
  const loading = new Promise<SceneRenderer>((resolve) => {
    finish = resolve;
  });
  const first = mountScene(
    host,
    initial,
    () => loading,
    () => {}
  );
  await Promise.resolve();
  first.dispose();
  const second = mountScene(
    host,
    initial,
    async () => replacement.renderer,
    () => {}
  );
  await vi.waitFor(() =>
    expect(host.firstChild).toBe(replacement.renderer.canvas)
  );
  finish(old.renderer);
  await vi.waitFor(() => expect(old.isLive()).toBe(false));
  expect(host.querySelectorAll("canvas")).toHaveLength(1);
  second.dispose();
  expect(replacement.isLive()).toBe(false);
});

test("Strict Mode effect replay cancels the discarded allocation", async () => {
  const host = document.createElement("div");
  const devices: ReturnType<typeof gpu>[] = [];
  const load = async () => {
    const device = gpu();
    devices.push(device);
    return device.renderer;
  };
  const first = mountScene(host, initial, load, () => {});
  first.dispose();
  const second = mountScene(host, initial, load, () => {});
  await vi.waitFor(() => expect(host.childElementCount).toBe(1));
  expect(devices).toHaveLength(1);
  second.dispose();
  expect(devices.every((device) => !device.isLive())).toBe(true);
});

test("initialization rejection reports an unavailable scene without a canvas", async () => {
  const host = document.createElement("div");
  let status = "loading";
  const scene = mountScene(
    host,
    initial,
    async () => {
      throw new Error("No GPU");
    },
    (next) => {
      status = next;
    }
  );
  await vi.waitFor(() => expect(status).toBe("unavailable"));
  expect(host.childElementCount).toBe(0);
  scene.dispose();
});

test("context loss removes the canvas and releases GPU resources", async () => {
  const host = document.createElement("div");
  const device = gpu();
  let status = "loading";
  const scene = mountScene(
    host,
    initial,
    async () => device.renderer,
    (next) => {
      status = next;
    }
  );
  await vi.waitFor(() => expect(status).toBe("ready"));
  device.renderer.canvas.dispatchEvent(new Event("webglcontextlost"));
  expect(status).toBe("unavailable");
  expect(host.childElementCount).toBe(0);
  expect(device.isLive()).toBe(false);
  scene.dispose();
});
