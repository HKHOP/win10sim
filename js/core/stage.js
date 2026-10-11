import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from '../global/constants.js';

// Keeps the emulated monitor at exactly 1366x768 internal pixels.
// Win10 shells render on a fixed monitor grid, so we never resize the stage
// itself — on smaller viewports (e.g. phones) we scale it down to fit,
// and we never scale up (avoids blurry upscaling on large monitors).

export function computeStageScale(viewportWidth, viewportHeight) {
  const scale = Math.min(viewportWidth / DISPLAY_WIDTH, viewportHeight / DISPLAY_HEIGHT);
  return Math.min(1, scale);
}

export function fitStage(stage) {
  const scale = computeStageScale(window.innerWidth, window.innerHeight);
  stage.style.transform = 'scale(' + scale + ')';
}

export function watchStage(stage) {
  fitStage(stage);
  window.addEventListener('resize', function () { fitStage(stage); });
  window.addEventListener('orientationchange', function () { fitStage(stage); });
}
