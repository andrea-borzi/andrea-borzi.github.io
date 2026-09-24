import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {translateHTML} from '../assets/i18n.mjs';
import {sections} from './privacy-content.mjs';
const base='https://andrea-borzi.github.io/';
const data=JSON.parse(await readFile('data/portfolio.json','utf8'));
function enhance(html,path,english=false){
 const project=path.startsWith('projects/'),prefix=english?(project?'../../':'../'):(project?'../':'');
 const home=english?(project?'../index.html':'index.html'):(project?'../index.html':'index.html');
 const it=english?prefix+path:(project?'../':'')+path;
 const en=english?(project?'../':'')+path:prefix+'en/'+path;
 html=html.replace(/<div class="language-switch"[\s\S]*?<\/div>/g,'').replace(/<div class="legal-links"[\s\S]*?<\/div>/g,'');
 html=html.replace('</nav>',`<div class="language-switch" aria-label="${english?'Language':'Lingua'}"><a data-language href="${it}" lang="it" hreflang="it" ${!english?'aria-current="page"':''}>ITA</a><span aria-hidden="true">/</span><a data-language href="${en}" lang="en" hreflang="en" ${english?'aria-current="page"':''}>ENG</a></div></nav>`);
 html=html.replace('</footer>',`<div class="legal-links"><a href="${project?'../':''}privacy.html">${english?'Privacy & cookies':'Privacy e cookie'}</a><button type="button" data-revoke>${english?'Disable external content':'Disattiva contenuti esterni'}</button><span id="privacy-status" role="status"></span></div></footer>`);
 html=html.replace(/<link rel="alternate"[^>]+>/g,'');
 const clean=path==='index.html'?'':path;
 html=html.replace('</head>',`<link rel="alternate" hreflang="it" href="${base+clean}"><link rel="alternate" hreflang="en" href="${base+'en/'+clean}"><link rel="alternate" hreflang="x-default" href="${base+clean}"></head>`);
 return html;
}
for(const path of ['index.html',...data.projects.map(p=>`projects/${p.slug}.html`)]){
 let it=await readFile(path,'utf8');it=enhance(it,path);await writeFile(path,it);
 let en=translateHTML(it).replace('<html lang="it">','<html lang="en">').replace('content="it_IT"','content="en_GB"');
 // Resolve local paths from the parallel /en/ directory, keeping project links within English.
 en=en.replace(/((?:href|src)=")([^"#]+)(")/g,(all,a,v,b)=>{
  if(/^(https?:|mailto:|data:)/.test(v))return all;
  if(v.startsWith('../assets/')||v.startsWith('../img/')||v==='../favicon.png')return a+'../'+v+b;
  if(/^(assets\/|img\/|favicon.png)/.test(v))return a+'../'+v+b;
  return all;
 });
 en=en.replace(/(rel="canonical" href="|property="og:url" content=")https:\/\/andrea-borzi.github.io\//g,'$1'+base+'en/');
 en=en.replaceAll('Un%20progetto%20con%20Andrea','A%20project%20with%20Andrea');
 en=enhance(en,path,true);await mkdir('en/projects',{recursive:true});await writeFile('en/'+path,en);
}
for(const english of [false,true]){
 const prefix=english?'../':'';
 let html=`<!doctype html><html lang="${english?'en':'it'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Privacy & cookies — Andrea Borzì</title><link rel="canonical" href="${base}${english?'en/':''}privacy.html"><link rel="stylesheet" href="${prefix}assets/fonts.css"><link rel="stylesheet" href="${prefix}assets/site.css"><script type="module" src="${prefix}assets/site.js"></script></head><body><header class="nav"><a class="brand" href="index.html">AB<span class="brand-dot">*</span></a><nav aria-label="${english?'Main navigation':'Menu principale'}"><a href="index.html">Portfolio</a></nav></header><main class="legal-page wrap"><h1>Privacy & cookies</h1><p>${english?'Last updated: 24 September 2026. Information under GDPR Article 13.':'Aggiornamento: 24 settembre 2026. Informativa ai sensi dell’art. 13 GDPR.'}</p>${sections.map(s=>`<section><h2>${s[english?1:0]}</h2><p>${s[english?3:2]}</p></section>`).join('')}</main><footer class="wrap"><span>ANDREA BORZÌ · VISUAL ARTIST</span></footer></body></html>`;
 html=enhance(html,'privacy.html',english);await writeFile((english?'en/':'')+'privacy.html',html);
}
const paths=['', 'privacy.html',...data.projects.map(p=>`projects/${p.slug}.html`)];
await writeFile('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.flatMap(p=>[p,'en/'+p]).map(p=>`<url><loc>${base+p}</loc></url>`).join('')}</urlset>`);
console.log('English pages, language links and privacy notices generated.');
