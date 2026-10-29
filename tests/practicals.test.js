import assert from 'node:assert/strict';
import {models,defaults,calculate,regression} from '../src/practicals/models.js';
import {requirements,coverage} from '../src/practicals/catalog.js';
import {diagram} from '../src/practicals/diagrams.js';
assert.equal(requirements.length,134);assert.equal(new Set(requirements.map(r=>r.id)).size,134);
for(const r of requirements)assert.notEqual(coverage(r),'Missing model',r.title);
let runs=0;
for(const m of Object.values(models)){
 const d=defaults(m.id),variants=[d];
 for(const c of m.controls)for(const v of c.options?c.options.map(o=>o[0]):[c.min,c.max])variants.push({...d,[c.id]:v});
 for(const p of variants){const r=calculate(m.id,p);assert.ok(r.length,m.id);for(const x of r){assert.ok(x.value!==undefined,m.id);if(typeof x.value==='number')assert.ok(Number.isFinite(x.value),m.id+' '+x.label);}const svg=diagram(m,p,r,true);assert.ok(!/NaN|undefined/.test(svg),m.id+' diagram');runs++;}
}
assert.equal(calculate('vernier',{size:12.3,zero:.1})[1].value,12.3);
const ps=[.3,.5,.8,1.2].map(length=>[length,calculate('pendulum-g',{length})[2].value]);assert.ok(Math.abs(4*Math.PI**2/regression(ps).slope-9.81)<1e-10);
assert.equal(regression([[1,2],[2,4],[3,6]]).slope,2);assert.equal(regression([[1,2],[1,3],[1,4]]),null);
console.log(`${Object.keys(models).length} activities, ${requirements.length} checklist entries, ${runs} default/boundary/option runs passed`);
