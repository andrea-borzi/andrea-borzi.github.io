import {cardHTML, escapeHTML as e} from './catalog.mjs';

const root = new URL('../', import.meta.url);
const relative = path => new URL(path, root).href;
const dialog = document.querySelector('#project-dialog');
const body = document.querySelector('#dialog-body');
let data, videos=[], lastFocus;
let items=[], activeIndex=0, mediaType='video', activeProject;
const format = new Intl.NumberFormat('it-IT');
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
  lastFocus=document.activeElement;
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
    const img=new Image();img.alt=`${activeProject.title} — fotografia ${activeIndex+1}`;img.src=relative(item.id);img.addEventListener('error',()=>{if(media.contains(img))media.textContent='Immagine non disponibile. Puoi continuare con la successiva.';},{once:true});media.append(img);
    if(items[activeIndex+1]){const next=new Image();next.src=relative(items[activeIndex+1].id);}
  } else {
    const iframe=document.createElement('iframe');iframe.title=item.title||activeProject.title;iframe.allow='autoplay; encrypted-media; picture-in-picture';iframe.allowFullscreen=true;
    iframe.src=mediaType==='instagram'?`https://www.instagram.com/p/${encodeURIComponent(item.id)}/embed/captioned/`:`https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.id)}?autoplay=1&rel=0`;
    media.append(iframe);
  }
  const select=document.querySelector('#gallery-select');if(select)select.value=String(activeIndex);
  const status=document.querySelector('#gallery-status');if(status)status.textContent=`${activeIndex+1} di ${items.length} · ${item.title||activeProject.title}`;
  const external=document.querySelector('#media-external');if(external){external.href=mediaType==='instagram'?`https://www.instagram.com/p/${item.id}/`:`https://www.youtube.com/watch?v=${item.id}`;}
}

function openProject(project){
  activeProject=project;activeIndex=0;items=[];
  showDialog(project.title,project.role||project.meta);
  track('project_open',{project:project.slug});
  if(project.act==='link'){
    body.innerHTML=`<p>${e(project.description)}</p><a class="button" href="${e(project.arg)}" target="_blank" rel="noopener">Apri l’esperienza ↗</a><p>Il progetto si apre in una nuova scheda.</p>`;return;
  }
  mediaType=project.act==='shorts'?'instagram':['photo','single'].includes(project.act)?'photo':'video';
  items=project.act==='videogallery'?videos:project.act==='photo'?(data.photos[project.arg]||[]).map((id,i)=>({id,title:`${project.title} · ${i+1}`})):project.act==='shorts'?(data.instagram[project.arg]||[]).map((id,i)=>({id,title:`Contenuto ${i+1}`})):[{id:project.arg,title:project.title}];
  if(!items.length){body.innerHTML='<p>La galleria non è disponibile in questo momento. Riprova più tardi.</p>';return;}
  body.innerHTML=`<div class="media ${mediaType==='instagram'?'instagram':mediaType==='photo'?'photo':''}" id="media"></div>${items.length>1?`<div class="gallery-controls"><button id="previous" aria-label="Precedente">←</button><select id="gallery-select" aria-label="Scegli un contenuto">${items.map((item,i)=>`<option value="${i}">${i+1}. ${e(item.title||`Video ${item.id}`)}</option>`).join('')}</select><button id="next" aria-label="Successivo">→</button></div><p id="gallery-status" role="status"></p>`:''}<p>${e(project.description||'')}</p><div class="detail-links">${mediaType!=='photo'?'<a id="media-external" class="external-link" target="_blank" rel="noopener">'+(mediaType==='instagram'?'Apri su Instagram':'Apri su YouTube')+' ↗</a>':''}${project.slug?`<a class="external-link" href="${relative(`projects/${project.slug}.html`)}">Scheda del progetto ↗</a>`:''}</div>`;
  document.querySelector('#previous')?.addEventListener('click',()=>step(-1));
  document.querySelector('#next')?.addEventListener('click',()=>step(1));
  document.querySelector('#gallery-select')?.addEventListener('change',event=>{activeIndex=Number(event.target.value);renderMedia();});
  renderMedia();
}
function step(n){activeIndex=(activeIndex+n+items.length)%items.length;renderMedia();}
dialog?.addEventListener('keydown',event=>{if(items.length>1&&!['SELECT','INPUT','TEXTAREA'].includes(event.target.tagName)){if(event.key==='ArrowLeft'){event.preventDefault();step(-1);}if(event.key==='ArrowRight'){event.preventDefault();step(1);}}});

function renderArchive(filter='all'){
  const list=data.projects.filter(p=>filter==='all'||p.disc===filter);
  document.querySelector('#archive-grid').innerHTML=list.map(p=>cardHTML(p)).join('');
  document.querySelector('#archive-count').textContent=`${list.length} progetti`;
  document.querySelectorAll('#archive-grid img').forEach(imageFallback);
}
document.querySelector('#archive-toggle')?.addEventListener('click',event=>{
  const button=event.currentTarget,archive=document.querySelector('#archive'),open=button.getAttribute('aria-expanded')!=='true';
  button.setAttribute('aria-expanded',String(open));archive.hidden=!open;button.innerHTML=open?'Chiudi archivio <span>−</span>':'Esplora tutti i lavori <span>+</span>';
  if(open&&data){renderArchive(document.querySelector('[data-filter][aria-pressed="true"]')?.dataset.filter);track('archive_open');}
});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  if(data)renderArchive(button.dataset.filter);
}));

document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-open]');
  if(trigger&&data&&dialog){if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const p=data.projects.find(p=>p.slug===trigger.dataset.open);if(p){event.preventDefault();openProject(p);}}
  const contact=event.target.closest('a[href^="mailto:"],a[href*="api.whatsapp.com"]');if(contact)track('contact_click',{channel:contact.href.startsWith('mailto:')?'email':'whatsapp'});
});
document.querySelector('#reel-button')?.addEventListener('click',()=>{openProject({title:'Showreel',meta:'Andrea Borzì · Visual Artist',arg:data?.showreel||'JqXCmlVath0',act:'video'});track('reel_open');});

async function loadViews(){
  try{
    const stats=await json('data/youtube-stats.json');
    if(!stats.updatedAt||!/^\d+$/.test(String(stats.totalViews))||stats.complete!==true)return;
    const el=document.querySelector('#view-count');if(!el)return;
    animateCount(el,stats.totalViews);
    const date=new Date(stats.updatedAt);if(!Number.isFinite(date.getTime()))return;
    document.querySelector('#views-date').textContent=`${stats.videoCount} video · aggiornato ${new Intl.DateTimeFormat('it-IT',{dateStyle:'medium'}).format(date)}${Date.now()-date.getTime()>3*86400000?' · in attesa di aggiornamento':''}`;
    el.title='Somma delle visualizzazioni complessive su YouTube, non visitatori unici del sito.';
  }catch{/* Un dato non disponibile non viene presentato come zero. */}
}
const results=await Promise.allSettled([json('data/portfolio.json'),json('data/tuttomotori.json')]);
if(results[0].status==='fulfilled'){
  data=results[0].value;
  const count=document.querySelector('#project-count');if(count)count.textContent=data.projects.length;
  const featured=document.querySelector('#featured');if(featured){featured.innerHTML=data.projects.filter(p=>p.featured).map(p=>cardHTML(p)).join('');featured.querySelectorAll('img').forEach(imageFallback);}
}else{document.querySelector('.load-message')?.replaceChildren('I progetti sono momentaneamente non disponibili. Puoi visitarli sul canale YouTube.');}
if(results[1].status==='fulfilled'&&Array.isArray(results[1].value)){
  videos=results[1].value;const count=document.querySelector('#video-count');if(count)count.textContent=videos.length;
}
await loadViews();
