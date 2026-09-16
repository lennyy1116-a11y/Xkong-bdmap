import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.inline.js',import.meta.url),'utf8');
const allocation=source.slice(source.indexOf('async function allocateCanonicalInstitutionId('),source.indexOf('function runRevisionedMutation('));
function setup() {
 let value=0, lock=Promise.resolve(); const occupied=new Set(['MED08000006']);
 const context={compactInstitutionCodePrefix:()=> 'MED08',maxBaseInstitutionSerial:()=>4,normalizeCanonicalInstitutionId:x=>x,
 institutionCodeCountersCollection:{doc:()=>({kind:'doc',id:'counter'})},
 placesCollection:{where(){return this},async get(){return {forEach:f=>f({id:'MED08000005'})}},doc:id=>({kind:'doc',id})},
 db:{runTransaction(fn){const task=lock.then(()=>fn({async get(ref){assert.equal(ref.kind,'doc','Web transactions only accept DocumentReference');return ref.id==='counter'?{exists:true,data:()=>({value})}:{exists:occupied.has(ref.id)}},set(ref,data){value=data.value}}));lock=task.catch(()=>{});return task}}};
 vm.createContext(context);vm.runInContext(allocation,context);return context;
}
test('new institution allocation uses Web-compatible document reads and skips occupied IDs',async()=>{
 const c=setup();assert.equal(await c.allocateCanonicalInstitutionId({primary_l2_code:'MED-08'}),'MED08000007');
});
test('serialized transaction retries preserve distinct IDs for concurrent allocations',async()=>{
 const c=setup();const ids=await Promise.all(Array.from({length:8},()=>c.allocateCanonicalInstitutionId({primary_l2_code:'MED-08'})));assert.equal(new Set(ids).size,8);
});
test('allocation is within save error handling and loading lock',()=>{
 const save=source.slice(source.indexOf('async function savePlace('),source.indexOf('function getDataSafety('));
 assert.ok(save.indexOf('try {')<save.indexOf('await allocateCanonicalInstitutionId'));
 assert.ok(save.indexOf('btn.disabled = true')<save.indexOf('await allocateCanonicalInstitutionId'));
 assert.match(save,/if \(btn && btn.disabled\) return/);
});
