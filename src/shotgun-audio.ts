import { Howl, Howler } from 'howler';
import { asset } from './asset';
import type { ShotgunCue } from './shotgun-cycle';

/** Reuses Howler.js (MIT) and Freedoom WAVs (BSD-3-Clause); see public/audio/shotgun. */
export function createShotgunAudio(report: (state: 'loading' | 'ready' | 'error') => void) {
  type Cue = ShotgunCue | 'fire' | 'empty';
  let muted = false, disposed = false, loaded = 0, generation = 0;
  report('loading');
  const files: Record<Cue, string> = {
    fire:'fire', pump:'pump', 'reload-open':'reload-open', 'reload-shell':'reload-shell',
    'reload-close':'reload-close', empty:'reload-close',
  };
  const sounds = Object.fromEntries(Object.entries(files).map(([cue, file]) => [cue, new Howl({
    src:[asset(`/audio/shotgun/${file}.wav`)], preload:true,
    volume:cue === 'fire' ? .85 : cue === 'empty' ? .35 : .65,
    ...(cue === 'empty' ? {sprite:{click:[0,75]}} : {}),
    onload:()=>{ if (!disposed && ++loaded === Object.keys(files).length) report('ready'); },
    onloaderror:()=>{ if (!disposed) report('error'); },
  })])) as Record<Cue, Howl>;
  const stop = () => { generation++; Object.values(sounds).forEach(sound => sound.stop()); };
  return {
    unlock() {
      // Called from Start/Resume and touch controls; Howler also installs its mobile auto-unlock.
      if (!disposed && Howler.ctx?.state === 'suspended') void Howler.ctx.resume().catch(()=>{});
    },
    play(cue: Cue) {
      if (disposed || muted) return;
      const sound = sounds[cue];
      // Do not queue downloads. Resume an idle context, but cancel pending playback on stop/pause.
      if (sound.state() !== 'loaded') return;
      const requestedGeneration = generation;
      const play = () => {
        if (disposed || muted || generation !== requestedGeneration) return;
        sound.stop(); sound.play(cue === 'empty' ? 'click' : undefined);
      };
      if (Howler.usingWebAudio && Howler.ctx?.state === 'suspended') void Howler.ctx.resume().then(play).catch(()=>{});
      else play();
    },
    mute(value: boolean) { muted = value; if (value) stop(); Object.values(sounds).forEach(sound => sound.mute(value)); },
    stop,
    dispose() { disposed = true; stop(); Object.values(sounds).forEach(sound => sound.unload()); },
  };
}
