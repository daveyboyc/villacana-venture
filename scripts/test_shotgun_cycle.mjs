import assert from 'node:assert/strict';
import {ShotgunCycle,SHOTGUN_CAPACITY} from '../src/shotgun-cycle.ts';
const gun=new ShotgunCycle();
assert.equal(gun.reload(),false,'A full load cannot reload');
for(let n=0;n<SHOTGUN_CAPACITY;n++){
  assert.equal(gun.fire(),'fire');
  assert.equal(gun.fire(),'blocked','Pump blocks double-fire');
  assert.equal(gun.reload(),false,'Cannot reload during pump');
  assert.deepEqual(gun.advance(.23),[]);
  assert.deepEqual(gun.advance(.02),['pump']);
  assert.deepEqual(gun.advance(.56),[]);
  assert.equal(gun.ammo,SHOTGUN_CAPACITY-n-1);
}
assert.equal(gun.fire(),'empty');assert.equal(gun.fire(),'empty');assert.equal(gun.ammo,0);
assert.equal(gun.reload(),true);assert.equal(gun.reload(),false);
assert.equal(gun.fire(),'blocked','Cannot interrupt an empty reload before a shell is inserted');
gun.advance(.39);assert.equal(gun.ammo,0);gun.advance(.02);assert.equal(gun.phase,'loading');
assert.deepEqual(gun.advance(.55),['reload-shell']);assert.equal(gun.ammo,1);
assert.equal(gun.fire(),'fire','Loaded shell can interrupt reload');gun.advance(20);assert.equal(gun.ammo,0,'Interrupted reload cannot add delayed shells');
gun.reload();gun.advance(1);assert.equal(gun.ammo,1);gun.cancelReload();gun.advance(20);assert.equal(gun.ammo,1,'Pause retains inserted shells and cancels remaining work');
gun.reload();const cues=gun.advance(20);assert.equal(gun.ammo,8);assert.equal(gun.phase,'ready');assert.equal(cues.filter(c=>c==='reload-shell').length,7);assert.equal(cues.at(-1),'reload-close');
assert.equal(gun.reload(),false);gun.fire();gun.reset();assert.equal(gun.ammo,8);assert.equal(gun.phase,'ready');assert.deepEqual(gun.advance(10),[]);
assert.deepEqual(gun.advance(NaN),[]);assert.deepEqual(gun.advance(-1),[]);
console.log('Shotgun cycle: ammo, pump, empty-fire, reload timing, interruption, cancellation and reset PASS');
