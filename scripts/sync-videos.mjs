// Completa i video elencati in data/videos.txt: titolo e canale da YouTube
// (oEmbed pubblico, nessuna chiave) e copertina salvata in img/youtube/.
// I dati vengono conservati in data/videos.json e letti solo una volta per video.
import {readFile, writeFile, rename, mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {parseVideoList, readJSON, exists} from './catalog-data.mjs';

export async function fetchInfo(id, fetcher = fetch){
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`;
  const response = await fetcher(url, {signal: AbortSignal.timeout(20000)});
  if(!response.ok) throw new Error(`video ${id} non disponibile (HTTP ${response.status})`);
  const {title, author_name: channel} = await response.json();
  if(!title) throw new Error(`video ${id} senza titolo`);
  return {title, channel: channel || ''};
}

async function downloadCover(id){
  for(const size of ['maxresdefault', 'mqdefault']){
    try{
      const response = await fetch(`https://i.ytimg.com/vi/${id}/${size}.jpg`, {signal: AbortSignal.timeout(20000)});
      if(!response.ok || !response.headers.get('content-type')?.startsWith('image/')) continue;
      await writeFile(`img/youtube/${id}.jpg`, Buffer.from(await response.arrayBuffer()));
      return true;
    }catch{/* prova la dimensione successiva */}
  }
  return false;
}

async function main(){
  const {entries, errors} = parseVideoList(await readFile('data/videos.txt', 'utf8').catch(() => ''));
  if(errors.length) throw new Error(`data/videos.txt: ${errors.join('; ')}.`);
  const out = 'data/videos.json', metadata = await readJSON(out, {});
  await mkdir('img/youtube', {recursive: true});
  let added = 0, failed = 0;
  for(const {id} of entries){
    try{
      if(!metadata[id]){metadata[id] = await fetchInfo(id); added++;}
      if(!await exists(`img/youtube/${id}.jpg`) && !await downloadCover(id)) console.log(`::warning::Copertina non scaricata per ${id}.`);
    }catch(error){failed++; console.error(`✗ ${error.message}`);}
  }
  const sorted = Object.fromEntries(Object.entries(metadata).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(out + '.tmp', JSON.stringify(sorted, null, 2) + '\n');
  await rename(out + '.tmp', out);
  console.log(`✓ ${entries.length} video in data/videos.txt, ${added} nuovi.`);
  if(failed) process.exitCode = 1;
}
if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {console.error(error.message); process.exitCode = 1;});
