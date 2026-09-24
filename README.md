# Andrea Borzì — Visual Artist

Portfolio statico, senza dipendenze di build. Node.js 22 consigliato.

## Anteprima e verifiche

```sh
node scripts/build.mjs
node --test scripts/sync-views.test.mjs
node scripts/check.mjs
node scripts/serve.mjs
```

Aprire http://127.0.0.1:4173. Il server resta in esecuzione fino alla chiusura del processo.

## Dove modificare

- `index.html`: testi e struttura della homepage. La selezione dei progetti viene prerenderizzata durante la build.
- `assets/site.css`: identità visiva e layout responsive.
- `assets/site.js`: dialoghi accessibili, filtri, gallerie, statistiche.
- `data/portfolio.json`: fonte comune dei progetti, ID showreel, gallerie fotografiche e post Instagram. `featured: true` seleziona i progetti iniziali. `role` contiene solo ruoli confermati.
- `data/tuttomotori.json`: archivio YouTube aggiornato dalla sincronizzazione RSS. Dopo un’interruzione lunga verificare eventuali video mancanti.
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

Il contatore include showreel, tutti i progetti con `act: video` e la serie Tutto Motori, deduplicati per ID. Non include Instagram. Somma le visualizzazioni complessive dei video su YouTube, non le visite al portfolio né utenti unici.

Senza chiave la sync RSS resta attiva e le views mostrano un trattino. Una risposta API parziale o un errore non sovrascrive lo snapshot precedente. I video mancanti vengono elencati nel log: verificare disponibilità e catalogo. Non rimuovere video soltanto per far passare il test senza verificarne lo stato.

Il workflow prova ad aggiornare feed e statistiche indipendentemente, pubblica gli ultimi dati validi e termina con errore segnalato se una sync è fallita. La pianificazione è giornaliera alle 06:17 UTC e GitHub può ritardare l’avvio. I workflow schedulati dei repository pubblici possono essere disattivati dopo inattività prolungata: controllare lo stato in Actions e riattivare se necessario.

L’importazione da Tutto Motori continua a includere ogni nuovo video del canale, come nel sistema precedente. Se la collaborazione non copre tutte le nuove pubblicazioni, va introdotto un criterio di selezione.

## Misurazione

Il sito emette eventi locali `portfolio:interaction` per apertura progetto, showreel, archivio e click di contatto. Non invia dati a un servizio analytics e non salva dati personali. Per misurare conversioni reali occorre scegliere e configurare un servizio; un click email non equivale a un contatto ricevuto.

## Materiale editoriale ancora utile

Testimonianze autentiche, ritratto/backstage e breakdown di lavorazione possono arricchire il sito in seguito. Non sono stati inventati. Le tavole AR sono dichiarate immagini di presentazione; una demo reale va fornita prima di promettere un’esperienza interattiva.
