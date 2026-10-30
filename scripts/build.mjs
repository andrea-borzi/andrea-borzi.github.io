import {readFile,writeFile,mkdir,cp,readdir,rm} from 'node:fs/promises';
import {rowHTML,escapeHTML as e,disciplines} from '../assets/catalog.mjs';
import {loadCatalog,thumbFor} from './catalog-data.mjs';
const {archives,...data}=await loadCatalog();
// Catalogo unico letto dal browser: progetti a mano, canali e video da data/videos.txt.
await writeFile('data/catalog.json',JSON.stringify(data)+'\n');
const channels=data.projects.filter(p=>p.act==='channel');
const channelVideoTotal=channels.reduce((sum,p)=>sum+p.videoCount,0);
const dateLabel=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'short',year:'numeric'}).format(date):'';};
const channelURL=p=>p.handle?`https://www.youtube.com/${p.handle}`:`https://www.youtube.com/channel/${p.channelId}`;
let index=(await readFile('index.html','utf8')).replace(/\r\n/g,'\n');
// Indice dei lavori: prima i sei in evidenza, poi il resto del catalogo (i canali hanno la loro sezione).
const works=[...data.projects.filter(p=>p.featured),...data.projects.filter(p=>!p.featured&&p.act!=='channel')];
index=index.replace(/<ol id="work-index" class="work-index">[\s\S]*?<\/ol>/,`<ol id="work-index" class="work-index">${works.map(p=>rowHTML(p)).join('')}</ol>`);
const channelRows=(await Promise.all(channels.map(async p=>{
  const latest=(archives[p.slug]||[]).slice(0,4);
  const thumbs=await Promise.all(latest.map(async(v,i)=>{const thumb=await thumbFor(v.id);return `<li><a href="https://www.youtube.com/watch?v=${e(v.id)}" data-open="${e(p.slug)}" data-index="${i}" target="_blank" rel="noopener"><span class="video-thumb">${thumb?`<img src="${thumb}" alt="" loading="lazy" width="320" height="180">`:''}</span><span class="video-title">${e(v.title||p.title)}</span></a></li>`;}));
  return `<article class="channel-row reveal"><div class="channel-info"><h3><a href="projects/${e(p.slug)}.html">${e(p.title)}</a></h3><p>${e(p.description)}</p><p class="channel-meta">${p.videoCount?`${p.videoCount} video`:'Archivio in aggiornamento.'} · ${p.lang==='en'?'In inglese':'In italiano'}</p><a class="text-link" href="projects/${e(p.slug)}.html">Tutti i video</a></div>${thumbs.length?`<ul class="channel-thumbs">${thumbs.join('')}</ul>`:'<p class="channel-empty">I video compaiono qui dopo il prossimo aggiornamento.</p>'}</article>`;
}))).join('');
index=index.replace(/<div id="channel-list">[\s\S]*?<\/div>\n<\/div><\/section>/,`<div id="channel-list">${channelRows}</div>\n</div></section>`);
const stats=await readFile('data/youtube-stats.json','utf8').then(JSON.parse).catch(()=>null);
if(stats?.complete===true&&/^\d+$/.test(String(stats.totalViews)))index=index.replace(/<dd id="view-count">[^<]*<\/dd>/,`<dd id="view-count">${new Intl.NumberFormat('it-IT').format(BigInt(stats.totalViews))}</dd>`);
index=index.replace(/<dd id="video-count">[^<]*<\/dd>/,`<dd id="video-count">${channelVideoTotal}</dd>`).replace(/<dd id="channel-count">[^<]*<\/dd>/,`<dd id="channel-count">${channels.length}</dd>`).replace(/<span id="project-count">[^<]*<\/span>/,`<span id="project-count">${works.length}</span>`);
await writeFile('index.html',index);
await mkdir('projects',{recursive:true});
const dialog=index.match(/<dialog[\s\S]*?<\/dialog>/)[0];
async function channelGrid(p){
  const videos=archives[p.slug]||[];
  const tiles=await Promise.all(videos.map(async(v,i)=>{const thumb=await thumbFor(v.id),title=v.title||p.title;return `<li class="video-tile" data-title="${e(title.toLowerCase())}"><a href="https://www.youtube.com/watch?v=${e(v.id)}" data-open="${e(p.slug)}" data-index="${i}" target="_blank" rel="noopener"><span class="video-thumb">${thumb?`<img src="../${thumb}" alt="" loading="lazy" width="320" height="180">`:''}</span><span class="video-title">${e(title)}</span>${v.published?`<time datetime="${e(v.published)}">${dateLabel(v.published)}</time>`:''}</a></li>`;}));
  return `<section class="channel-videos" aria-labelledby="videos-title"><div class="channel-head"><h2 id="videos-title">Tutti i video</h2>${videos.length?'<label class="channel-search"><span>Cerca nel canale</span><input type="search" id="video-search" autocomplete="off"></label>':''}</div><p id="video-search-status" class="load-message" role="status">${videos.length?`${videos.length} video`:'Archivio in aggiornamento.'}</p><ol class="video-grid">${tiles.join('')}</ol></section>`;
}
for(const p of data.projects){
  const url=`https://andrea-borzi.github.io/projects/${p.slug}.html`;
  const image=p.thumb.startsWith('http')?p.thumb:`https://andrea-borzi.github.io/${p.thumb}`;
  const src=p.thumb.startsWith('http')?p.thumb:'../'+p.thumb;
  let direct=p.act==='channel'?channelURL(p):p.act==='video'?`https://www.youtube.com/watch?v=${p.arg}`:p.act==='shorts'?`https://www.instagram.com/p/${data.instagram[p.arg][0]}/`:p.act==='link'?p.arg:p.act==='single'?'../'+p.arg:null;
  const context=p.act==='channel'?p.description:p.arg==='urbanheroes'?'Una selezione di contenuti social. Puoi scegliere uno dei 29 post oppure aprirlo direttamente su Instagram.':p.title==='Zodiac'?'Un progetto personale dedicato all’atmosfera di una sequenza di apertura. Tipografia, movimento e 3D sono gli elementi del linguaggio visivo.':p.act==='single'&&p.meta.includes('AR')?'Questa scheda presenta una tavola del progetto AR. L’immagine documenta il lavoro; non avvia un’esperienza di realtà aumentata.':p.act==='photo'&&p.description.startsWith('Photo Series')?'Una serie fotografica da esplorare immagine per immagine. La galleria permette di scegliere lo scatto e passare al successivo.':p.act==='link'?'Un progetto interattivo da esplorare nel suo ambiente originale. Il collegamento apre una nuova scheda.':p.description;
  const page=`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(p.title)} — Andrea Borzì</title><meta name="description" content="${e(context)}"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:title" content="${e(p.title)} — Andrea Borzì"><meta property="og:description" content="${e(context)}"><meta property="og:image" content="${e(image)}"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="../favicon.ico" sizes="32x32"><link rel="icon" href="../favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="../apple-touch-icon.png"><link rel="stylesheet" href="../assets/fonts.css"><link rel="stylesheet" href="../assets/site.css"><script src="../assets/site.js" type="module"></script></head><body><header class="nav"><a class="brand" href="../index.html">Andrea Borzì</a><nav aria-label="Menu principale"><a class="nav-link" href="../index.html#lavori">Lavori</a><a class="nav-cta" href="../index.html#contatto">Preventivo</a></nav></header><main class="project-page wrap"><p class="project-meta">${e(p.kind)} · ${e(disciplines[p.disc])}</p><h1>${e(p.title)}</h1><p class="intro">${e(context)}</p>${p.thumb==='social-preview.png'?'':`<div class="project-still${p.arg==='urbanheroes'?' urban-still':''}"><img src="${e(src)}" alt="${e(p.title)}" width="${p.thumbWidth||1280}" height="${p.thumbHeight||720}" style="max-width:${p.thumbWidth||1280}px"></div>`}<dl>${p.role?`<dt>Il mio contributo</dt><dd>${e(p.role)}</dd>`:''}<dt>Linguaggio</dt><dd>${e(p.meta)}</dd></dl><div class="actions"><button class="button" data-open="${e(p.slug)}">${p.act==='photo'?'Esplora la serie':p.act==='single'?'Guarda l’immagine':p.act==='link'?'Apri il progetto':'Guarda i contenuti'}</button>${direct?`<a class="button outline" href="${e(direct)}" target="_blank" rel="noopener">${p.act==='channel'?'Apri il canale':'Apri direttamente'}</a>`:''}</div>${p.act==='channel'?await channelGrid(p):''}<noscript><p>Per aprire la galleria attiva JavaScript. I collegamenti diretti rimangono disponibili.</p></noscript><div class="project-cta"><p>Hai un progetto simile in mente?</p><a class="button" href="mailto:borzi.andrea98@gmail.com?subject=${encodeURIComponent('Un progetto con Andrea — '+p.title)}">Scrivimi</a></div></main><footer class="footer-simple wrap"><a href="../index.html#lavori">Torna ai lavori</a><span>Andrea Borzì · Video editor e motion designer · Catania</span></footer>${dialog}</body></html>`;
  await writeFile(`projects/${p.slug}.html`,page);
}
// Pagine di progetti tolti dal catalogo (per esempio una riga cancellata da videos.txt).
const slugs=new Set(data.projects.map(p=>`${p.slug}.html`));
for(const dir of ['projects','en/projects'])for(const file of await readdir(dir).catch(()=>[]))if(file.endsWith('.html')&&!slugs.has(file))await rm(`${dir}/${file}`);
const urls=['https://andrea-borzi.github.io/',...data.projects.map(p=>`https://andrea-borzi.github.io/projects/${p.slug}.html`)];
await writeFile('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Generate ${data.projects.length} pagine progetto e ${data.projects.filter(p=>p.featured).length} schede statiche.`);
await import('./localize.mjs');
await rm('_site',{recursive:true,force:true});
await mkdir('_site',{recursive:true});
for(const item of ['index.html','en','privacy.html','assets','data','img','projects','favicon.png','favicon.ico','favicon.svg','apple-touch-icon.png','robots.txt','sitemap.xml','social-preview.png','og-image.jpg','og-image-en.jpg']){
  await cp(item,`_site/${item}`,{recursive:true});
}
await writeFile('_site/.nojekyll','');
