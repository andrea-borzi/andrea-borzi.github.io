import {translateDOM} from './i18n.mjs';
import {escapeHTML as e} from './catalog.mjs';

document.documentElement.classList.add('js');
const root = new URL('../', import.meta.url);
const relative = path => new URL(path, root).href;
const dialog = document.querySelector('#project-dialog');
const body = document.querySelector('#dialog-body');
let data, lastFocus;
const archives={};
let items=[], activeIndex=0, mediaType='video', activeProject;
const english=document.documentElement.lang==='en';
const locale=english?'en-GB':'it-IT';
const format = new Intl.NumberFormat(locale);
const observer=new MutationObserver(()=>translateDOM(document.body));
observer.observe(document.body,{childList:true,subtree:true});
translateDOM(document.body);
let mediaConsent=false;
const projectURL=slug=>relative(`${english?'en/':''}projects/${slug}.html`);
document.querySelectorAll('[data-language]').forEach(link=>link.addEventListener('click',()=>{const url=new URL(link.href);url.hash=location.hash;link.href=url.href;}));
document.querySelector('[data-revoke]')?.addEventListener('click',()=>{mediaConsent=false;if(dialog?.open)dialog.close();document.querySelector('#privacy-status').textContent=english?'Embedded content disabled.':'Contenuti incorporati disattivati.';});
function animateCount(el,value){
  const total=BigInt(value);el.textContent=format.format(total);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||total>BigInt(Number.MAX_SAFE_INTEGER))return;
  const observer=new IntersectionObserver(entries=>{if(!entries.some(entry=>entry.isIntersecting))return;observer.disconnect();const start=performance.now();const tick=now=>{const progress=Math.min((now-start)/1000,1);el.textContent=format.format(Math.round(Number(total)*(1-(1-progress)**3)));if(progress<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);},{threshold:.5});observer.observe(el);
}
const track = (name, detail={}) => document.dispatchEvent(new CustomEvent('portfolio:interaction',{detail:{name,...detail}}));
async function json(path){const response=await fetch(relative(path));if(!response.ok)throw new Error(`Risorsa non disponibile: ${path}`);return response.json();}

function imageFallback(img){img.addEventListener('error',()=>{if(img.src.includes('maxresdefault'))img.src=img.src.replace('maxresdefault','hqdefault');},{once:true});}
document.querySelectorAll('img').forEach(imageFallback);
document.querySelector('#year')?.replaceChildren(String(new Date().getFullYear()));

function showDialog(title,meta){
  mediaConsent=false;lastFocus=document.activeElement;
  document.querySelector('#dialog-title').textContent=title;
  document.querySelector('#dialog-meta').textContent=meta || '';
  body.replaceChildren();
  dialog.showModal();document.body.style.overflow='hidden';
  document.querySelector('#dialog-close').focus();
}
document.querySelector('#dialog-close')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('close',()=>{body.replaceChildren();document.body.style.overflow='';lastFocus?.focus();});
dialog?.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});

function renderMedia(){
  const media=document.querySelector('#media');
  const item=items[activeIndex];if(!media||!item)return;
  media.replaceChildren();
  if(mediaType==='photo'){
    const img=new Image();img.alt=`${activeProject.title} — ${english?'photograph':'fotografia'} ${activeIndex+1}`;img.src=relative(item.id);img.addEventListener('error',()=>{if(media.contains(img))media.textContent='Immagine non disponibile. Puoi continuare con la successiva.';},{once:true});media.append(img);
    if(items[activeIndex+1]){const next=new Image();next.src=relative(items[activeIndex+1].id);}
  } else if(mediaType==='instagram'&&!mediaConsent) {
    const provider=mediaType==='instagram'?'Instagram (Meta)':'YouTube (Google)';
    const panel=document.createElement('div');panel.className='consent-panel';
    const heading=document.createElement('h3');heading.textContent=english?'Play external content':'Riproduci un contenuto esterno';
    const text=document.createElement('p');text.textContent=english?`By enabling ${provider}, your IP address and browser information are sent to the provider, which may use cookies for measurement and profiling. Optional: you can use the external link below instead. Your choice applies only while this gallery is open.`:`Attivando ${provider}, il tuo indirizzo IP e le informazioni del browser vengono trasmessi al fornitore, che può usare cookie per misurazione e profilazione. È facoltativo: puoi usare il link esterno qui sotto. La scelta vale solo finché questa galleria resta aperta.`;
    const privacy=document.createElement('a');privacy.href=relative(`${english?'en/':''}privacy.html`);privacy.target='_blank';privacy.rel='noopener';privacy.className='external-link';privacy.textContent=english?'Privacy and cookies':'Privacy e cookie';
    const accept=document.createElement('button');accept.className='button';accept.textContent=english?`Allow ${provider} and play`:`Consenti ${provider} e riproduci`;accept.onclick=()=>{mediaConsent=true;renderMedia();};
    const refuse=document.createElement('button');refuse.className='button outline';refuse.textContent=english?'Keep disabled':'Mantieni disattivato';refuse.onclick=()=>dialog.close();
    panel.append(heading,text,privacy,accept,refuse);media.append(panel);
  } else {
    const iframe=document.createElement('iframe');iframe.title=item.title||activeProject.title;iframe.allow='autoplay; encrypted-media; picture-in-picture';iframe.allowFullscreen=true;
    iframe.src=mediaType==='instagram'?`https://www.instagram.com/p/${encodeURIComponent(item.id)}/embed/captioned/`:`https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.id)}?autoplay=1&rel=0`;
    media.append(iframe);
  }
  const select=document.querySelector('#gallery-select');if(select)select.value=String(activeIndex);
  const status=document.querySelector('#gallery-status');if(status)status.textContent=`${activeIndex+1} di ${items.length} · ${item.title||activeProject.title}`;
  const external=document.querySelector('#media-external');if(external){external.href=mediaType==='instagram'?`https://www.instagram.com/p/${item.id}/`:`https://www.youtube.com/watch?v=${item.id}`;}
}

async function channelItems(slug){
  archives[slug]??=json(`data/channels/${slug}.json`).catch(()=>{delete archives[slug];return [];});
  return (await archives[slug]).map(v=>({id:v.id,title:v.title}));
}

async function openProject(project,start=0){
  activeProject=project;activeIndex=0;items=[];
  showDialog(project.title,project.role||project.meta);
  track('project_open',{project:project.slug});
  if(project.act==='link'){
    body.innerHTML=`<p>${e(project.description)}</p><a class="button" href="${e(project.arg)}" target="_blank" rel="noopener">Apri l’esperienza ↗</a><p>Il progetto si apre in una nuova scheda.</p>`;return;
  }
  mediaType=project.act==='shorts'?'instagram':['photo','single'].includes(project.act)?'photo':'video';
  items=project.act==='channel'?await channelItems(project.arg):project.act==='photo'?(data.photos[project.arg]||[]).map((id,i)=>({id,title:`${project.title} · ${i+1}`})):project.act==='shorts'?(data.instagram[project.arg]||[]).map((id,i)=>({id,title:`Contenuto ${i+1}`})):[{id:project.arg,title:project.title}];
  if(activeProject!==project||!dialog.open)return;
  if(!items.length){body.innerHTML='<p>La galleria non è disponibile in questo momento. Riprova più tardi.</p>';return;}
  activeIndex=Math.min(Math.max(start,0),items.length-1);
  body.innerHTML=`<div class="media ${mediaType==='instagram'?'instagram':mediaType==='photo'?'photo':''}" id="media"></div>${items.length>1?`<div class="gallery-controls"><button id="previous" aria-label="Precedente">←</button><select id="gallery-select" aria-label="Scegli un contenuto">${items.map((item,i)=>`<option value="${i}">${i+1}. ${e(item.title||`Video ${item.id}`)}</option>`).join('')}</select><button id="next" aria-label="Successivo">→</button></div><p id="gallery-status" role="status"></p>`:''}<p>${e(project.description||'')}</p><div class="detail-links">${mediaType!=='photo'?'<a id="media-external" class="external-link" target="_blank" rel="noopener">'+(mediaType==='instagram'?'Apri su Instagram':'Apri su YouTube')+' ↗</a>':''}${project.slug?`<a class="external-link" href="${projectURL(project.slug)}">Scheda del progetto ↗</a>`:''}</div>`;
  document.querySelector('#previous')?.addEventListener('click',()=>step(-1));
  document.querySelector('#next')?.addEventListener('click',()=>step(1));
  document.querySelector('#gallery-select')?.addEventListener('change',event=>{activeIndex=Number(event.target.value);renderMedia();});
  renderMedia();
}
function step(n){activeIndex=(activeIndex+n+items.length)%items.length;renderMedia();}
dialog?.addEventListener('keydown',event=>{if(items.length>1&&!['SELECT','INPUT','TEXTAREA'].includes(event.target.tagName)){if(event.key==='ArrowLeft'){event.preventDefault();step(-1);}if(event.key==='ArrowRight'){event.preventDefault();step(1);}}});

// Indice dei lavori: filtri, prime dodici righe e anteprima che segue il puntatore.
const workIndex=document.querySelector('#work-index');
const workToggle=document.querySelector('#work-toggle');
const FIRST=12;
let workFilter='all',workOpen=false;
function renderWork(){
  if(!workIndex)return;
  const rows=[...workIndex.children],matching=rows.filter(row=>workFilter==='all'||row.dataset.disc===workFilter);
  const limit=workFilter==='all'&&!workOpen?FIRST:Infinity;
  rows.forEach(row=>{row.hidden=!matching.includes(row)||matching.indexOf(row)>=limit;});
  document.querySelector('#work-count').textContent=`${matching.length} ${matching.length===1?'lavoro':'lavori'}`;
  if(workToggle){workToggle.hidden=matching.length<=limit&&!workOpen||workFilter!=='all';workToggle.setAttribute('aria-expanded',String(workOpen));workToggle.textContent=workOpen?'Mostra meno lavori':`Mostra tutti i ${matching.length} lavori`;}
}
workToggle?.addEventListener('click',()=>{workOpen=!workOpen;renderWork();if(!workOpen)document.querySelector('#lavori').scrollIntoView();track('archive_open');});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  workFilter=button.dataset.filter;renderWork();
}));
renderWork();
const preview=document.querySelector('#work-preview');
if(preview&&workIndex&&matchMedia('(hover: hover) and (pointer: fine)').matches){
  const img=preview.querySelector('img');let x=0,y=0,px=0,py=0,frame;
  const move=()=>{px+=(x-px)*.18;py+=(y-py)*.18;preview.style.transform=`translate3d(${px}px,${py}px,0)`;frame=Math.abs(x-px)+Math.abs(y-py)>.5?requestAnimationFrame(move):null;};
  workIndex.addEventListener('pointermove',event=>{x=event.clientX+24;y=event.clientY-preview.offsetHeight/2;if(!preview.classList.contains('is-on')){px=x;py=y;}frame??=requestAnimationFrame(move);});
  workIndex.addEventListener('pointerover',event=>{const link=event.target.closest('a[data-thumb]');if(!link)return;if(!img.src.endsWith(link.dataset.thumb))img.src=link.dataset.thumb;preview.classList.add('is-on');});
  workIndex.addEventListener('pointerleave',()=>preview.classList.remove('is-on'));
}

// Apertura: i fotogrammi dei lavori si alternano a taglio netto, come in una timeline.
const cut=document.querySelector('#cut');
if(cut){
  const frames=[...cut.querySelectorAll('img')],title=document.querySelector('#cut-title'),time=document.querySelector('#cut-time'),pause=document.querySelector('#cut-pause');
  const still=matchMedia('(prefers-reduced-motion: reduce)');
  let current=0,timer,start=performance.now(),running=!still.matches;
  const pad=n=>String(n).padStart(2,'0');
  const show=i=>{frames[current].classList.remove('is-on');current=i;frames[i].classList.add('is-on');frames[i].loading='eager';title.textContent=frames[i].dataset.title;};
  const tick=()=>{if(!running)return;const f=Math.floor((performance.now()-start)/40);time.textContent=`00:${pad(Math.floor(f/1500)%60)}:${pad(Math.floor(f/25)%60)}:${pad(f%25)}`;requestAnimationFrame(tick);};
  const next=()=>{show((current+1)%frames.length);timer=setTimeout(next,[1400,700,900,1100,600,1000][current%6]);};
  const play=()=>{running=true;pause.setAttribute('aria-pressed','false');pause.textContent='Ferma le immagini';timer=setTimeout(next,1200);requestAnimationFrame(tick);};
  const stop=()=>{running=false;clearTimeout(timer);pause.setAttribute('aria-pressed','true');pause.textContent='Riprendi le immagini';};
  pause.addEventListener('click',()=>running?stop():play());
  frames.slice(1).forEach(img=>{img.loading='eager';});
  if(running)play();else stop();
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){clearTimeout(timer);}else if(!document.hidden&&running){clearTimeout(timer);timer=setTimeout(next,900);}});
}

document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-open]');
  if(trigger&&data&&dialog){if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const p=data.projects.find(p=>p.slug===trigger.dataset.open);if(p){event.preventDefault();openProject(p,Number(trigger.dataset.index)||0);}}
  const contact=event.target.closest('a[href^="mailto:"],a[href*="api.whatsapp.com"]');if(contact)track('contact_click',{channel:contact.href.startsWith('mailto:')?'email':'whatsapp'});
});
document.querySelector('#reel-button')?.addEventListener('click',()=>{openProject({title:'Showreel',meta:'Andrea Borzì · Video editor e motion designer',arg:data?.showreel||'JqXCmlVath0',act:'video'});track('reel_open');});

async function loadViews(){
  try{
    const stats=await json('data/youtube-stats.json');
    if(!stats.updatedAt||!/^\d+$/.test(String(stats.totalViews))||stats.complete!==true)return;
    const el=document.querySelector('#view-count');if(!el)return;
    animateCount(el,stats.totalViews);
    const date=new Date(stats.updatedAt);if(!Number.isFinite(date.getTime()))return;
    document.querySelector('#views-date').textContent=`${stats.videoCount} video · ${english?'updated':'aggiornato'} ${new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(date)}${Date.now()-date.getTime()>3*86400000?(english?' · awaiting update':' · in attesa di aggiornamento'):''}`;
    el.title=english?'Total YouTube views, not unique website visitors.':'Somma delle visualizzazioni complessive su YouTube, non visitatori unici del sito.';
  }catch{/* Un dato non disponibile non viene presentato come zero. */}
}
// Entrate: ogni elemento sale una volta sola quando entra nello schermo.
const revealTargets=document.querySelectorAll('.section-head, .stats, .channel-row, .service, .process, .about-picture, .about-copy, .contact-intro, .brief, .project-cta');
revealTargets.forEach(el=>el.classList.add('reveal'));
const revealer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-in');revealer.unobserve(entry.target);}}),{rootMargin:'0px 0px -8% 0px'});
const watchReveal=()=>document.querySelectorAll('.reveal:not(.is-in)').forEach(el=>revealer.observe(el));
watchReveal();
new MutationObserver(watchReveal).observe(document.body,{childList:true,subtree:true});

// Il brief diventa un’email già compilata, aperta nel programma di posta del visitatore.
document.querySelector('#brief')?.addEventListener('submit',event=>{
  event.preventDefault();
  const form=new FormData(event.currentTarget),field=name=>String(form.get(name)||'').trim();
  const lines=english?[`Project: ${field('tipo')}`,`How many videos / how often: ${field('quantita')||'-'}`,`Deadline: ${field('scadenza')||'-'}`,'',field('messaggio'),'',field('nome')]:[`Progetto: ${field('tipo')}`,`Quanti video / cadenza: ${field('quantita')||'-'}`,`Scadenza: ${field('scadenza')||'-'}`,'',field('messaggio'),'',field('nome')];
  const subject=`${english?'Project enquiry':'Richiesta di preventivo'}: ${field('tipo')}`;
  track('contact_click',{channel:'brief'});
  location.href=`mailto:borzi.andrea98@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n').trim())}`;
});

const search=document.querySelector('#video-search');
search?.addEventListener('input',()=>{
  const query=search.value.trim().toLowerCase();let shown=0;
  document.querySelectorAll('.video-tile').forEach(tile=>{const match=!query||tile.dataset.title.includes(query);tile.hidden=!match;if(match)shown++;});
  document.querySelector('#video-search-status').textContent=shown?`${shown} video`:'Nessun video trovato.';
});
if(english)document.querySelectorAll('time[datetime]').forEach(time=>{const date=new Date(time.dateTime);if(Number.isFinite(date.getTime()))time.textContent=new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(date);});

const results=await Promise.allSettled([json('data/catalog.json')]);
if(results[0].status==='fulfilled'){
  data=results[0].value;
}else{document.querySelector('.load-message')?.replaceChildren('I progetti sono momentaneamente non disponibili. Puoi visitarli sul canale YouTube.');}
const videoCount=document.querySelector('#video-count');
if(videoCount&&data)videoCount.textContent=data.projects.filter(p=>p.act==='channel').reduce((sum,p)=>sum+p.videoCount,0);
const channelCount=document.querySelector('#channel-count');
if(channelCount&&data)channelCount.textContent=data.projects.filter(p=>p.act==='channel').length;
await loadViews();
