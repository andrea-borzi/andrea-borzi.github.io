// Aggiorna l'archivio video di ogni canale elencato in data/channels.json.
// Senza chiave usa il feed RSS pubblico (ultime ~15 pubblicazioni) e unisce i
// nuovi video all'archivio. Con YOUTUBE_API_KEY legge l'intera playlist dei
// caricamenti: lo storico resta completo e i video rimossi escono dall'archivio.
import {writeFile, rename, mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {VIDEO_ID, CHANNEL_ID, readJSON, exists} from './catalog-data.mjs';

const decode = (s = '') => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

export function parseFeed(xml){
  const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, entry]) => ({
    id: (entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1],
    title: decode((entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1]),
    published: (entry.match(/<published>(.*?)<\/published>/) || [])[1] || ''
  }));
  if(!videos.length || videos.some(video => !VIDEO_ID.test(video.id ?? ''))) throw new Error('Feed vuoto o non valido');
  return videos;
}

export async function fetchFeed(channelId, fetcher = fetch){
  const response = await fetcher(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {headers: {'User-Agent': 'portfolio-sync'}, signal: AbortSignal.timeout(30000)});
  if(!response.ok) throw new Error(`Feed non raggiungibile (HTTP ${response.status})`);
  return parseFeed(await response.text());
}

export async function fetchUploads(channelId, apiKey, fetcher = fetch){
  const videos = [];
  let pageToken = '', pages = 0;
  do{
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.search = new URLSearchParams({part: 'snippet,contentDetails,status', playlistId: 'UU' + channelId.slice(2), maxResults: '50', key: apiKey, fields: 'nextPageToken,items(snippet(title,publishedAt,resourceId/videoId),contentDetails/videoPublishedAt,status/privacyStatus)', ...(pageToken ? {pageToken} : {})});
    // Non stampare mai URL o eccezioni di fetch: contengono la chiave API.
    let response;
    try{response = await fetcher(url, {signal: AbortSignal.timeout(30000)});}catch{throw new Error('Richiesta YouTube non riuscita');}
    if(!response.ok) throw new Error(`YouTube ha risposto con HTTP ${response.status}`);
    const payload = await response.json();
    if(!Array.isArray(payload.items)) throw new Error('Risposta YouTube non valida');
    for(const item of payload.items){
      const id = item.snippet?.resourceId?.videoId;
      if(!VIDEO_ID.test(id ?? '')) throw new Error('ID video non valido nella risposta YouTube');
      if(item.status?.privacyStatus !== 'public') continue;
      videos.push({id, title: item.snippet.title, published: item.contentDetails?.videoPublishedAt || item.snippet.publishedAt || ''});
    }
    pageToken = payload.nextPageToken || '';
    if(++pages > 100) throw new Error('Troppe pagine nella playlist');
  }while(pageToken);
  return videos;
}

const newestFirst = (a, b) => a.published && b.published ? b.published.localeCompare(a.published) : a.published ? -1 : b.published ? 1 : 0;

// complete=true: la lista fresca è l'intero canale e sostituisce l'archivio.
export function mergeArchive(existing, fresh, complete = false){
  const old = new Map(existing.map(video => [video.id, video]));
  const merged = new Map(complete ? [] : old);
  for(const video of fresh){
    const previous = old.get(video.id);
    merged.set(video.id, {...previous, ...video, published: previous?.published || video.published});
  }
  return [...merged.values()].sort(newestFirst);
}

async function downloadThumb(id, size = 'mqdefault', path = `img/youtube/thumbs/${id}.jpg`){
  try{
    const response = await fetch(`https://i.ytimg.com/vi/${id}/${size}.jpg`, {signal: AbortSignal.timeout(20000)});
    if(!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return false;
    await writeFile(path, Buffer.from(await response.arrayBuffer()));
    return true;
  }catch{return false;}
}

async function main(){
  const key = process.env.YOUTUBE_API_KEY;
  const channels = await readJSON('data/channels.json');
  await mkdir('data/channels', {recursive: true});
  await mkdir('img/youtube/thumbs', {recursive: true});
  let failed = 0;
  for(const channel of channels){
    try{
      if(!CHANNEL_ID.test(channel.channelId ?? '')) throw new Error('channelId non valido');
      const out = `data/channels/${channel.slug}.json`;
      const existing = await readJSON(out, []);
      if(!Array.isArray(existing) || existing.some(video => !VIDEO_ID.test(video?.id ?? ''))) throw new Error('archivio non valido, storico conservato');
      let archive, source;
      if(key){
        try{archive = mergeArchive(existing, await fetchUploads(channel.channelId, key), true); source = 'API';}
        catch(error){console.log(`::warning::${channel.name}: ${error.message}. Uso il feed RSS.`);}
      }
      if(!archive){archive = mergeArchive(existing, await fetchFeed(channel.channelId)); source = 'RSS';}
      await writeFile(out + '.tmp', JSON.stringify(archive, null, 2) + '\n');
      await rename(out + '.tmp', out);
      // Copertina grande per la scheda del canale: l'ultimo video pubblicato.
      if(archive[0] && !await exists(`img/youtube/${archive[0].id}.jpg`)) await downloadThumb(archive[0].id, 'maxresdefault', `img/youtube/${archive[0].id}.jpg`);
      let thumbs = 0;
      for(const video of archive){
        if(await exists(`img/youtube/thumbs/${video.id}.jpg`) || await exists(`img/youtube/${video.id}.jpg`)) continue;
        if(await downloadThumb(video.id)) thumbs++;
      }
      console.log(`✓ ${channel.name}: ${archive.length} video (${source}), ${thumbs} nuove miniature.`);
    }catch(error){
      failed++;
      console.error(`✗ ${channel.name || channel.slug}: ${error.message}`);
    }
  }
  if(failed) process.exitCode = 1;
}
if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
