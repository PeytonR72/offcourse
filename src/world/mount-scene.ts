import type { SceneState } from "./scene-state";

/** The GPU seam. Canvas ownership transfers only after initialization succeeds. */
export type SceneRenderer = {
  canvas: HTMLCanvasElement;
  render(state: SceneState, width: number, height: number): void;
  destroy(): void;
};
export type RendererLoader = () => Promise<SceneRenderer>;
export type SceneStatus = "loading" | "ready" | "unavailable";

export function mountScene(
  host: HTMLElement,
  initial: SceneState,
  loadRenderer: RendererLoader,
  onStatus: (status: SceneStatus) => void
) {
  let state = initial;
  let disposed = false;
  let renderer: SceneRenderer | undefined;
  let observer: ResizeObserver | undefined;

  const release = () => {
    observer?.disconnect();
    if (renderer) {
      const owned = renderer;
      renderer = undefined;
      owned.canvas.removeEventListener("webglcontextlost", unavailable);
      owned.canvas.remove();
      owned.destroy();
    }
  };
  const unavailable = () => {
    if (disposed) return;
    release();
    onStatus("unavailable");
  };
  const paint = () => {
    try {
      renderer?.render(
        state,
        host.clientWidth || 640,
        host.clientHeight || 256
      );
    } catch {
      unavailable();
    }
  };

  // Strict Mode's discarded effect is canceled before it allocates a GPU context.
  void Promise.resolve()
    .then(async () => {
      if (disposed) return;
      const loaded = await loadRenderer();
      if (disposed) {
        loaded.destroy();
        return;
      }
      renderer = loaded;
      loaded.canvas.addEventListener("webglcontextlost", unavailable);
      host.append(loaded.canvas);
      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(paint);
        observer.observe(host);
      }
      paint();
      if (renderer) onStatus("ready");
    })
    .catch(unavailable);

  return {
    update(next: SceneState) {
      state = next;
      if (!disposed) paint();
    },
    dispose() {
      disposed = true;
      release();
    },
  };
}
