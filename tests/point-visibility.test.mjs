import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.inline.js',import.meta.url),'utf8');
test('point toggle hides/restores only point layer and persists across initialization',()=>{
 const start=source.indexOf('let allPointsHidden =');assert.ok(start>=0);
 const end=source.indexOf('function renderMalls()',start);
 const storage=new Map(), layers=new Set(['points','institutions','coverage']);
 const button={setAttribute(k,v){this[k]=v}};
 const c={localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{getElementById:()=>button},map:{removeLayer:l=>layers.delete(l),addLayer:l=>layers.add(l)},mallLayer:'points'};
 vm.createContext(c);vm.runInContext(source.slice(start,end),c);
 c.toggleAllPointsVisibility();assert.equal(layers.has('points'),false);assert.equal(layers.has('institutions'),true);assert.equal(layers.has('coverage'),true);assert.equal(button.textContent,'显示点位');
 c.syncPointLayerVisibility();assert.equal(layers.has('points'),false);
 c.toggleAllPointsVisibility();assert.equal(layers.has('points'),true);assert.equal(button.textContent,'隐藏点位');
 assert.equal(storage.get('bdmap_all_points_hidden'),'0');
});
