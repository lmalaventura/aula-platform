# Studio per sezioni del PDF

> Guida storica. Il flusso corrente è [STUDIO_CONDIVISO.md](STUDIO_CONDIVISO.md):
> attività pubbliche già revisionate, preparazione in blocco dalla redazione e
> contributi separati dalla generazione. Il parser delle sezioni è riutilizzato
> internamente; non è più un comando offerto agli studenti in Contribuisci.

Incremento del 9 novembre 2026. Base verificata su GitHub: `master`, commit
`acfc1e7`, pubblicato in Production e confermato funzionante dall'utente.

## Cosa aggiunge

Accanto al PDF in Contribuisci compare **Studia per sezioni**. Il server esamina
il documento completo entro i limiti indicati sotto, conserva l'indice nel
database privato e mostra le parti disponibili. I titoli provengono dai
segnalibri del PDF: senza segnalibri, le sezioni sono numerate. Parti troppo
brevi vengono raggruppate e parti lunghe suddivise. Non è un riconoscimento
semantico automatico degli argomenti e non è una certificazione didattica.

La ricerca considera titoli e testo delle sezioni. Per la parte scelta,
**Genera attività** prepara sei flashcard e quattro quesiti tramite lo stesso
generatore già usato. Ora il limite sei/quattro vale per ciascuna raccolta,
non per tutto il documento. Il codice è identico per tutti gli insegnamenti.
Le raccolte iniziali esistenti e il generatore CLI continuano a funzionare.

L'indice viene preparato sul server senza chiamare l'AI. Soltanto generando
una raccolta si inviano a Cloudflare le pagine della sezione selezionata.
Risultati, testo estratto e PDF rimangono privati al proprietario abilitato.
Chiudendo la pagina dopo l'avvio, la singola elaborazione prosegue sul server
entro il limite della funzione, come nell'incremento precedente.

Non viene ancora generato automaticamente ogni quiz di ogni sezione dopo
l'upload. La raccolta iniziale continua a partire automaticamente; le altre
si preparano scegliendo la sezione. Una futura elaborazione completa automatica
richiederà un avanzamento persistente tra più lavori, senza una sola richiesta
enorme. Nessuna coda o piattaforma aggiuntiva è introdotta in questo incremento.

## Limiti espliciti

- Upload: massimo 5 MB, come prima.
- Indice: massimo 250 pagine e un milione di caratteri estratti. Il superamento
  blocca l'indicizzazione invece di troncare silenziosamente il documento.
- Le pagine con meno di 300 caratteri normalizzati o riconosciute come indice
  vengono elencate come escluse. Le scansioni richiedono ancora OCR.
- Una sezione contiene al massimo quattro pagine/frammenti e 18.000 caratteri;
  una pagina molto densa può comparire in più sezioni con lo stesso numero
  fisico. Nessun frammento ammesso viene tagliato per rientrare nel prompt.
- Per generare occorrono almeno 1.800 caratteri; eventuali parti finali troppo
  brevi restano visibili nell'indice, con invito a consultare il PDF.
- Cinque nuove generazioni AI per account in 24 ore, comprese quelle iniziali.
  Separatamente, cinque preparazioni di indice. I tentativi falliti contano;
  il riuso di indici/raccolte pronti non consuma nuove elaborazioni.
- Un lavoro attivo per PDF: se una richiesta diversa è in corso, il server lo
  segnala invece di restituire una raccolta riferita a un'altra sezione.
- Citazioni letterali e controlli formali non certificano la correttezza
  disciplinare. Formule, figure e tabelle possono essere estratte male.

## Applicazione su Windows

Aprire PowerShell e VS Code. Fermare dev con Ctrl+C se è in esecuzione.
Eseguire un comando alla volta e fermarsi al primo errore:

```powershell
Set-Location "$env:USERPROFILE\Projects\aula-platform"
git switch master
git pull --ff-only origin master
git switch -c feat/document-sections
```

Se il nuovo ramo esiste già, usare `git switch feat/document-sections` invece
di ricrearlo. Estrarre lo ZIP e copiare il contenuto di `update` dentro la
directory del progetto, confermando le sostituzioni. Nessun file `.env.local`,
PDF o risultato generato è incluso. Nessuna nuova variabile o dipendenza.

## Migrazione compatibile con il sito esistente

Aprire https://supabase.com/dashboard, progetto Aula → SQL Editor → New query.
Copiare la sola nuova migrazione:

```powershell
Get-Content -Raw -Encoding UTF8 -LiteralPath ".\supabase\migrations\202611090001_document_sections.sql" | Set-Clipboard
```

Incollare nel SQL Editor e premere Run. Atteso: nessun errore. Le due vecchie
migrazioni devono essere già applicate; non rieseguirle. Questa migrazione
sostituisce la funzione di prenotazione con la stessa firma e mantiene RLS,
tabelle, file e dati esistenti. Il sito Production precedente rimane compatibile.

```powershell
npm.cmd run check
npm.cmd run dev
```

`check` esegue lint, 47 test Node e build. I test non usano il tuo account AI.
Non serve `npm ci`: non sono cambiate le dipendenze o il lockfile.
Aprire http://localhost:3000/contribuisci e accedere con l'account abituale.

## Verifica pratica completa

1. Sul PDF già salvato, premere Studia per sezioni. Attendere l'indice.
2. Controllare il numero totale delle pagine, le sezioni e le pagine escluse.
3. Cercare un argomento presente verso la fine del documento e scegliere una
   sezione con pagine successive alla ventesima. Le pagine sono indicate.
4. Premere Genera attività. Attendere, quindi Apri attività.
5. Provare flashcard, quiz e citazione sul PDF. Verificare il contenuto: i
   controlli automatici non sostituiscono una revisione della disciplina.
6. Ricaricare la pagina e riaprire Studia per sezioni: la raccolta deve essere
   già pronta e riutilizzabile. Provare anche Apri strumenti di studio per la
   raccolta iniziale, se già presente.

Se l'indice non si aggiorna: Aggiorna sezioni. Se un lavoro è scaduto dopo sei
minuti: Riprova preparazione/attività. Se si raggiunge la quota: usare le
raccolte pronte e attendere che trascorrano 24 ore dai precedenti tentativi.
Un errore di prenotazione dopo l'aggiornamento richiede di verificare prima
l'esecuzione della nuova migrazione, senza aggiungere policy permissive.

## Commit e anteprima, dopo la prova locale

Fermare dev con Ctrl+C. I seguenti percorsi escludono credenziali e raccolte
JSON locali; controllare sempre l'elenco staged prima del commit:

```powershell
git diff --check
git add -- package.json README.md scripts/study/generate.mts scripts/study/document.mts scripts/study/document.test.mts src/components/contributor-panel.tsx src/components/uploaded-study-session.tsx src/components/document-study-panel.tsx src/lib/study/document.ts src/lib/study/web-client.ts src/lib/study/web-core.ts src/lib/study/web-server.ts src/lib/study/web-types.ts supabase/migrations/202611090001_document_sections.sql docs/STUDIO_PER_SEZIONI.md docs/PROJECT_STATUS.md docs/GENERAZIONE_WEB.md
git diff --cached --name-only
git commit -m "feat: index complete PDFs and generate study activities per section"
git push -u origin feat/document-sections
```

Il push crea l'anteprima Vercel del nuovo ramo. Usa le stesse variabili Preview
già configurate. Prima di promuovere in master, ripetere il percorso online.

## Struttura tecnica

- `scripts/study/document.mts`: estrazione completa e suddivisione deterministica.
- `src/lib/study/document.ts`: contratto dell'indice e validazione condivisa.
- `document-study-panel.tsx`: ricerca, avvio, stato e riapertura per sezione.
- API autenticata esistente: modalità legacy, index e section; nessun endpoint
  privilegiato direttamente accessibile dal browser senza verifica dell'account.
- Indici nel risultato JSON della tabella lavori esistente, con versione
  `document-index-v1`; raccolte di sezione con versione derivata dall'ID stabile.
- Stessa verifica server della proprietà, abilitazione e SHA-256 del PDF;
  stessa RLS per leggere indici e raccolte. Eliminare il PDF elimina i lavori.
- Il client trasmette soltanto l'ID della sezione. Le pagine e la versione
  della raccolta vengono determinate sul server dall'indice verificato.

Riferimenti tecnici: documentazione `after` inclusa nella versione installata
di Next, tipi `getOutline/getDestination/getPageIndex` della versione PDF.js
installata; https://supabase.com/docs/guides/database/postgres/row-level-security.

## Verifiche nell'ambiente di sviluppo

Passati: lint, build, 47 test Node; 12 prove SQL sul motore PGlite/Postgres
con fixture Auth/Storage; nove verifiche HTTP/browser del flusso con server
Next e parser PDF reali, servizi Supabase/Cloudflare simulati. Sei stati
esaminati con axe senza violazioni; non è una certificazione di accessibilità.
Provati riapertura senza rigenerazione, selezione oltre pagina quaranta,
quiz, fonti private, quote, accesso negato e responsive 320/390/768/1440 px.
Nessuna chiamata reale al provider dell'utente eseguita nell'ambiente di sviluppo.
Audit del 9 novembre: runtime zero vulnerabilità note, otto moderate nella
catena di sviluppo preesistente minimatch/ESLint. Nessuna dipendenza modificata.
