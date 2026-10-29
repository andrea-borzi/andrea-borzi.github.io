export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const disciplines = {motion:'Film & Motion', dimension:'3D & AR', systems:'Interattività', light:'Fotografia'};
// Una riga dell’indice dei lavori: titolo, contesto, disciplina e ruolo, come nei crediti.
export function rowHTML(p, prefix = '') {
  const e=escapeHTML, src=p.thumb.startsWith('http')?p.thumb:prefix+p.thumb;
  return `<li class="work-row" data-disc="${e(p.disc)}"><a href="${prefix}projects/${e(p.slug)}.html" data-open="${e(p.slug)}" data-thumb="${e(src)}"><span class="work-thumb"><img src="${e(src)}" alt="" loading="lazy" width="320" height="200"></span><span class="work-title">${e(p.title)}${p.kind!=='Progetto selezionato'?` <span class="work-kind">${e(p.kind)}</span>`:''}</span><span class="work-disc">${e(disciplines[p.disc])}</span><span class="work-role">${e(p.role||p.meta)}</span></a></li>`;
}
