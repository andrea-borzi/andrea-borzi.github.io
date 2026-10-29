# Andrea Borzì — Visual Artist

Portfolio statico, senza dipendenze di build. Node.js 22 consigliato.

## Anteprima e verifiche

```sh
node scripts/build.mjs
node --test scripts/*.test.mjs
node scripts/check.mjs
node scripts/serve.mjs
```

Aprire http://127.0.0.1:4173. Il server resta in esecuzione fino alla chiusura del processo.

## Dove modificare

- `index.html`: testi e struttura della homepage. La selezione dei progetti viene prerenderizzata durante la build.
- `assets/site.css`: identità visiva e layout responsive.
- `assets/site.js`: dialoghi accessibili, filtri, gallerie, statistiche.
- `data/portfolio.json`: progetti curati a mano, ID showreel, gallerie fotografiche e post Instagram. `featured: true` seleziona i progetti iniziali. `role` contiene solo ruoli confermati.
- `data/channels.json`: i canali YouTube che monto. Per aggiungerne uno basta un nuovo blocco con `slug`, `name` e `channelId` (inizia con `UC`). `since` (es. `2026-01`) importa solo i video da quella data, `exclude` elenca gli ID da nascondere. Ogni canale ha una pagina in `projects/<slug>.html` con tutti i video e la ricerca.
- `data/videos.txt`: video singoli. Una riga per video: `link | categoria | ruolo | titolo` (categorie: video, 3d, web, foto; ruolo e titolo facoltativi). Si può modificare anche dal sito di GitHub: al salvataggio il workflow legge titolo e copertina da YouTube e pubblica la scheda. Cancellare la riga toglie il video.
- Generati, da non modificare a mano: `data/channels/<slug>.json` (archivio di ogni canale), `data/videos.json` (titoli letti da YouTube), `data/catalog.json` (catalogo unico letto dal sito), le miniature in `img/youtube/`.
- `data/youtube-stats.json`: ultimo snapshot completo delle visualizzazioni, generato dall’API. Non compilare valori inventati a mano.
- `projects/*.html` e `sitemap.xml`: generati da `scripts/build.mjs`; modificare il catalogo e rigenerare.

La directory `_site` contiene esclusivamente il sito da pubblicare. Audit, script e documentazione interna non vengono inclusi nell’artefatto Pages.

## Attivare le visualizzazioni reali

1. Creare o scegliere un progetto in Google Cloud e abilitare **YouTube Data API v3**.
2. Creare una chiave API e limitarla all’uso di YouTube Data API v3. Non usare una restrizione per referrer del browser: le richieste partono da GitHub Actions.
3. Nel repository GitHub: **Settings → Secrets and variables → Actions → New repository secret**. Nome: `YOUTUBE_API_KEY`. Incollare il valore solo nel campo secret, non nel repository o nella chat.
4. Per pubblicare con il workflow incluso: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
5. Dopo aver pubblicato il codice, aprire **Actions → Sync portfolio and publish → Run workflow**.
6. Verificare il run e il JSON pubblicato: `updatedAt`, `videoCount`, `totalViews` e `complete: true`. Il sito mostrerà il totale con data dell’aggiornamento.

Documentazione: [YouTube videos.list](https://developers.google.com/youtube/v3/docs/videos/list), [configurazione API](https://developers.google.com/youtube/v3/getting-started), [GitHub Pages con Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Il contatore include showreel, tutti i progetti con `act: video` (anche quelli di `videos.txt`) e tutti i video dei canali in `channels.json`, deduplicati per ID. Non include Instagram. Somma le visualizzazioni complessive dei video su YouTube, non le visite al portfolio né utenti unici.

Con la chiave la sync dei canali legge l’intera playlist dei caricamenti (storico completo, video rimossi esclusi); senza chiave usa il feed RSS, che copre solo le ultime ~15 pubblicazioni, e le views mostrano un trattino. Una risposta API parziale o un errore non sovrascrive lo snapshot precedente. I video mancanti vengono elencati nel log: verificare disponibilità e catalogo. Non rimuovere video soltanto per far passare il test senza verificarne lo stato.

Il workflow prova ad aggiornare feed e statistiche indipendentemente, pubblica gli ultimi dati validi e termina con errore segnalato se una sync è fallita. La pianificazione è giornaliera alle 06:17 UTC e GitHub può ritardare l’avvio. I workflow schedulati dei repository pubblici possono essere disattivati dopo inattività prolungata: controllare lo stato in Actions e riattivare se necessario.

Ogni canale importa tutti i video pubblicati: Andrea li monta tutti. Se una collaborazione non copre più ogni pubblicazione, usare `since` o `exclude` in `channels.json`.

## Misurazione

Il sito emette eventi locali `portfolio:interaction` per apertura progetto, showreel, archivio e click di contatto. Non invia dati a un servizio analytics e non salva dati personali. Per misurare conversioni reali occorre scegliere e configurare un servizio; un click email non equivale a un contatto ricevuto.

## Materiale editoriale ancora utile

Testimonianze autentiche, ritratto/backstage e breakdown di lavorazione possono arricchire il sito in seguito. Non sono stati inventati. Le tavole AR sono dichiarate immagini di presentazione; una demo reale va fornita prima di promettere un’esperienza interattiva.

## Lingue, immagini e privacy

- Italiano alla radice, inglese in `/en/`. `assets/i18n.mjs` contiene le traduzioni dell’interfaccia; i titoli originali delle opere/video restano invariati. `scripts/localize.mjs` genera pagine inglesi, collegamenti lingua e sitemap durante la build.
- Font con licenze OFL e miniature YouTube sono ospitati localmente: nessuna richiesta ai loro fornitori durante la normale consultazione. Le copertine sono salvate alla migliore risoluzione disponibile, senza ricompressione.
- Originali necessari per migliorare ulteriormente: 360 Weekend, Mount Sinai e Girlfriend (480×360); Spot Levi’s ed Editor’s Life (640×480). Urban Heroes è un’immagine verticale 649×1174: viene mostrata intera, senza ritaglio panoramico. Sostituire i file e aggiornare thumbWidth/thumbHeight in data/portfolio.json quando disponibili.
- Instagram richiede consenso nella galleria. Su richiesta del titolare, YouTube parte direttamente al clic mediante youtube-nocookie.com e autoplay=1, senza secondo avviso. Non è garantita assenza di cookie/trattamento dati né conformità del caricamento senza consenso separato. La scelta è solo in memoria e termina alla chiusura; nessun cookie o localStorage viene scritto dal portfolio. I cookie eventualmente impostati dai fornitori dopo il consenso vanno rimossi attraverso il browser. L’informativa descrive questo comportamento.
- Informativa IT/EN in scripts/privacy-content.mjs. Titolare confermato: Andrea Borzì, privato. Se cambiano attività, titolare, fornitori, analytics, form o modalità di conservazione dei contatti, aggiornare l’informativa e verificare gli obblighi applicabili. Le modifiche tecniche non sono una certificazione legale universale né verificano licenze/liberatorie delle opere.
