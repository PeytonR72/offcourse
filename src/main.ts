import { Application, Graphics } from 'pixi.js';
import './style.css';

async function main() {
  const host = document.querySelector<HTMLDivElement>('#canvas');
  const button = document.querySelector<HTMLButtonElement>('#change-color');
  if (!host || !button) throw new Error('Canvas container or button is missing.');

  const app = new Application();
  await app.init({
    resizeTo: host,
    background: '#172337',
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
  });
  host.appendChild(app.canvas);

  const colors = [0x67e8f9, 0xa3e635, 0xfbbf24, 0xfb7185];
  let colorIndex = 0;
  const shape = new Graphics();
  const draw = () => shape.clear().roundRect(-55, -55, 110, 110, 18).fill(colors[colorIndex]);
  const changeColor = () => {
    colorIndex = (colorIndex + 1) % colors.length;
    draw();
  };
  draw();
  shape.eventMode = 'static';
  shape.cursor = 'pointer';
  shape.on('pointertap', changeColor);
  button.addEventListener('click', changeColor);
  app.stage.addChild(shape);

  const center = () => shape.position.set(app.screen.width / 2, app.screen.height / 2);
  center();
  app.renderer.on('resize', center);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  app.ticker.add((ticker) => {
    if (!reducedMotion.matches) shape.rotation += 0.01 * ticker.deltaTime;
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      button.removeEventListener('click', changeColor);
      app.destroy(true, { children: true });
    });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  const status = document.querySelector('#status');
  if (status) status.textContent = 'Could not start PixiJS. Check the browser console for details.';
});
