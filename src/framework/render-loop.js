/**
 * Chemia Framework - Render-On-Demand WebGL Loop Orchestrator
 * Drastically reduces CPU and GPU consumption by sleeping the RAF loop
 * when the scene is static, and automatically halts on hidden tab visibility.
 */

export class RenderLoop {
  constructor(renderFn) {
    this.renderFn = renderFn;
    this.isDirty = true;
    this.isRunning = false;
    this.isPaused = false;
    this.rafId = null;
    this.lastTime = 0;
    
    // Page visibility integration
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.requestRender();
      }
    });
  }

  requestRender() {
    this.isDirty = true;
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.tick.bind(this));
    }
  }

  setRunning(running) {
    this.isRunning = running;
    if (running) {
      this.requestRender();
    }
  }

  tick(time) {
    this.rafId = null;
    if (document.hidden) return;

    const dt = this.lastTime ? Math.min(0.1, (time - this.lastTime) / 1000) : 0.016;
    this.lastTime = time;

    // Execute render callback
    const shouldKeepAnimating = this.renderFn(time, dt, this.isRunning);

    // If simulation is running or scene requested animation, continue loop
    if (this.isRunning || shouldKeepAnimating || this.isDirty) {
      this.isDirty = false;
      this.rafId = requestAnimationFrame(this.tick.bind(this));
    }
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
