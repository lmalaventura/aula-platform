# Interfaccia v4: archivio illustrato e lettore PDF integrato

## Stato corrente

Tema scuro caldo comune alle sezioni, titoli editoriali, dettagli di carta e
mascotte in pose coerenti. Nell’ingresso e nello spazio di studio il personaggio
è un SVG articolato: braccia, gambe, espressione e accessori sono gruppi separati. Il selettore degli strumenti è un'interfaccia
riutilizzabile: non richiede AI durante lo studio e mostra soltanto le attività
effettivamente pubblicate per quella materia.

La versione precedente è documentata nei checkpoint storici di PROJECT_STATUS.
Questo documento descrive la versione corrente.

## Flusso di consultazione

- Homepage centrata con illustrazione locale di sfondo, ricerca e contributo
  visibile. Archivio di fascicoli con fogli sovrapposti e titoli sans serif.
- Proponi materiale nella homepage apre lo stesso tipo di dialogo del menu.
  Autenticazione e abilitazione dei collaboratori restano quelle esistenti.
- Navigazione principale: Insegnamenti e Proponi materiale. Il rimando
  Il progetto nel footer è stato rimosso.
- Ricerca per nomi e sigle nel catalogo corrente: prefissi delle parole,
  maiuscole e accenti normalizzati. Ma trova Machine Learning e non abbina
  casualmente la parola programmazione. Le eventuali materie nuove entrano
  automaticamente nella stessa ricerca.
- Suggerimenti cliccabili; frecce, Invio ed Esc. Una sola corrispondenza apre
  direttamente la materia; più corrispondenze portano al catalogo con q nell'URL.
  L'elenco mostra Risultati per ... senza pannelli o etichette tecniche di filtri.
- La ricerca inviata rimane nell'URL del catalogo: Indietro del browser può
  ripristinare quel risultato. Il collegamento generale Insegnamenti apre il
  catalogo completo.
- Il vecchio indirizzo /materiali rimane compatibile con i link preesistenti;
  la navigazione principale e la ricerca in homepage non lo utilizzano.
- Schede con contenuti realmente disponibili, appunti condivisi in evidenza,
  documento con informazioni espandibili e download.

## Mascotte e strumenti

- Nella materia, accanto agli appunti, il riquadro compatto con la mascotte è
  un collegamento reale allo spazio di studio, collocato più in alto.
  Sugli schermi stretti il ripasso precede gli appunti. Se manca una banca
  pubblicata, l’avviso In preparazione resta esplicito.
- Hover o focus da tastiera: sorriso con occhi felici, saluto del braccio e
  piccolo sollevamento del personaggio. Con movimento ridotto resta soltanto
  il cambio di espressione, senza oscillazioni.
- Il selettore avvicina il personaggio allo zaino, solleva e apre la borsa,
  estrae tre quaderni; gli strumenti entrano in sequenza. Presenta gli oggetti: fogli per Quiz, carte per
  Flashcard, fogli con orologio per Allenamento, lavagna per Mappe, cuffie per
  Podcast. Nomi e azioni rimangono testo e pulsanti accessibili.
- La mascotte raggiunge e apre il libro del quiz; per l’allenamento ha occhiali,
  cravatta e registro, per le mappe squadra e bacchetta. Le cuffie si
  posano sulla testa, gli occhiali accompagnano la bacchetta per le mappe,
  fogli e carte vengono estratti per gli altri strumenti.
- Questa è una prima animazione vettoriale, non un personaggio 3D o una scena
  cinematografica: non c’è ancora una camminata continua fra stanze o una
  lezione video sincronizzata. I PNG decorativi nelle altre pagine restano.
- Tutte le attività sono utilizzabili subito: nessun timer o attesa prima del
  click. Movimenti finiti, attivati dalle scelte, senza cicli continui.
- Il selettore è comune alle materie e mostra solo i contenuti approvati.
  Nessuna nuova banca didattica o opzione inattiva simulata.
- Quiz, flashcard, allenamento, mappe e audio conservano i controlli esistenti.
  Il podcast resta audio, capitoli e trascrizione. Un solo episodio o mappa
  non introduce un selettore superfluo.
- In /redazione: espandere Prova anche la scelta strumenti con la mascotte,
  passare sul personaggio e cliccare per entrare. La demo locale comprende
  Quiz, Flashcard e Allenamento con quesiti tecnici sull’interfaccia; mappe e
  podcast compaiono nelle materie dopo la pubblicazione dei contenuti.

## Lettore PDF integrato

PdfReader carica PDF.js soltanto nella pagina di una risorsa. Conserva grafica,
formule, font e impaginazione del PDF: non riconverte gli appunti in HTML.
Il foglio ha una cornice di carta su un piano di lettura scuro.

- Pagina precedente/successiva, numero di pagina, zoom e adattamento alla
  larghezza. Una pagina per volta per limitare memoria e canvas.
- Testo selezionabile, se presente nel PDF. Il messaggio segnala le pagine senza
  testo estraibile; non è un sistema OCR né un audit di accessibilità del PDF.
- Indice opzionale, ricavato dai segnalibri effettivi, chiuso all’apertura.
  I rimandi interni aprono la pagina di destinazione. Sono gestiti i normali
  link, non moduli PDF, allegati o scripting del documento.
- Schermo intero usa l’API nativa dove concessa; in alternativa estende il
  lettore nella stessa pagina. Nessuna scheda nuova. Esc e pulsante di uscita,
  focus contenuto nel lettore esteso e ripristino dello scorrimento all’uscita.
- Download diretto del file originale, senza conversioni.
- Errore di apertura/pagina con messaggio leggibile, Riprova e download.
- Con lo zoom su mobile, scorre il foglio dentro il lettore; il sito conserva
  la larghezza della finestra. PageUp/PageDown funzionano quando il piano
  di lettura ha il focus e non interferiscono con i campi.
- Il PDF rimane con i suoi colori originali. Non sono ancora presenti ricerca
  in tutte le pagine, annotazioni personali o modalità libro a doppia pagina.

Nessuna nuova dipendenza: pdfjs-dist 6.4.299 era già installato. Gli script
predev e prebuild copiano worker, font, CMap, WASM e licenze dal pacchetto
installato in public/vendor/pdfjs/<versione>. Directory generata e ignorata
in Git ed ESLint; non richiede CDN o servizi esterni. Il browser usa lo stesso
numero di versione del modulo, evitando di mescolare worker e libreria.
La verifica su file reale comprende anche i font LaTeX incorporati.

Riferimenti ufficiali:
- https://mozilla.github.io/pdf.js/examples/
- https://mozilla.github.io/pdf.js/getting_started/
- Tipi della versione installata: node_modules/pdfjs-dist/types/src/display.
  Per API rimosse o cambiate, i tipi installati prevalgono sugli esempi storici.
- Licenza Apache-2.0: node_modules/pdfjs-dist/LICENSE, copiata con le risorse.

## Continuità e accessibilità

Header e footer condivisi; cambio pagina mediante Link/Router di Next.
PageSurface accompagna il nuovo percorso con una breve entrata di 180 ms,
senza attendere un'animazione prima di navigare.
Il movimento della cornice non conserva una trasformazione al termine, così
non vincola il posizionamento del lettore a schermo intero. Il cambio percorso rimonta
il contenuto: i quiz rapidi non acquisiscono salvataggio automatico; la ripresa
dell'allenamento conserva il comportamento precedente basato sul browser.

Schede e angoli dei fogli reagiscono leggermente al passaggio del mouse.
Le animazioni sono condizionate a prefers-reduced-motion: no-preference.
Focus da tastiera, ruoli combobox/listbox e focus sul titolo dopo la scelta di
uno strumento sono implementati. Nessuna certificazione di accessibilità.

Il campo password ha un pulsante Mostra/Nascondi; conserva il valore digitato
durante il cambio di visibilità. Il dialogo smonta il modulo quando viene chiuso:
alla riapertura il campo riparte nascosto. Autocomplete e invio restano presenti.

## Applicazione in PowerShell

Chiudere il server con Ctrl+C. Salvare aula-interfaccia-v4.zip in Download.

~~~powershell
Set-Location "$env:USERPROFILE\Projects\aula-platform"
$cartellaAula = "$env:USERPROFILE\Downloads\aula-interfaccia-v4"
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\aula-interfaccia-v4.zip" -DestinationPath $cartellaAula -Force
Copy-Item -Path "$cartellaAula\update\*" -Destination . -Recurse -Force -ErrorAction Stop
if (Test-Path -LiteralPath ".next") {
    Remove-Item -LiteralPath ".next" -Recurse -Force -ErrorAction Stop
}
npm.cmd run dev
~~~

Il pacchetto è cumulativo dal checkpoint feat/shared-study d069225 e comprende
anche mappe/podcast, allenamento e la prima interfaccia. Applicarlo nel progetto
esistente sul ramo di lavoro. Sono esclusi PDF, banche didattiche, bozze,
credenziali, .aula e node_modules. Non sono richieste nuove dipendenze,
migrazioni o modifiche alle variabili d'ambiente.

Aprire http://127.0.0.1:3000.

## Prova richiesta sul portatile

1. Homepage: titolo centrato, tema scuro e contributo visibile.
2. Scrivere Ma: suggerimento Machine Learning; provarlo con freccia giù e Invio.
3. Scrivere m e Invio senza selezionare: catalogo con le due corrispondenze
   attuali. Scrivere un nome inesistente: messaggio chiaro, nessun errore.
4. Proponi materiale: accesso reale, mostra/nascondi password, chiusura e
   riapertura; controllare che la password torni nascosta.
5. Leggi gli appunti: lettore interno, pagina 6, zoom, indice e un rimando.
   Schermo intero deve restare nella stessa pagina; uscire con Esc.
   Scarica PDF deve fornire il file originale.
6. Materia: mascotte grande, saluto al passaggio del mouse o con Tab. Click
   apre lo spazio di studio. In /redazione espandere la demo della scelta
   strumenti e cliccare la mascotte: zaino, pulsanti illustrati e accessori.
   Studio: contenuti realmente pubblicati oppure demo tecnica in /redazione.
   Le materie senza banche approvate continuano a mostrare In preparazione.
7. Finestra stretta e tastiera; verificare che il passaggio fra le pagine sia
   rapido e che nessuna decorazione copra testi o comandi.

Al checkpoint, dopo il feedback:

~~~powershell
npm.cmd run check
git diff --check
~~~

Il commit può riunire questi incrementi dopo la prova. Non avviare generazioni
Cloudflare per verificare l'interfaccia.

## Verifiche precedenti (v2)

- npm run check riuscito: 85 test Node, lint, TypeScript e build.
- Nove prove nuove per ricerca, destinazioni, normalizzazione e disponibilità
  degli strumenti; casi sintetici confinati ai test.
- Browser: rendering dei componenti reali con CSS compilato, in un ambiente QA
  separato. Provati suggerimenti da tastiera, ricerca senza corrispondenze,
  destinazioni, apertura/chiusura dialogo, campo password, scelta attività,
  flashcard, avanzamento quiz, allenamento con correzione e mappa grafo/elenco.
- Tono WAV tecnico di tre secondi caricato e riprodotto; cambio velocità a 1.5x.
  Non è una lezione generata.
- Viste dei componenti a 320 px per homepage, suggerimenti e allenamento,
  senza overflow orizzontale nei casi osservati.
- Campione di 27 testi dell'allenamento: nessuna insufficienza rilevata dal
  controllo del contrasto sui colori calcolati. Non è un audit completo.
- Limite: il preview gestito non avvia il server Next originale, perché aggiunge
  opzioni CLI Vite. Il QA usa componenti/rendering reali, ma sostituisce gli
  adattatori Link/Router/Image e non contatta Supabase. Non verifica l'intero
  App Router, l'ottimizzazione immagini, l'autenticazione o gli upload remoti.
  Queste integrazioni rimangono da provare nel progetto sul portatile.
- Fixture e infrastruttura QA sono esterne al repository e non sono nel pacchetto.
  Nessuna nuova banca pubblicata e nessuna richiesta didattica a Cloudflare.

## Verifica dell’incremento v3

- Ripetuti lint e build dopo gli ultimi ritocchi: riusciti. La verifica completa
  precedente dello stesso blocco comprende 85 test Node riusciti.
- Nel QA separato con componenti reali: ingresso attivato con Invio, espressione
  felice e animazione del braccio rilevate al focus, apertura del selettore con
  focus sul titolo, cambio attività e ritorno. Flashcard avviata e risposta
  rivelata, quiz e allenamento aperti; mappa e lettore audio raggiunti.
- Audio tecnico di tre secondi riprodotto, velocità 1.5x e nessun errore media.
  Il tono e la mappa sintetica restano esterni al repository.
- A 320 px menu e quiz osservati senza overflow orizzontale. Il fallback per
  movimento ridotto è predisposto via CSS; non è stato cambiato il sistema
  operativo del browser per verificarne l’impostazione.
- Il limite del QA rimane quello indicato sopra: App Router e servizi remoti
  richiedono la prova locale, non sono dichiarati verificati da questo harness.

## Verifica dell’incremento v4

- npm run check completo riuscito: 89 test Node, lint, TypeScript e build.
- Quattro nuove prove sui confini delle pagine, hash, protocolli dei link e
  limite dei pixel per il rendering; nessuna chiamata AI reale.
- QA su componenti e CSS correnti, worker e due PDF reali: ML 60 pagine,
  PDMIU 50 pagine. Pagina da hash, salto a pagina 6, zoom 150%, indice e
  rimando a Ottimizzazione locale (pagina 16), testo e formule osservati.
- Cornice estesa della stessa pagina verificata: posizione superiore zero,
  chiusura con Esc. Nel browser QA l’API nativa non è stata concessa:
  è stata verificata l’alternativa nella pagina, non la modalità nativa.
- Download PDMIU: 577392 byte, SHA-256 uguale al file originale.
- Reader a 320 px: nessun overflow della pagina nei casi osservati; il foglio
  al 200% scorre solo nel suo contenitore. Errore su file assente e Riprova
  provati in una route di test esterna al repository.
- Materia: ingresso osservato fra circa 403 e 616 px dall’alto nella viewport
  desktop di QA. Non equivale a un controllo su ogni dimensione di portatile.
- Dialogo contributi: animazione di apertura ed Esc provati. Sequenza zaino,
  tre quaderni, ingressi sfalsati e apertura del libro quiz presenti nel QA.
- Rimangono i limiti degli adattatori Next del QA: la build originale passa,
  ma App Router e autenticazione/upload remoti vanno provati sul portatile.
  Non è una certificazione di accessibilità o un test su dispositivi fisici.
- Una ricostruzione pulita di .next ha eliminato CSS precedenti osservati nel
  controllo. La procedura sopra elimina solo questa directory generata.
- Nessun push/deploy automatico; pacchetto cumulativo dal checkpoint d069225.

## Dove intervenire in seguito

- src/components/pdf-reader.tsx e src/app/reader.css: lettore PDF.
- scripts/prepare-pdf-viewer.mjs: risorse del worker e licenze.
- src/app/interface-details.css: archivio, sfondo e disposizione compatta.
- src/app/globals.css: colori e cornice; src/app/mascot.css: scena e movimenti.
- src/components/animated-mascot.tsx: parti del personaggio e accessori.
- src/components/study-entrance.tsx e study-object.tsx: ingresso e oggetti.
- src/components/brand-illustration.tsx e public/brand: pose decorative.
- src/components/subject-search.tsx e src/lib/catalog/subject-search.ts: ricerca.
- src/components/study-modes.tsx e src/lib/study/modes.ts: selezione strumenti.
- src/components/password-field.tsx: visibilità password.
- src/content/site.json e subjects.json: identità testuale e catalogo.

Riferimento per il comportamento della combobox:
https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
