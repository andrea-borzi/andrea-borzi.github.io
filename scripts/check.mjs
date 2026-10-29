import {readFile,access,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {portfolioVideoIds} from './sync-views.mjs';
import {loadCatalog} from './catalog-data.mjs';
const {archives,...data}=await loadCatalog();
assert.equal(new Set(data.projects.map(p=>p.slug)).size,data.projects.length,'Slug duplicati');
assert.equal(data.projects.filter(p=>p.featured).length,6,'Selezione iniziale non coerente');
for(const p of data.projects){if(!p.thumb.startsWith('http'))await access(p.thumb);if(p.act==='single')await access(p.arg);await access(`projects/${p.slug}.html`);}
for(const p of data.projects.filter(p=>p.act==='channel'))assert.ok(Array.isArray(archives[p.slug]),`Archivio mancante: ${p.slug}`);
for(const images of Object.values(data.photos))for(const image of images)await access(image);
for(const file of ['index.html','privacy.html','en/index.html','en/privacy.html',...(await readdir('projects')).filter(f=>f.endsWith('.html')).flatMap(f=>['projects/'+f,'en/projects/'+f])]){
 const html=await readFile(file,'utf8');
 assert.ok(html.includes(`<html lang="${file.startsWith('en/')?'en':'it'}">`));assert.match(html,/<h1[ >]/);assert.match(html,/rel="canonical"/);
 assert.doesNotMatch(html,/(?:src|href)="https:\/\/(?:fonts\.googleapis|fonts\.gstatic|img\.youtube)/);
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,`ID duplicati in ${file}`);
 for(const m of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)){
  const url=m[1];if(/^(https?:|mailto:|data:)/.test(url))continue;
  await access(path.resolve(path.dirname(file),url.split('?')[0]));
 }
}
console.log(`Verificati ${data.projects.length} progetti, ${Object.values(data.photos).flat().length} foto, link locali e ${data.projects.filter(p=>p.act==='channel').length} canali e ${portfolioVideoIds(data,archives).length} ID YouTube unici.`);
