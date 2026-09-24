import {readFile, writeFile, rename} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export function portfolioVideoIds(portfolio, series){
  const includeSeries=portfolio.projects.some(p=>p.act==='videogallery'&&p.arg==='tuttomotori');
  const ids=[portfolio.showreel,...portfolio.projects.filter(p=>p.act==='video').map(p=>p.arg),...(includeSeries?series.map(v=>typeof v==='string'?v:v.id):[])];
  if(ids.some(id=>!/^[-_A-Za-z0-9]{11}$/.test(id)))throw new Error('ID video non valido nel portfolio.');
  return [...new Set(ids)].sort();
}

export async function collectStatistics(ids, apiKey, fetcher=fetch){
  const found=new Map();
  for(let i=0;i<ids.length;i+=50){
    const url=new URL('https://www.googleapis.com/youtube/v3/videos');
    url.search=new URLSearchParams({part:'statistics',id:ids.slice(i,i+50).join(','),key:apiKey,fields:'items(id,statistics/viewCount)'});
    // Non stampare mai URL o eccezioni di fetch: contengono la chiave API.
    let response;
    try{response=await fetcher(url,{signal:AbortSignal.timeout(30000)});}catch{throw new Error('Richiesta YouTube non riuscita. Snapshot precedente conservato.');}
    if(!response.ok)throw new Error(`YouTube ha risposto con HTTP ${response.status}. Snapshot precedente conservato.`);
    const payload=await response.json();
    if(!Array.isArray(payload.items))throw new Error('Risposta YouTube non valida.');
    for(const video of payload.items){
      if(!ids.includes(video.id)||found.has(video.id)||!/^\d+$/.test(video.statistics?.viewCount??''))throw new Error('Statistiche YouTube non valide o duplicate.');
      found.set(video.id,video.statistics.viewCount);
    }
  }
  const missing=ids.filter(id=>!found.has(id));
  if(missing.length)throw new Error(`${missing.length} video non restituiti da YouTube (${missing.join(', ')}). Verificare disponibilità e catalogo; snapshot precedente conservato.`);
  const videos=ids.map(id=>({id,views:found.get(id)}));
  return {updatedAt:new Date().toISOString(),totalViews:videos.reduce((sum,v)=>sum+BigInt(v.views),0n).toString(),videoCount:videos.length,complete:true,videos};
}

async function main(){
  const key=process.env.YOUTUBE_API_KEY;
  if(!key){console.log('::warning::YOUTUBE_API_KEY non configurata: sincronizzazione video attiva, contatore non aggiornato.');return;}
  const [portfolio,series]=await Promise.all(['data/portfolio.json','data/tuttomotori.json'].map(async path=>JSON.parse(await readFile(path,'utf8'))));
  const stats=await collectStatistics(portfolioVideoIds(portfolio,series),key);
  const out='data/youtube-stats.json';await writeFile(out+'.tmp',JSON.stringify(stats,null,2)+'\n');await rename(out+'.tmp',out);
  console.log(`Aggiornate le statistiche di ${stats.videoCount} video.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
