# Studio automatico — primo incremento

Obiettivo: verificare che una procedura comune generi attivita dalle fonti di
materie diverse, senza scrivere domande o prompt specifici per ogni materia.

## Stato e perimetro

La prima prova prepara sei flashcard e quattro quesiti a risposta singola per
ciascun PDF presente in `src/content/resources.json`. Seleziona al massimo
quattro pagine di contenuto tra le prime venti, con esclusione euristica delle
pagine di indice e dei testi troppo brevi. La copertura e mostrata nel sito con
i numeri fisici delle pagine del PDF; non equivale a coprire tutto il corso.

La selezione iniziale automatica limita il consumo della quota e serve a
verificare estrazione e qualita. La suddivisione completa per argomenti verra
affrontata dopo questa prova.

Il collegamento al servizio AI e stato provato dall'utente. I nuovi output
didattici reali devono ancora essere verificati sul suo account. I test di
sviluppo usano risposte simulate, mai spacciate per contenuti didattici reali.

La generazione avviene per ora da terminale. Il lettore nel sito e gia
interattivo. Upload web, archivio remoto ed elaborazione dopo un caricamento
sono il prossimo collegamento da costruire, non funzionalita gia presenti.

## Configurazione unica

Requisito: Node.js 24 LTS. `package.json` dichiara moduli ESM; gli script `.mts`
usano il supporto TypeScript di Node, senza un altro compilatore da installare.
L'opzione TypeScript `allowImportingTsExtensions` permette di condividere i
controlli del formato con l'applicazione, mantenendo `noEmit`.

Nella radice del progetto, accanto a `package.json`, il file `.env.local` deve
contenere i due valori gia usati per la prova di connessione:

```dotenv
CLOUDFLARE_ACCOUNT_ID=il_tuo_account_id
CLOUDFLARE_API_TOKEN=il_tuo_token
```

Non creare copie di questi valori nei sorgenti, nei JSON generati o in
variabili `NEXT_PUBLIC_`. Il `.gitignore` esclude gia `.env*`. Verificare:

```powershell
git check-ignore .env.local
```

Deve stampare `.env.local`. Non serve configurare questi valori su Vercel:
questo incremento pubblica soltanto risultati gia preparati.

## Preparazione sul portatile

Aprire PowerShell nella directory del progetto. Fermare `npm run dev` con
Ctrl+C prima di aggiornare i file e installare le dipendenze.
Eseguire un comando alla volta e fermarsi al primo errore:

```powershell
Set-Location "$env:USERPROFILE\Projects\aula-platform"
npm.cmd ci
npm.cmd run study:test
npm.cmd run study:generate -- --dry-run
```

L'ultimo comando non chiama il servizio AI e non scrive raccolte. Mostra
materia, pagine selezionate e numero di caratteri. Con i PDF attuali:

- Machine Learning: pagine fisiche 4, 6, 7, 8.
- Dispositivi mobili: pagine fisiche 4, 5, 6, 7.

La dipendenza aggiunta e `pdfjs-dist` 6.4.299 (PDF.js, Apache-2.0), usata per
leggere il testo dei PDF. Non viene caricata nel browser dello studente.

## Generazione effettiva

```powershell
npm.cmd run study:generate
$LASTEXITCODE
```

Il comando invia a Cloudflare i titoli della materia/risorsa e il testo delle
sole pagine selezionate dei PDF da aggiornare. Non invia il file PDF intero.
Il modello della prima prova e `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
La richiesta utilizza JSON Mode e istruzioni comuni per entrambe le materie.

Il testo viene suddiviso dal programma in passaggi identificati (`sourceId`).
Il modello sceglie l'ID pertinente per ciascuna attivita. Pagina e citazione
sono recuperate dal codice dal passaggio corrispondente: non vengono riscritte
dal modello. La segmentazione preferisce i confini di frase quando disponibili,
ma le frasi molto lunghe possono ancora essere suddivise. Gli ID inesistenti sono rifiutati, senza scegliere una fonte di
ripiego e senza confronti approssimativi.

Ogni attivita salvata contiene una pagina e una citazione letterale del testo
fornito. Il programma controlla formato, quantita, duplicati, indice della
soluzione, esistenza della pagina e presenza della citazione. Una citazione
corrispondente non dimostra che domanda, soluzione e spiegazione siano
disciplinarmente corrette: non viene attribuita una revisione umana inesistente.

Un output formalmente non valido permette un solo tentativo aggiuntivo con
l'errore da correggere. Errori HTTP, di rete o JSON illeggibile interrompono
l'esecuzione senza cicli di richieste. Timeout: due minuti per chiamata.
Il primo risultato valido viene salvato subito; se la seconda materia fallisce,
la prima rimane disponibile. Una nuova esecuzione salta i risultati aggiornati.

Output:

```text
src/content/study-kits/appunti-machine-learning.json
src/content/study-kits/appunti-dispositivi-mobili.json
```

Non compilare questi file a mano. La scrittura usa un file temporaneo e una
rinomina nella stessa cartella; errori di generazione non sovrascrivono il
precedente risultato valido.

Impronta del PDF, pagine, metadati della fonte, modello e versione della
procedura determinano il riuso. Quando si modificano istruzioni o selezione,
aggiornare `STUDY_VERSION` in `src/lib/study/schema.ts` se i risultati precedenti
devono essere invalidati. La correzione del protocollo delle citazioni del
28 ottobre mantiene `study-v1`: il formato pubblicato e i controlli finali sono
invariati e le raccolte gia valide vengono conservate. Questa nota descrive
la prima correzione: la successiva revisione didattica usa invece `study-v2`
e richiede la rigenerazione delle raccolte v1.

Per verificare il riuso basta ripetere il comando: deve apparire
`Gia aggiornato: nessuna chiamata AI.` per le raccolte salvate.
`npm.cmd run study:generate -- --force` chiede esplicitamente di rigenerare
anche i risultati aggiornati e consuma nuovamente la quota.

## Revisione didattica v2

La revisione dei primi output reali ha trovato un errore concettuale in un quiz,
formule copiate in forma illeggibile, ripetizione delle domande e citazioni
interrotte prima della definizione. I controlli di formato v1 non bastavano.

La procedura v2 introduce requisiti comuni:

- Fronti delle flashcard formulati come domande esplicite. E una scelta di
  chiarezza per questo generatore, non una dichiarazione che le flashcard
  termine-definizione siano sempre scorrette.
- Quiz diversi dalle flashcard, con istruzioni per includere almeno due brevi
  situazioni applicative e alternative plausibili.
- Rispetto di negazioni, condizioni e generalita delle definizioni; nessuna
  trasformazione di un esempio particolare in una definizione universale.
- Spiegazione coerente con l'alternativa indicata come corretta.
- Risposte con formule in testo lineare leggibile e parole non spezzate dal PDF.
- Scelta di un passaggio che contenga informazioni sufficienti per la risposta.

Il codice controlla i fronti interrogativi, i duplicati esatti fra quiz e
flashcard, i glifi di matrice malformati e alcune parole spezzate. Questi
controlli riguardano forma e leggibilita, non verificano automaticamente la
verita delle risposte, la plausibilita dei distrattori o la pertinenza semantica
delle citazioni. La precisione dei nuovi contenuti va ancora esaminata.
Le citazioni originali sono escluse dalla riscrittura e dai filtri di leggibilita.

`study-v2` modifica l'impronta di generazione: il comando normale prepara di
nuovo entrambe le raccolte v1. Non usare `--force` e non cancellare i JSON.
I file precedenti restano su disco finche non arriva un sostituto valido.
Le pagine del sito escludono le raccolte di versioni precedenti dalla nuova
build. Se la seconda materia fallisce, quella v2 gia salvata viene riutilizzata
alla successiva esecuzione. Il nuovo controllo puo richiedere un secondo
tentativo entro il limite esistente; gli errori persistenti vanno analizzati
tramite il rapporto diagnostico, senza cicli di richieste.

## Verifica nel sito

```powershell
npm.cmd run dev
```

Aprire http://localhost:3000, entrare in una materia e scegliere
**Apri gli strumenti di studio**. Oppure:

- http://localhost:3000/insegnamenti/machine-learning/studio
- http://localhost:3000/insegnamenti/dispositivi-mobili/studio

Verificare in entrambe le materie:

1. Titolo, copertura delle pagine e provenienza della raccolta.
2. Mostra/nascondi risposta; precedente/successiva; ripartenza delle flashcard.
3. Apri la fonte e confronta il passaggio nel PDF. La pagina e fisica, quindi
   puo differire dalla numerazione stampata negli appunti.
4. Scegli tutte le risposte al quiz; correggi; controlla punteggio e spiegazioni.
5. Riprova: risposte e punteggio vengono azzerati.
6. Su finestra stretta e da tastiera i controlli rimangono utilizzabili.

Lo stato del ripasso resta solo in memoria: cambio modalita, ricaricamento o
uscita dalla pagina possono azzerarlo. Non sono simulazioni d'esame certificate.
Senza JavaScript resta disponibile il collegamento al documento originale.
Con una cartella senza JSON il sito mostra uno stato vuoto funzionante.
Un JSON corrotto causa un errore esplicito nella build invece di pubblicare
attivita non valide. Un PDF modificato rende la raccolta precedente obsoleta:
la nuova build la esclude finche non viene rigenerata.

La qualita didattica dei primi output va controllata prima del commit:
domande chiare, una sola soluzione giustificata, distrattori plausibili,
spiegazioni pertinenti, testo e formule leggibili. Non occorre riscrivere tutto
a mano: gli errori emersi servono a correggere estrazione e procedura comune.

## Controlli, commit e pubblicazione

Fermare il server con Ctrl+C, poi:

```powershell
npm.cmd run lint
npm.cmd run study:test
npm.cmd run build
git diff --check
git status --short
```

Aspettare la verifica dei primi output reali prima del commit e del push.
Il file `.env.local` non deve comparire tra i cambiamenti. Dopo la verifica:

```powershell
git add README.md package.json package-lock.json tsconfig.json docs scripts src
git commit -m "feat: generate study quizzes and flashcards from PDF sources"
```

Sul portatile Git potrebbe richiedere l'identita dell'autore al primo commit.
In quel caso impostare `git config user.name "Leonardo Malaventura"` e
`git config user.email "EMAIL_SCELTA_SU_GITHUB"`, sostituendo il segnaposto
con la propria email o quella noreply indicata su https://github.com/settings/emails.
Non inventare un indirizzo e non cambiare l'autore dei commit precedenti.

Se si lavora sul ramo `feat/study-generation`, il sito di produzione non viene
aggiornato finche le modifiche non arrivano su `master`. Push e integrazione
verranno eseguiti dopo il checkpoint di verifica.
Vercel usera i JSON presenti nel commit; nessuna richiesta AI durante la build.
I contenuti generati e pubblicati restano consultabili con il PC spento.
L'esecuzione remota della generazione dopo upload resta da integrare.

## Errori da segnalare

- Token/account mancanti: ricontrollare `.env.local` senza mostrarne il contenuto.
- HTTP 401/403: autorizzazioni o account; usare il token Workers AI del test riuscito.
- HTTP 429 o quota esaurita: controllare Usage in Cloudflare, attendere il ripristino.
- HTTP 5xx/timeout: riprovare una volta piu tardi. Non avviare cicli automatici.
- ID fonte non valido o altro errore di validazione dopo due risposte:
  conservare il log ed evitare rigenerazioni ripetute. Il programma salva
  `.aula/diagnostics/ID_RISORSA.json` con pagine e risposte rifiutate, senza
  credenziali. La cartella `.aula/` e esclusa da Git. Se richiesto, allegare
  soltanto il rapporto relativo alla risorsa fallita per esaminare il dato reale.
- Testo insufficiente: PDF scansionati e fotografie richiedono un percorso OCR
  non ancora implementato. Non vengono generati contenuti sostitutivi.
- File assenti o metadati diversi dal PDF: controllare il catalogo e il file reale.

## Fonti tecniche e licenze

Documentazione verificata il 28 ottobre 2026:

- PDF.js: https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs
- Cloudflare JSON Mode: https://developers.cloudflare.com/workers-ai/features/json-mode/
- Modello: https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/
- Quota: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Trattamento dei dati: https://developers.cloudflare.com/workers-ai/platform/data-usage/
- Licenza Llama: https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/LICENSE

**Built with Llama.** Llama 3.3 usa una licenza propria, non Apache/MIT. Il
progetto usa il servizio ospitato, non distribuisce pesi e mantiene separato
il provider dal formato delle attivita. La licenza di Aula resta da definire.
