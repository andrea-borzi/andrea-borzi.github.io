import test from 'node:test';
import assert from 'node:assert/strict';
import {collectStatistics,portfolioVideoIds} from './sync-views.mjs';
const id='ABCDEFGHIJK',other='12345678901';
test('showreel, video e serie sono deduplicati; Instagram escluso',()=>{
  assert.deepEqual(portfolioVideoIds({showreel:id,projects:[{act:'video',arg:id},{act:'shorts',arg:'instagram'},{act:'videogallery',arg:'tuttomotori'}]},[{id}, {id:other}]),[other,id]);
  assert.deepEqual(portfolioVideoIds({showreel:id,projects:[]},[{id:other}]),[id]);
});
test('somma intera esatta anche oltre la precisione dei numeri JS',async()=>{
  const out=await collectStatistics([id,other],'test',async()=>({ok:true,json:async()=>({items:[{id,statistics:{viewCount:'9007199254740993'}},{id:other,statistics:{viewCount:'7'}}]})}));
  assert.equal(out.totalViews,'9007199254741000');assert.equal(out.videoCount,2);assert.equal(out.complete,true);
});
test('risposta parziale non produce un totale falso',async()=>{
  await assert.rejects(collectStatistics([id,other],'test',async()=>({ok:true,json:async()=>({items:[{id,statistics:{viewCount:'12'}}]})})),/non restituiti/);
});
test('errori API e dati invalidi impediscono la pubblicazione',async()=>{
  await assert.rejects(collectStatistics([id],'test',async()=>({ok:false,status:403})),/HTTP 403/);
  await assert.rejects(collectStatistics([id],'test',async()=>({ok:true,json:async()=>({items:[{id,statistics:{viewCount:'NaN'}}]})})),/non valide/);
});
test('richieste suddivise in gruppi da 50 senza esporre la chiave',async()=>{
  const ids=Array.from({length:84},(_,i)=>String(i).padStart(11,'0'));let calls=0;
  const out=await collectStatistics(ids,'test',async(url)=>{calls++;const requested=url.searchParams.get('id').split(',');assert.ok(requested.length<=50);return{ok:true,json:async()=>({items:requested.map(id=>({id,statistics:{viewCount:'2'}}))})};});
  assert.equal(calls,2);assert.equal(out.totalViews,'168');
  await assert.rejects(collectStatistics([id],'secret',async()=>{throw new Error('URL con secret');}),error=>!error.message.includes('secret'));
});
