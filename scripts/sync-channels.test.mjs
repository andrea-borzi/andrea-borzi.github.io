import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFeed, fetchUploads, mergeArchive} from './sync-channels.mjs';
import {parseVideoId, parseVideoList, channelVideos, slugify} from './catalog-data.mjs';
const a='ABCDEFGHIJK', b='12345678901', c='zyxwvutsrqp';

test('i link YouTube più comuni diventano un ID', () => {
  for(const link of [`https://youtu.be/${a}`, `https://www.youtube.com/watch?v=${a}&t=10s`, `https://youtube.com/shorts/${a}`, `https://m.youtube.com/watch?v=${a}`, `https://www.youtube.com/embed/${a}`, a])
    assert.equal(parseVideoId(link), a, link);
  assert.equal(parseVideoId('https://vimeo.com/123'), null);
  assert.equal(parseVideoId('https://youtu.be/troppo-corto'), null);
});

test('videos.txt: commenti ignorati, campi facoltativi, errori con il numero di riga', () => {
  const {entries, errors} = parseVideoList(`# commento\n\nhttps://youtu.be/${a} | 3D | Animazione | Titolo mio\nhttps://youtu.be/${b}\nhttps://youtu.be/${a}\nhttps://youtu.be/${c} | radio\nnon un link`);
  assert.deepEqual(entries, [{id: a, disc: 'dimension', role: 'Animazione', title: 'Titolo mio'}, {id: b, disc: 'motion', role: '', title: ''}]);
  assert.deepEqual(errors.map(error => error.split(':')[0]), ['riga 5', 'riga 6', 'riga 7']);
});

test('slug come quelli esistenti', () => {
  assert.equal(slugify("Editor's Life"), 'editor-s-life');
  assert.equal(slugify('Città Invisibili'), 'citta-invisibili');
});

test('since ed exclude filtrano i video del canale', () => {
  const archive = [{id: a, published: '2026-09-01T00:00:00Z'}, {id: b, published: '2025-01-01T00:00:00Z'}, {id: c, published: '2026-10-01T00:00:00Z'}];
  assert.deepEqual(channelVideos({since: '2026-01', exclude: [c]}, archive).map(v => v.id), [a]);
  assert.equal(channelVideos({}, archive).length, 3);
});

test('feed RSS letto e validato', () => {
  const xml = `<feed><entry><yt:videoId>${a}</yt:videoId><title>Tom &amp; Jerry</title><published>2026-09-22T11:00:35+00:00</published></entry></feed>`;
  assert.deepEqual(parseFeed(xml), [{id: a, title: 'Tom & Jerry', published: '2026-09-22T11:00:35+00:00'}]);
  assert.throws(() => parseFeed('<feed></feed>'), /non valido/);
});

test('RSS si unisce allo storico; la lista completa da API lo sostituisce mantenendo le date', () => {
  const existing = [{id: a, title: 'Vecchio', published: '2026-01-01T00:00:00+00:00'}, {id: b, title: 'Rimosso', published: '2025-01-01T00:00:00+00:00'}];
  const fresh = [{id: a, title: 'Nuovo', published: '2026-01-01T00:00:00Z'}, {id: c, title: 'Ultimo', published: '2026-10-01T00:00:00Z'}];
  assert.deepEqual(mergeArchive(existing, fresh).map(v => v.id), [c, a, b]);
  const complete = mergeArchive(existing, fresh, true);
  assert.deepEqual(complete.map(v => v.id), [c, a]);
  assert.equal(complete[1].title, 'Nuovo');
  assert.equal(complete[1].published, '2026-01-01T00:00:00+00:00');
});

test('playlist completa: paginazione, solo video pubblici, chiave mai nei messaggi', async () => {
  const pages = {'': {nextPageToken: 'P2', items: [{snippet: {title: 'Uno', publishedAt: 'x', resourceId: {videoId: a}}, contentDetails: {videoPublishedAt: '2026-01-01T00:00:00Z'}, status: {privacyStatus: 'public'}}, {snippet: {title: 'Privato', resourceId: {videoId: b}}, status: {privacyStatus: 'private'}}]},
    P2: {items: [{snippet: {title: 'Due', publishedAt: '2026-02-01T00:00:00Z', resourceId: {videoId: c}}, status: {privacyStatus: 'public'}}]}};
  let playlist;
  const videos = await fetchUploads('UC3OaP3ZsVB_mZL_ciKdGH3g', 'test', async url => {playlist = url.searchParams.get('playlistId'); return {ok: true, json: async () => pages[url.searchParams.get('pageToken') || '']};});
  assert.equal(playlist, 'UU3OaP3ZsVB_mZL_ciKdGH3g');
  assert.deepEqual(videos, [{id: a, title: 'Uno', published: '2026-01-01T00:00:00Z'}, {id: c, title: 'Due', published: '2026-02-01T00:00:00Z'}]);
  await assert.rejects(fetchUploads('UC3OaP3ZsVB_mZL_ciKdGH3g', 'secret', async () => {throw new Error('URL con secret');}), error => !error.message.includes('secret'));
  await assert.rejects(fetchUploads('UC3OaP3ZsVB_mZL_ciKdGH3g', 'test', async () => ({ok: false, status: 403})), /HTTP 403/);
});
