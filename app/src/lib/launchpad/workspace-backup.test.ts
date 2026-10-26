import {test} from 'node:test';
import assert from 'node:assert/strict';
import {backup,restore,validate,KEYS} from './workspace-backup.ts';
function store(){const m=new Map<string,string>();return {m,getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);},removeItem:(k:string)=>{m.delete(k);}};}
test('supported data round trips without touching secrets or transactions',()=>{const s=store();s.setItem('secret','private');s.setItem('launch:transactions:v1','pending');const b=backup(s);assert.ok(!JSON.stringify(b).includes('private'));restore(s,b);assert.equal(s.getItem('secret'),'private');assert.equal(s.getItem('launch:transactions:v1'),'pending');assert.deepEqual(backup(s),b);});
test('invalid and oversized input fails closed',()=>{assert.throws(()=>validate('x'.repeat(400001)));const b=backup(store());assert.throws(()=>validate(JSON.stringify({...b,data:{...b.data,projects:[null]}})));assert.throws(()=>validate(JSON.stringify({...b,data:{...b.data,views:[{name:'bad',url:'javascript:alert(1)'}]}})));});
test('partial write failure rolls back previous data',()=>{const s=store();s.setItem(KEYS.views,'[]');const original=[...s.m.entries()];let n=0;assert.throws(()=>restore({...s,setItem:(k,v)=>{if(++n===3)throw Error();s.setItem(k,v);}},backup(store())));assert.deepEqual([...s.m.entries()],original);});
