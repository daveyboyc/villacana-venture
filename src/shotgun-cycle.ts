/** Gameplay timing only. Audio playback never controls ammunition or firing. */
export const SHOTGUN_CAPACITY = 8;
export const SHOTGUN_COOLDOWN = .8;
export type ShotgunPhase = 'ready' | 'pump' | 'opening' | 'loading' | 'closing';
export type ShotgunCue = 'pump' | 'reload-open' | 'reload-shell' | 'reload-close';
export class ShotgunCycle {
  ammo = SHOTGUN_CAPACITY;
  phase: ShotgunPhase = 'ready';
  private elapsed = 0;
  private pumped = false;
  get reloading() { return this.phase === 'opening' || this.phase === 'loading' || this.phase === 'closing'; }
  get canReload() { return this.phase === 'ready' && this.ammo < SHOTGUN_CAPACITY; }
  fire(): 'fire' | 'empty' | 'blocked' {
    if (this.phase === 'pump') return 'blocked';
    if (this.ammo === 0) return this.reloading ? 'blocked' : 'empty';
    // Once a shell is inserted, firing can interrupt a reload.
    this.ammo--; this.phase = 'pump'; this.elapsed = 0; this.pumped = false;
    return 'fire';
  }
  reload(): boolean {
    if (!this.canReload) return false;
    this.phase = 'opening'; this.elapsed = 0;
    return true;
  }
  cancelReload() { if (this.reloading) { this.phase = 'ready'; this.elapsed = 0; } }
  reset() { this.ammo = SHOTGUN_CAPACITY; this.phase = 'ready'; this.elapsed = 0; this.pumped = false; }
  advance(seconds: number): ShotgunCue[] {
    if (!Number.isFinite(seconds) || seconds <= 0 || this.phase === 'ready') return [];
    const cues: ShotgunCue[] = [];
    this.elapsed += seconds;
    if (this.phase === 'pump') {
      if (!this.pumped && this.elapsed >= .24) { cues.push('pump'); this.pumped = true; }
      if (this.elapsed >= SHOTGUN_COOLDOWN) { this.phase = 'ready'; this.elapsed = 0; }
      return cues;
    }
    while (this.reloading) {
      const duration = this.phase === 'opening' ? .4 : this.phase === 'loading' ? .55 : .3;
      if (this.elapsed < duration) break;
      this.elapsed -= duration;
      if (this.phase === 'opening') this.phase = 'loading';
      else if (this.phase === 'loading') {
        this.ammo = Math.min(SHOTGUN_CAPACITY, this.ammo + 1); cues.push('reload-shell');
        if (this.ammo === SHOTGUN_CAPACITY) { this.phase = 'closing'; cues.push('reload-close'); }
      } else { this.phase = 'ready'; this.elapsed = 0; }
    }
    return cues;
  }
}
