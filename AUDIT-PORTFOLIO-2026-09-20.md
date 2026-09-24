# Audit portfolio Andrea Borzì

Analisi del 20 settembre 2026. Nessuna modifica al sito o alla sincronizzazione; documento preparatorio per decidere gli interventi.

## Perimetro e limiti

Inventariati tutti i 100 file del progetto, esclusi i dati interni di Git. Letti integralmente i sorgenti applicativi, i due YAML, il JSON, README, robots e sitemap. Gli altri file sono risorse grafiche: inventariati e verificati nei loro utilizzi, senza una revisione artistica individuale di tutte le fotografie. Ispezionato il sito pubblicato, il codice remoto della sincronizzazione e le ultime esecuzioni pubbliche di Actions. Verificate schermate desktop e smartphone a 390 × 844, apertura e chiusura della galleria Tutto Motori. Non visionati integralmente tutti i filmati, né eseguito un audit Lighthouse o un test con utenti.

Il confronto competitivo è un campione motivato, non un censimento di tutti i concorrenti. Comprende operatori locali, freelance motion/3D e riferimenti automotive. Sono confronti di presentazione e fruizione, non classifiche di competenza o fatturato. Non abbiamo dati di conversione dei concorrenti né analytics del portfolio: le conclusioni commerciali sono valutazioni progettuali da verificare.

## Quadro del progetto

| Parte | Stato rilevato |
|---|---|
| Sito | Pagina statica su GitHub Pages, HTML/CSS/JavaScript in `index.html`, circa 68,5 KB |
| Catalogo | 42 schede: Motion 26, Dimension 8, Systems 3, Light 5 |
| Video Tutto Motori | 38 nella copia locale; 59 nel JSON pubblicato |
| Altri video YouTube | 24 video nelle schede, più lo showreel |
| Perimetro YouTube online | 84 ID distinti, includendo lo showreel e deduplicando i riferimenti |
| Instagram | 29 post nella galleria Urban Heroes; lista manuale |
| Fotografia | 18 immagini Città Invisibili, 30 Sant’Agata, 15 Catania Serie C |
| Asset | 80 file nella cartella img, circa 23,2 MB complessivi; non equivalgono al peso del caricamento iniziale |
| Prove sociali | Contatori manuali; testimonianze predisposte ma array vuoto e sezione nascosta |
| SEO di base | Title, description, canonical, Open Graph, dati Person, robots e sitemap presenti |

L’HTML pubblicato coincide con quello locale, normalizzando i fine riga. Anche script e workflow remoti corrispondono alla logica locale. Il JSON locale è invece arretrato. Ultimo video nel JSON pubblico: 18 settembre 2026. Ultima esecuzione sync osservata: 20 settembre 2026, conclusa con successo. Anche una pubblicazione Pages del 19 settembre risulta riuscita. Non ci sono evidenze per affermare che il sistema sia attualmente fermo.

Fonti operative: [JSON pubblico](https://andrea-borzi.github.io/data/tuttomotori.json), [esecuzione sync verificata](https://github.com/andrea-borzi/andrea-borzi.github.io/actions/runs/35506763332), [pubblicazione Pages verificata](https://github.com/andrea-borzi/andrea-borzi.github.io/actions/runs/35438069555).

## Come funziona la sincronizzazione

Il workflow effettivo è `.github/workflows/sync-tuttomotori.yml`. Quello nella cartella principale è una copia diversa, non eseguita come workflow GitHub. L’esecuzione è programmata alle 06:00 UTC, è avviabile manualmente e parte sui push a main. L’orario programmato non coincide necessariamente con quello effettivo: il run osservato oggi è partito alle 11:03 UTC.

Lo script scarica il feed RSS del canale, estrae ID, titolo e data delle ultime pubblicazioni, unisce i risultati all’archivio esistente e deduplica per ID. Il browser legge il JSON e aggiorna il numero di video della galleria. Se il caricamento fallisce, resta una lista di ripiego di 27 video.

Limiti concreti:

- Le visualizzazioni non vengono lette: il 650K+ è un valore manuale con animazione.
- Il feed copre una finestra limitata di pubblicazioni; una lunga interruzione può lasciare buchi che il semplice merge non recupera.
- Lo script importa ogni nuova pubblicazione del canale, senza verificare che Andrea abbia lavorato a quel video.
- Non verifica se i vecchi video siano ancora disponibili o incorporabili.
- Se il JSON esistente non è leggibile, lo script riparte da un archivio vuoto: è preferibile interrompere il salvataggio per non perdere lo storico.
- Il workflow effettivo non passa la variabile `YT_CHANNEL_ID`, diversamente dalla copia nella radice; al momento usa l’ID predefinito corretto nello script.
- Il commento del keepalive promette l’azzeramento del timer di inattività; non trattare questa frase come una garanzia documentata. GitHub documenta la disattivazione delle schedulazioni dopo 60 giorni di inattività nei repository pubblici e la riattivazione dei workflow. [Documentazione GitHub](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows).

## Contatore reale: soluzione proposta

È realizzabile mantenendo GitHub Pages e la struttura attuale. Non serve un server sempre acceso. Il sistema dovrebbe raccogliere tutti gli ID YouTube effettivamente presenti nel portfolio, comprendendo Tutto Motori, i video singoli e lo showreel, eliminare i duplicati e interrogare le statistiche dei singoli video.

La fonte consigliata è YouTube Data API: `videos.list` restituisce i video richiesti per ID e permette di richiedere `statistics`; `statistics.viewCount` contiene le visualizzazioni. La richiesta `videos.list` costa 1 unità di quota. Servono un progetto Google con API abilitata e una chiave, da conservare nei segreti GitHub e usare solo nell’automazione. [Metodo ufficiale](https://developers.google.com/youtube/v3/docs/videos/list), [statistiche video](https://developers.google.com/youtube/v3/docs/videos), [configurazione API](https://developers.google.com/youtube/v3/getting-started).

Flusso suggerito:

1. Aggiornare la lista dei video con la sync.
2. Ricostruire l’insieme unico degli ID del portfolio da una fonte comune al sito e all’automazione.
3. Leggere le statistiche in piccoli gruppi di video.
4. Salvare conteggi per video, totale, copertura e istante dell’ultimo aggiornamento riuscito in un JSON.
5. Pubblicare i dati insieme al sito e mostrare il totale con l’attuale animazione iniziale.

La frequenza iniziale suggerita è giornaliera. L’etichetta dovrebbe essere «Visualizzazioni dei video YouTube nel portfolio», con ultimo aggiornamento disponibile. Si sommano le visualizzazioni complessive di quei video su YouTube, non soltanto quelle ottenute tramite il portfolio; non sono persone uniche né risultati attribuibili esclusivamente al montaggio.

Gestione necessaria degli errori:

- Errori di rete/API o risposte parziali: non sovrascrivere il totale valido con zero o con una somma incompleta; mantenere lo snapshot precedente con la sua data e segnalare il fallimento nell’automazione.
- Video non restituiti: distinguere indisponibilità da errori tecnici; non affermare automaticamente che siano stati cancellati. Rendere espliciti gli eventuali esclusi e la copertura.
- Video presenti più volte: contarli una sola volta.
- Nuovi video: devono entrare sia nella galleria sia nel successivo conteggio senza modifiche manuali parallele.
- Prima lettura non ancora riuscita: mostrare un trattino o omettere la metrica, senza presentare il vecchio 650K come un dato verificato.

Il totale di 84 è il numero degli ID identificati, non una certificazione che tutti siano oggi pubblici e restituiti dall’API. Instagram è un’integrazione distinta: gli identificativi dei 29 post non forniscono automaticamente le relative visualizzazioni. Terrei separati i due contatori.

Accettazione: confrontare la somma con le risposte API; simulare duplicati, video mancanti ed errori; verificare che il dato arrivi realmente al sito pubblicato. Non basta vedere un commit riuscito. Le regole GitHub impediscono a molti eventi generati da `GITHUB_TOKEN` di avviare altri workflow: la pubblicazione va verificata end-to-end nella configurazione effettiva, senza dedurre un guasto attuale. [Regole ufficiali](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

## Valutazione estetica e commerciale

Il sito ha una base grafica coerente: nero violaceo, accento lavanda, tipografia display riconoscibile, etichette monospaziate e cornici da mirino. Pulsanti e navigazione hanno uno stile consistente. Showreel, accesso ai lavori e contatto sono presenti già nella prima schermata. Le immagini vengono caricate progressivamente e i player soltanto su richiesta. Sono buone scelte da conservare.

Il problema principale è la gerarchia: il sito dedica molto spazio a spiegare la multidisciplinarità e a elencare lavori, mentre dimostra poco il contributo specifico, le decisioni e il risultato di ogni incarico. La lettura complessiva è più vicina a un archivio personale molto curato che a una selezione progettata per convincere un committente preciso.

### Primo impatto

Il punto del titolo compare su una riga separata, osservato sia su desktop sia a 390 px. La regola `.hero h1 .hl span` assegna `display:block` anche allo span annidato della parola rotante. Correggere il selettore è una priorità immediata. La rotazione produce inoltre formule meno naturali in inglese, come «The whole edit» o «The whole build».

La copertina dello showreel è quasi grigia e porta «2025 SHOWREEL». Non offre un’anticipazione significativa della qualità delle immagini. Una copertina scelta tra i fotogrammi più forti migliorerebbe il primo impatto; l’anno va aggiornato solo se cambia davvero il contenuto. Un breve preview può essere valutato successivamente, con poster e rispetto delle preferenze di movimento.

Nel desktop ampio la pagina lascia molto spazio vuoto, mentre il lavoro occupa un riquadro relativamente piccolo. Ridurre l’altezza iniziale e aumentare la presenza delle immagini renderebbe più immediata la dimostrazione della competenza.

### Selezione e immagini

Le 42 schede sono esposte prima dell’unico caso studio. A 390 × 844 il documento misura circa 19.163 px; il caso studio comincia a 11.772 px e i contatti a 18.468 px. I link di navigazione permettono di saltare le sezioni, ma la lettura sequenziale resta lunga.

Proporrei 6–8 lavori principali in homepage, con accesso all’archivio completo. Non è necessario eliminare lavori: bisogna assegnare loro un peso diverso. Video commerciali, esercizi, gaming, prove di color e fotografie virtuali non dovrebbero essere indistinguibili per importanza commerciale.

Le prime due schede grandi occupano due colonne su tre ciascuna e lasciano spazi laterali vuoti. Una griglia editoriale deliberata, con coppie bilanciate o un vero progetto a tutta larghezza, sembrerebbe più controllata.

Le miniature YouTube mescolano titoloni, frecce, fotogrammi e cartelli: funzionano per attirare click sulla piattaforma ma rompono l’unità del portfolio. La scheda Urban Heroes mostra inoltre il soggetto ruotato. Servono copertine scelte per il sito, con ritagli coerenti e soggetti leggibili. L’oscuramento delle immagini tramite opacità riduce anche l’impatto del color grading che il sito vende come competenza.

### Posizionamento e fiducia

«One person. The whole pipeline» comunica autonomia, ma torna con formulazioni simili in hero, processo, servizi, about, FAQ e caso studio. Ridurrei la ripetizione e userei lo spazio per informazioni verificabili: ruolo, committente, vincoli, tempi, deliverable, tecniche e risultati.

La multidisciplinarità può essere un vantaggio, purché sia chiaro qual è il servizio principale. Assunzione per questo audit, in assenza di un target confermato: video e postproduzione come ingresso, con 3D, fotografia e interattività a supporto. Se l’obiettivo principale sono agenzie 3D o incarichi di sviluppo, l’ordine deve cambiare.

Il caso Zodiac è correttamente dichiarato personale, ma descrive soprattutto intenzioni e impressioni. «3 → 1» non è una misura di risultato. Aggiungerei storyboard, breakdown, prima/dopo e ruolo effettivo. Per dimostrare affidabilità commerciale, affiancherei un caso Tutto Motori o Urban Heroes con brief, attività realmente svolte e risultati contestualizzati.

La fascia scorrevole mescola clienti e progetti personali; separare le collaborazioni reali dagli studi personali renderebbe più chiara la prova sociale. Anche «start to finish» e le dichiarazioni di regia/ripresa vanno precisate per progetto, soprattutto se per alcuni video il lavoro è stato solo di montaggio o postproduzione.

Le testimonianze non sono visibili perché non ce ne sono nel codice. Due o tre dichiarazioni autentiche e attribuite aiuterebbero più del generico «10+ satisfied clients». Un ritratto o un’immagine di backstage aggiungerebbe una presenza personale oggi debole.

Il sito è quasi interamente inglese. Per committenti locali valuterei italiano principale e inglese alternativo; per agenzie internazionali l’inglese resta sensato. Nessuna ragione di decidere la lingua senza collegarla al pubblico desiderato.

### Utilizzo pratico

La galleria Tutto Motori apre correttamente e mostra 1/59; la chiusura riporta il focus alla scheda. Tuttavia non offre un indice consultabile: per trovare un video serve avanzare sequenzialmente, senza titoli esterni al player o filtri. Aggiungerei elenco/miniature, titolo, data, ruolo e link diretto.

Durante la prova il player ha mostrato pubblicità prima del video. È una frizione reale dell’incorporamento YouTube, non un difetto del codice. Il percorso principale dovrebbe consentire di valutare il progetto anche con fotogrammi e testo, senza dipendere completamente dall’avvio del player.

Le schede AR aprono immagini statiche: la dimostrazione non corrisponde completamente alla promessa interattiva. Servono brevi demo, indicazioni di accesso o video di utilizzo. Anche il progetto di sviluppo meriterebbe un contesto prima di portare il visitatore fuori dal portfolio.

I pulsanti di contatto sono presenti e riconoscibili. Aggiungerei un invito contestuale sotto ogni caso principale, con email visibile e indicazioni essenziali per il brief. Un modulo è opzionale: non è necessario complicare il contatto già diretto via email/WhatsApp.

### Accessibilità e manutenzione

Menu mobile e finestre chiuse sono nascosti con opacità e pointer-events, ma rimangono nell’albero di accessibilità. Mancano una gestione completa del focus, l’esclusione degli elementi nascosti dalla tabulazione, il ruolo dialog e l’isolamento del contenuto sottostante. L’apertura della galleria lascia il focus sulla scheda dietro alla finestra. Da correggere prima di aggiungere effetti.

Sono già presenti focus visibile, attivazione da tastiera delle schede e riduzione del movimento: buona base. Resta da collaudare l’intero percorso con tastiera e lettore di schermo. Senza JavaScript il catalogo non viene generato e molti blocchi restano invisibili: il markup statico o prerenderizzato darebbe maggiore robustezza e pagine progetto più facilmente indicizzabili e condivisibili.

Alcune immagini di galleria superano 1 MB, con massimo osservato di circa 1,54 MB. Valutare versioni responsive e precaricamento della foto successiva; il peso totale della cartella non è una misura delle prestazioni iniziali. Mancano misurazioni reali di Core Web Vitals, quindi non viene attribuito un punteggio di velocità.

Il file unico resta gestibile per un portfolio piccolo, ma dati progetto, stile, comportamento e configurazione dei contatori meritano separazione per evitare duplicazioni. Non serve necessariamente introdurre un framework. README quasi vuoto e YAML duplicato rendono meno chiara la manutenzione. Minore: l’orario locale viene etichettato sempre CET anche durante l’ora legale.

## Confronto competitivo

Cinque siti sono stati osservati visivamente nel browser oltre alla lettura dei contenuti. Niccolò Arcostanzo è stato analizzato attraverso la pagina indicizzata: l’accesso diretto ha mostrato una protezione CAPTCHA, che non è stata superata. Stefano Pulici è un riferimento aggiuntivo sui contenuti e sul posizionamento, non sottoposto a revisione visiva completa.

| Riferimento | Cosa emerge | Applicazione al portfolio |
|---|---|---|
| [Pensante Film, Catania](https://pensantefilm.it/) | Titolo diretto, territorio esplicito, servizi concreti, recensioni collegate a Google e contatto. Impostazione più tradizionale e ampia. | Conservare una firma visiva personale, adottando maggiore chiarezza commerciale e prove attribuite. È un confronto locale pertinente. |
| [Lorenzo Bassi Andreasi / lnzbss](https://lnzbss.com/) | Impianto chiaro e quasi da catalogo editoriale; immagini affiancate per progetto, con tipo e anno. Molto poco testo promozionale. | Far parlare i lavori e specificare ruolo e contesto. Non copiarne automaticamente la densità o la navigazione orizzontale; nel browser alcuni media non erano riproducibili. |
| [Mattia Beltrame](https://www.mattiabeltrame.com/it) | Presentazione subito centrata sul motion design di prodotto; nero/viola, menu breve, pagine servizi e progetti. | Un accento viola da solo non differenzia: specializzazione e selezione hanno più peso. Nel test alcuni elementi mostravano ancora caricamento, quindi non è un modello assoluto di prestazioni. |
| [Giacomo Bompan / Goodbread](https://goodbread.co/) | Reel ampio, filtri 2D/3D/AI, progetti collegati a pagine dedicate, descrizioni del tipo di lavorazione. | Organizzare la varietà per bisogni e output. La copertina osservata porta 2022: anche questo riferimento avrebbe bisogno di cura nella percezione di aggiornamento. |
| [Alessandro Cavalli](https://www.alessandrocavalli.com/) | Immagini immersive, categorie automotive/commercial/fashion/interior, enfasi sul film. | Far occupare più spazio alle immagini. Il navigatore osservato è meno esplicito e compare uno scorrimento orizzontale: evitare di sacrificare la facilità d’uso per l’effetto cinematografico. Benchmark automotive, non prova di identica fascia di mercato. |
| [Niccolò Arcostanzo](https://www.niccoloarcostanzo.com/it/portfolio/) | Catalogo per ADV, automotive, cinema, fashion, musica e TV; pagine per i progetti e ruoli professionali espliciti. | Trasformare l’archivio in un catalogo navigabile e collegabile. Il suo ampio catalogo non giustifica altrettanta lunghezza nella homepage personale. Valutazione strutturale, non visiva diretta. |
| [Stefano Pulici](https://www.stefanopulici.it/en/) | Posizionamento esplicito tra motion e web design. | Un profilo con più competenze può restare leggibile se dichiara con precisione il proprio mestiere. Riferimento testuale supplementare. |

Il pattern utile è costante: presentazione precisa, contenuti selezionati e contesto per i progetti. Nessuno di questi esempi va assunto come superiore su ogni asse. Non ci sono dati che permettano di affermare quanto convertano o se competano davvero sugli stessi budget.

## Priorità per la fase successiva

| Priorità | Intervento | Criterio di riuscita |
|---|---|---|
| 1 | Contatore YouTube e fonte dati condivisa | Somma verificata degli ID unici, aggiornamento datato, errori senza falsi zeri, pubblicazione verificata |
| 1 | Titolo iniziale e copertina reel | Nessun punto isolato; prima schermata con immagine rappresentativa su desktop e mobile |
| 1 | Selezione di 6–8 progetti | Il visitatore incontra presto lavori forti, spiegazione del ruolo e contatto |
| 1 | Due casi documentati | Un caso commerciale e uno autoriale, con contributo preciso e prove visive |
| 2 | Copertine coerenti e griglia | Niente soggetti ruotati o testo sovrapposto alle scritte delle thumbnail |
| 2 | Catalogo e finestre accessibili | Video selezionabili per titolo; tastiera, focus e chiusura funzionanti |
| 2 | Testimonianze, bio e lingua | Informazioni autentiche e adeguate al mercato scelto |
| 3 | Pagine progetto e ottimizzazione immagini | URL condivisibili, informazioni indicizzabili, miglioramenti misurati |
| 3 | Misurazione dei contatti | Eventi di apertura lavori/reel e click contatto, con baseline prima di attribuire risultati al redesign |

Decisioni da chiarire prima della progettazione: incarichi prioritari, pubblico italiano/internazionale, contributo effettivo a Tutto Motori e agli altri progetti, criterio per includere automaticamente ogni nuovo video del canale. La chiave YouTube è un requisito operativo della fase contatore e non va inserita nel codice pubblico o nella conversazione.
