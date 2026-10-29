// Unisce le fonti modificate a mano (portfolio.json, channels.json, videos.txt)
// con i dati generati dalle sincronizzazioni, in un unico catalogo.
import {readFile, access} from 'node:fs/promises';

export const VIDEO_ID = /^[-_A-Za-z0-9]{11}$/;
export const CHANNEL_ID = /^UC[-_A-Za-z0-9]{22}$/;
export const categories = {video:'motion', motion:'motion', '3d':'dimension', ar:'dimension', web:'systems', interattivo:'systems', foto:'light'};

export function parseVideoId(value){
  const text = String(value ?? '').trim();
  if(VIDEO_ID.test(text)) return text;
  let url;
  try{url = new URL(text);}catch{return null;}
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id = null;
  if(host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
  else if(host === 'youtube.com' || host === 'youtube-nocookie.com') id = url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?]+)/)?.[1] || null;
  return id && VIDEO_ID.test(id) ? id : null;
}

// Una riga per video: link | categoria | ruolo | titolo. Righe vuote e commenti (#) ignorati.
export function parseVideoList(text){
  const entries = [], errors = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const raw = line.trim();
    if(!raw || raw.startsWith('#')) return;
    const [link, category = '', role = '', title = ''] = raw.split('|').map(part => part.trim());
    const id = parseVideoId(link), disc = categories[(category || 'video').toLowerCase()];
    if(!id) errors.push(`riga ${index + 1}: link YouTube non riconosciuto`);
    else if(!disc) errors.push(`riga ${index + 1}: categoria "${category}" sconosciuta (usa video, 3d, web o foto)`);
    else if(entries.some(entry => entry.id === id)) errors.push(`riga ${index + 1}: video già presente`);
    else entries.push({id, disc, role, title});
  });
  return {entries, errors};
}

export const slugify = text => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/, '');

export function channelVideos(channel, archive){
  const excluded = new Set(channel.exclude || []);
  return archive.filter(video => !excluded.has(video.id) && (!channel.since || !video.published || video.published >= channel.since));
}

export const exists = path => access(path).then(() => true, () => false);
export async function readJSON(path, fallback){
  try{return JSON.parse(await readFile(path, 'utf8'));}
  catch(error){if(error.code === 'ENOENT' && fallback !== undefined) return fallback; throw error;}
}
export async function thumbFor(id){
  if(await exists(`img/youtube/${id}.jpg`)) return `img/youtube/${id}.jpg`;
  if(await exists(`img/youtube/thumbs/${id}.jpg`)) return `img/youtube/thumbs/${id}.jpg`;
  return null;
}

export async function loadCatalog(){
  const portfolio = await readJSON('data/portfolio.json');
  const channels = await readJSON('data/channels.json');
  const metadata = await readJSON('data/videos.json', {});
  const {entries, errors} = parseVideoList(await readFile('data/videos.txt', 'utf8').catch(() => ''));
  if(errors.length) throw new Error(`data/videos.txt: ${errors.join('; ')}.`);

  const archives = {}, channelProjects = [];
  for(const channel of channels){
    if(!channel.slug || !channel.name || !CHANNEL_ID.test(channel.channelId)) throw new Error(`Canale non valido in data/channels.json: ${channel.slug || channel.name || '?'}`);
    const videos = channelVideos(channel, await readJSON(`data/channels/${channel.slug}.json`, []));
    archives[channel.slug] = videos;
    const cover = channel.thumb || (videos[0] && await thumbFor(videos[0].id)) || 'social-preview.png';
    channelProjects.push({
      disc: channel.disc || 'motion', thumb: cover, thumbWidth: channel.thumbWidth || 1280, thumbHeight: channel.thumbHeight || 720,
      meta: channel.meta || 'YouTube', title: channel.name, act: 'channel', arg: channel.slug, slug: channel.slug,
      featured: Boolean(channel.featured), kind: channel.kind || 'Collaborazione', role: channel.role || '', description: channel.description || '',
      channelId: channel.channelId, handle: channel.handle || '', lang: channel.lang || 'it', videoCount: videos.length
    });
  }

  // Le righe nuove si aggiungono in fondo al file: in archivio compaiono per prime.
  const used = new Set([...portfolio.projects, ...channelProjects].map(project => project.slug));
  const listed = [];
  for(const entry of entries){
    if(portfolio.projects.some(project => project.act === 'video' && project.arg === entry.id)) continue;
    const info = metadata[entry.id] || {}, title = entry.title || info.title || `Video ${entry.id}`;
    let slug = slugify(title) || entry.id.toLowerCase();
    if(used.has(slug)) slug = `${slug}-${entry.id.toLowerCase()}`;
    used.add(slug);
    listed.unshift({
      disc: entry.disc, thumb: await thumbFor(entry.id) || 'social-preview.png', thumbWidth: 1280, thumbHeight: 720,
      meta: info.channel || 'YouTube', title, act: 'video', arg: entry.id, slug, featured: false,
      kind: 'Progetto selezionato', description: info.channel ? `${title} · ${info.channel}` : title, ...(entry.role ? {role: entry.role} : {})
    });
  }

  return {showreel: portfolio.showreel, projects: [...channelProjects, ...listed, ...portfolio.projects], photos: portfolio.photos, instagram: portfolio.instagram, archives};
}
