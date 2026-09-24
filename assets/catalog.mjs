export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const disciplines = {motion:'Film & Motion', dimension:'3D & AR', systems:'Interattività', light:'Fotografia'};
export function cardHTML(p, prefix = '') {
  const e=escapeHTML, src=p.thumb.startsWith('http')?p.thumb:prefix+p.thumb;
  return `<article class="project-card"><a class="project-image${p.arg==='urbanheroes'?' urban':''}" href="${prefix}projects/${e(p.slug)}.html" data-open="${e(p.slug)}" aria-label="Esplora ${e(p.title)}"><img src="${e(src)}" alt="${e(p.title)}" loading="lazy" width="960" height="600"><span class="tag">${e(p.kind)}</span><span class="arrow" aria-hidden="true">↗</span></a><div class="project-caption"><h3><a href="${prefix}projects/${e(p.slug)}.html">${e(p.title)}</a></h3><span>${e(disciplines[p.disc])}</span></div>${p.role?`<p class="project-role">${e(p.role)}</p>`:''}</article>`;
}
