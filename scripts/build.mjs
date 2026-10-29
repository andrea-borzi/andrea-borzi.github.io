import {readFile,writeFile,mkdir,cp,readdir,rm} from 'node:fs/promises';
import {cardHTML,escapeHTML as e,disciplines} from '../assets/catalog.mjs';
import {loadCatalog,thumbFor} from './catalog-data.mjs';
const {archives,...data}=await loadCatalog();
// Catalogo unico letto dal browser: progetti a mano, canali e video da data/videos.txt.
await writeFile('data/catalog.json',JSON.stringify(data)+'\n');
const channels=data.projects.filter(p=>p.act==='channel');
const channelVideoTotal=channels.reduce((sum,p)=>sum+p.videoCount,0);
const dateLabel=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'short',year:'numeric'}).format(date):'';};
const channelURL=p=>p.handle?`https://www.youtube.com/${p.handle}`:`https://www.youtube.com/channel/${p.channelId}`;
let index=(await readFile('index.html','utf8')).replace(/\r\n/g,'\n');
const cards=data.projects.filter(p=>p.featured).map(p=>cardHTML(p)).join('\n');
index=index.replace(/<div id="featured" class="project-grid">[\s\S]*?<\/div><noscript>/,`<div id="featured" class="project-grid">${cards}</div><noscript>`);
const channelCards=channels.map(p=>`<article class="case-card"><span class="eyebrow">CANALE YOUTUBE / ${p.lang==='en'?'IN INGLESE':'IN ITALIANO'}</span><h3>${e(p.title)}</h3><p>${e(p.description)}</p><dl><dt>Il mio contributo</dt><dd>${e(p.role)}</dd><dt>Esplora</dt><dd>${p.videoCount?`${p.videoCount} video, aggiornati ogni giorno.`:'Archivio in aggiornamento.'}</dd></dl><a class="text-link" href="projects/${e(p.slug)}.html">Tutti i video <span>↗</span></a></article>`).join('');
const urbanCard='<article class="case-card"><span class="eyebrow">CONTENUTI SOCIAL / INSTAGRAM</span><h3>Urban Heroes</h3><p>Racconti brevi, costruiti per lo schermo verticale. Testo, montaggio e movimento si incontrano nel formato social.</p><dl><dt>Il mio contributo</dt><dd>Testi · Montaggio · Motion graphics · Color · Animazioni</dd><dt>Esplora</dt><dd>Una selezione di 29 contenuti della collaborazione.</dd></dl><a class="text-link" href="projects/urban-heroes.html">Dentro il progetto <span>↗</span></a></article>';
index=index.replace(/<div class="case-grid">[\s\S]*?<\/article><\/div>/,`<div class="case-grid">${channelCards}${urbanCard}</div>`);
index=index.replace(/(<section class="collab section" id="approach">[\s\S]*?<\/h2><\/div><p>)[^<]*(<\/p>)/,'$1I canali YouTube che monto, aggiornati in automatico, e i contenuti social di Urban Heroes.$2');
index=index.replace(/<strong id="video-count">[^<]*<\/strong><span>[^<]*<\/span>/,`<strong id="video-count">${channelVideoTotal}</strong><span>Video montati per i canali YouTube</span>`);
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
  const context=p.act==='channel'?p.description:p.arg==='urbanheroes'?'Una selezione di contenuti social. Puoi scegliere uno dei 29 post oppure aprirlo direttamente su Instagram.':p.title==='Zodiac'?'Un progetto personale dedicato all’atmosfera di una sequenza di apertura. Tipografia, movimento e 3D sono gli elementi del linguaggio visivo.':p.act==='single'&&p.meta.includes('AR')?'Questa scheda presenta una tavola del progetto AR. L’immagine documenta il lavoro; non avvia un’esperienza di realtà aumentata.':p.act==='photo'?'Una serie fotografica da esplorare immagine per immagine. La galleria permette di scegliere lo scatto e passare al successivo.':p.act==='link'?'Un progetto interattivo da esplorare nel suo ambiente originale. Il collegamento apre una nuova scheda.':p.description;
  const page=`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(p.title)} — Andrea Borzì</title><meta name="description" content="${e(context)}"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:title" content="${e(p.title)} — Andrea Borzì"><meta property="og:description" content="${e(context)}"><meta property="og:image" content="${e(image)}"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="../favicon.png"><link rel="stylesheet" href="../assets/fonts.css"><link rel="stylesheet" href="../assets/site.css"><script src="../assets/site.js" type="module"></script></head><body><header class="nav"><a class="brand" href="../index.html">AB<span class="brand-dot">*</span><span class="brand-name">ANDREA BORZÌ<br><small>VISUAL ARTIST</small></span></a><nav aria-label="Menu principale"><a href="../index.html#work">Tutti i lavori</a><a class="nav-contact" href="../index.html#contact">Parliamone ↗</a></nav></header><main class="project-page wrap"><span class="eyebrow">${e(disciplines[p.disc])} / ${e(p.kind)}</span><h1>${e(p.title)}</h1><p class="intro">${e(context)}</p>${p.thumb==='social-preview.png'?'':`<div class="project-still${p.arg==='urbanheroes'?' urban-still':''}"><img src="${e(src)}" alt="${e(p.title)}" width="${p.thumbWidth||1280}" height="${p.thumbHeight||720}" style="max-width:${p.thumbWidth||1280}px"></div>`}<dl>${p.role?`<dt>Il mio contributo</dt><dd>${e(p.role)}</dd>`:''}<dt>Linguaggio</dt><dd>${e(p.meta)}</dd></dl><div class="actions"><button class="button" data-open="${e(p.slug)}">${p.act==='photo'?'Esplora la serie':p.act==='single'?'Guarda l’immagine':p.act==='link'?'Apri il progetto':'Guarda i contenuti'} ↗</button>${direct?`<a class="button outline" href="${e(direct)}" target="_blank" rel="noopener">${p.act==='channel'?'Apri il canale':'Apri direttamente'} ↗</a>`:''}</div>${p.act==='channel'?await channelGrid(p):''}<noscript><p>Per aprire la galleria attiva JavaScript. I collegamenti diretti rimangono disponibili.</p></noscript><div class="archive-bar"><p>Hai un progetto in mente?</p><a class="text-link" href="mailto:borzi.andrea98@gmail.com?subject=${encodeURIComponent('Un progetto con Andrea — '+p.title)}">Parliamone ↗</a></div></main><footer class="wrap"><a href="../index.html#work">← Torna ai lavori</a><span>ANDREA BORZÌ · VISUAL ARTIST</span></footer>${dialog}</body></html>`;
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
for(const item of ['index.html','en','privacy.html','assets','data','img','projects','favicon.png','robots.txt','sitemap.xml','social-preview.png']){
  await cp(item,`_site/${item}`,{recursive:true});
}
await writeFile('_site/.nojekyll','');
