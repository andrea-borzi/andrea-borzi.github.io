export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const disciplines = {motion:'Film & Motion', dimension:'3D & AR', systems:'Interattività', light:'Fotografia'};
export function cardHTML(p, prefix = '') {
  const e=escapeHTML, src=p.thumb.startsWith('http')?p.thumb:prefix+p.thumb;
  return `<article class="project-card reveal"><a class="project-image${p.arg==='urbanheroes'?' urban':p.thumbWidth<800?' compact':''}" href="${prefix}projects/${e(p.slug)}.html" data-open="${e(p.slug)}" aria-label="Esplora ${e(p.title)}"><img src="${e(src)}" alt="${e(p.title)}" loading="lazy" width="960" height="600"></a><div class="project-caption"><h3><a href="${prefix}projects/${e(p.slug)}.html">${e(p.title)}</a></h3><p class="project-kind"><span>${e(p.kind)}</span><span>${e(disciplines[p.disc])}</span></p></div>${p.role?`<p class="project-role">${e(p.role)}</p>`:''}</article>`;
}
