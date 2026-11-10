# Generazione web da PDF — incremento completo

> Guida storica, superata dal flusso di [studio condiviso e redazione](STUDIO_CONDIVISO.md).
> La generazione personale da Contribuisci è disabilitata. Per lavorare sul
> progetto seguire la guida corrente, senza riattivare questa API.

Aggiornamento del 9 novembre: questa guida descrive la raccolta iniziale.
Per indicizzare il documento e generare altre raccolte sulle sezioni scelte,
vedere [STUDIO_PER_SEZIONI.md](STUDIO_PER_SEZIONI.md).

Obiettivo: dal caricamento in Contribuisci partono estrazione e generazione sul
server; flashcard e quiz vengono conservati nel database e riaperti dal sito.
Il codice del generatore è comune a tutti gli insegnamenti e condiviso con il CLI.
Non ci sono domande scritte a mano o moduli AI specifici per materia.

## Risultato e perimetro

- Nuovi upload: il salvataggio del PDF avvia la richiesta di generazione.
- PDF già presenti: pulsante Genera strumenti di studio, senza ricaricarli.
- Risposta rapida dell'API e lavoro dopo la risposta tramite Next `after`.
- Stato nel database; cambiando pagina e tornando si recuperano i risultati.
- Sei flashcard e quattro quesiti, con spiegazioni e citazioni apribili sul PDF.
- Riutilizzo dei risultati correnti: aprirli o richiederli di nuovo non rigenera.
- File e attività restano privati al proprietario abilitato, come gli upload.
- Il generatore legge al massimo quattro pagine selezionate fra le prime venti.
  NON è ancora una copertura completa del documento né una simulazione d'esame.
- Nessun nuovo modello, addestramento, fornitore o servizio a pagamento richiesto.
- Il catalogo pubblico statico e gli eventuali JSON locali non vengono riscritti.

## 1. Preparare il ramo e applicare il pacchetto

Sul portatile, PowerShell nella directory del progetto. Fermare dev con Ctrl+C.
La precedente anteprima upload sul ramo feat/study-generation è stata confermata
funzionante dall'utente. Se non è già stata integrata in master, un comando alla
volta e fermandosi al primo errore:

```powershell
Set-Location "$env:USERPROFILE\Projects\aula-platform"
git switch master
git pull --ff-only origin master
git merge --ff-only feat/study-generation
git push origin master
git switch -c feat/web-study-generation
```

Se sei già sul ramo feat/web-study-generation, non ricrearlo. Se è comparso un
conflitto o un rifiuto, inviare l'output prima di usare reset/force/altre strategie.
La promozione precedente richiede le due variabili pubblicabili Supabase anche
nell'ambiente Production di Vercel, già descritte in CARICAMENTO_WEB.md.

Estrarre il nuovo ZIP e copiare il contenuto di `update` dentro
`C:\Users\franc\Projects\aula-platform`, confermando le sostituzioni. Il pacchetto
parte dal codice upload corretto del ramo pubblicato, non dal vecchio MVP iniziale.
Non contiene credenziali, PDF o raccolte didattiche generate.

## 2. Applicare la sola nuova migrazione SQL

Aprire https://supabase.com/dashboard e il progetto Aula già esistente.
Aprire SQL Editor → New query. In PowerShell copiare il nuovo file:

```powershell
Get-Content -Raw -Encoding UTF8 -LiteralPath ".\supabase\migrations\202611020001_web_study.sql" | Set-Clipboard
```

Incollare nel SQL Editor e premere Run. Atteso: nessun errore. Eseguire questa
migrazione una sola volta; non rieseguire quella del 30 ottobre. La nuova
migrazione è in transazione e non sostituisce le tabelle o i file già caricati.

Nel Table Editor devono comparire:
- `aula_study_jobs`: elaborazioni e risultati.
- `aula_study_latest`: vista degli stati più recenti, per documento e procedura.

Le funzioni di avvio/conferma sono riservate al server. RLS permette agli utenti
abilitati soltanto di leggere le proprie elaborazioni. Non aggiungere policy
che permettano di scrivere direttamente risultati dal browser.

## 3. Configurare una chiave server Supabase

Nel progetto Supabase aprire Project Settings → API Keys e individuare la sezione
Secret keys. Copiare una chiave `sb_secret_...` oppure crearne una dedicata al
backend Aula. Non confonderla con la publishable key già usata dal browser.

In PowerShell:

```powershell
code .env.local
```

Aggiungere al file esistente, conservando tutte le altre righe:

```dotenv
SUPABASE_SECRET_KEY=sb_secret_LA_CHIAVE_SERVER_DEL_PROGETTO
```

Nel file devono essere già presenti le quattro variabili usate nei precedenti
incrementi (con i loro valori reali):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://IL_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_LA_CHIAVE_PUBBLICA
CLOUDFLARE_ACCOUNT_ID=IL_TUO_ACCOUNT_ID
CLOUDFLARE_API_TOKEN=IL_TUO_TOKEN_WORKERS_AI
```

Non incollare questi segnaposto sopra i valori esistenti. Non usare il prefisso
NEXT_PUBLIC per la nuova chiave o le credenziali Cloudflare. Non inviare il file
.env.local in chat o su GitHub. La secret key bypassa RLS: il server verifica
sessione, abilitazione e proprietà del PDF prima di usarla per l'elaborazione.
Non vengono richieste password del database o dell'utente al generatore.

Questa configurazione è unica per il progetto e non va ripetuta per materia.

## 4. Installare, verificare e avviare

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run dev
```

Un comando alla volta. `check` comprende lint, 22 test studio esistenti, 10 test
upload, 7 test della generazione web e build. Si ferma al primo errore.
I test usano risposte AI simulate e non consumano il tuo account Cloudflare.
La build non genera contenuti. PDF.js mantiene la versione già usata, ma ora è
una dipendenza applicativa perché serve anche sul server. Nessun programma
globale aggiuntivo da installare.

Aprire http://localhost:3000/contribuisci e accedere con l'account Aula esistente.

## 5. Una sola prova funzionale completa

1. Per un PDF già caricato premere Genera strumenti di studio. Per un nuovo PDF,
   selezionare materia/titolo/autore/file e salvarlo: l'avvio è automatico.
2. Attendere Generazione in corso. Solo questo passaggio invia a Cloudflare il
   testo selezionato, dichiarato anche nell'interfaccia.
3. Cambiare pagina e tornare in Contribuisci: lo stato viene riletto dal database.
4. Quando è pronto, premere Apri strumenti di studio.
5. Provare Mostra risposta, le citazioni, il collegamento al PDF originale, le
   domande del quiz e la correzione. Le attività sono dichiarate generate con AI
   e non revisionate disciplinarmente; la presenza di citazioni non ne certifica
   la correttezza. Valutare il contenuto effettivo prodotto.
6. Ricaricare e riaprire: il risultato deve essere lo stesso, senza nuove chiamate
   al modello. I risultati sono nel backend e non in un nuovo JSON sul portatile.
7. Provare anche l'altra materia per verificare il flusso comune.

Durante la prova locale mantenere attivo `npm run dev`: il server è il portatile.
Dopo il deployment il server è Vercel e la lavorazione non richiede il PC acceso.
Attendere che l'avvio sia accettato prima di chiudere il browser: chiudendo durante
l'invio del PDF o prima dell'avvio può restare un file da elaborare col pulsante.

### Tempi, quote e recupero

Il percorso server ha un massimo di 300 secondi, compatibile con Vercel Hobby
con Fluid compute (abilitato di default secondo la documentazione consultata).
Verificare nelle impostazioni Functions del progetto che Fluid compute sia
attivo, soprattutto se era stato disabilitato manualmente. Non occorre un upgrade
Pro. Per generazioni più lunghe serve in futuro un sistema di job durabile.

Non sono implementati retry infiniti: massimo due risposte per formato/citazioni
non validi; un errore API/rete non avvia un altro tentativo automatico. Dopo sei
minuti un job rimasto in lavorazione diventa riprovabile dall'interfaccia.
`after` estende la richiesta dopo la risposta, ma non è una coda durabile:
un riavvio/crash può interromperla. Il record permette di rilevare e riprovare
l'interruzione. I job scaduti vengono chiusi prima di un nuovo tentativo.

Sono ammesse cinque nuove elaborazioni nelle ultime 24 ore per account. I retry
contano; aprire o richiedere una raccolta già pronta non conta. Questo limite
protegge la quota del prototipo. Anche la quota Cloudflare può fermare una
richiesta. Il messaggio riporta il problema senza mostrare chiavi o output grezzi.

Il polling aggiorna i job attivi ogni quattro secondi mentre la pagina è visibile,
senza sovrapporre richieste. Si ferma a completamento o scadenza. I risultati
restano nel database anche con pagina chiusa; la chiusura di dev in locale invece
interrompe il server locale. Nessun cron o processo del PC è richiesto su Vercel.

## 6. Salvataggio e anteprima del nuovo incremento

Dopo la prova reale riuscita, fermare dev e nella directory del progetto:

```powershell
git add -- . ':(exclude)src/content/study-kits/*.json' ':(exclude)scripts/check-ai.mjs'
git diff --cached --check
git diff --cached --name-only -- .env.local "src/content/study-kits/*.json"
```

L'ultimo comando deve produrre output vuoto. Poi:

```powershell
git commit -m "feat: generate persistent study activities from web uploads"
git push -u origin feat/web-study-generation
```

Su https://vercel.com/dashboard → progetto Aula → Settings → Environment Variables,
aggiungere per Preview e Production:

| Nome | Valore |
| --- | --- |
| SUPABASE_SECRET_KEY | Stessa chiave server della configurazione locale |
| CLOUDFLARE_ACCOUNT_ID | Account Workers AI già usato dal CLI |
| CLOUDFLARE_API_TOKEN | Token Workers AI già usato dal CLI |

Mantenere anche le due variabili NEXT_PUBLIC_SUPABASE già presenti. Applicare le
variabili prima della build o eseguire Redeploy dopo il salvataggio. Queste tre
nuove variabili sono server-only, senza prefisso NEXT_PUBLIC.

Attendere Ready sull'anteprima del nuovo ramo, poi ripetere il percorso
caricamento → generazione → strumenti → ricaricamento. Quando avviata online,
la lavorazione può continuare anche chiudendo il browser sul portatile. Controllare
il risultato dall'anteprima in seguito. La prova sul servizio ospitato resta
necessaria: l'ambiente di sviluppo non dispone delle credenziali dell'utente.

Promuovere il ramo in master soltanto dopo questa prova:

```powershell
git switch master
git pull --ff-only origin master
git merge --ff-only feat/web-study-generation
git push origin master
```

Se il fast-forward non riesce, fermarsi e inviare l'output. Dopo Ready verificare
https://aula-platform-phi.vercel.app/contribuisci con lo stesso percorso. Il piano
Free Supabase mantiene il limite di sospensione dopo una settimana di inattività.

## Errori principali

| Stato | Azione |
| --- | --- |
| Generazione non ancora attiva | Verificare tutte e cinque le variabili, salvare, riavviare dev oppure rifare la build Vercel. |
| Impossibile leggere elaborazioni | Verificare l'esito della nuova migrazione nello stesso progetto Supabase delle variabili. |
| File non corrispondente | Il server ha confrontato dimensione, intestazione e SHA-256; eliminare il contributo di prova e ricaricare l'originale. |
| Testo insufficiente / scansione | Serve un PDF testuale sufficientemente lungo; OCR non ancora implementato. |
| Limite 5 elaborazioni | Riutilizzare raccolte pronte o attendere che scada la finestra di 24 ore. |
| Quota Cloudflare | Attendere la disponibilità del provider; nessun upgrade automatico. |
| Risposte rifiutate | Formato, citazioni o leggibilità non hanno superato i controlli; riprovare consuma un nuovo tentativo della quota. |
| Elaborazione interrotta | Dopo sei minuti usare Riprova generazione. Controllare log Vercel se il problema si ripete. |

Quando riporti un errore, invia messaggio e operazione, senza credenziali o header
Authorization. Nei log applicativi i fallimenti riportano ID job e codice
controllato, non testo sorgente, token o risposte grezze del modello.

## Architettura e verifica del pacchetto

- API POST /api/studio/genera: token verificato con Auth, ruolo collaboratore e
  proprietà verificate con client utente/RLS; ID proprietario ricavato dall'identità.
- La chiave server usa un client separato, senza sessione utente o cache globale.
- Claim atomico nel database: riuso, job attivi, quota e scadenza. Utenti senza
  privilegi server non possono chiamare claim/finish o scrivere risultati.
- Verifica server di firma, dimensione e SHA-256 del PDF prima dell'AI.
- Riutilizzo di PDF.js, prompt, controlli e contratto StudyKit esistenti, senza
  implementazioni separate per materia. Il CLI resta compatibile.
- Risultati salvati solo dopo i controlli; la SQL finale ricontrolla proprietario,
  versione e impronta. Un job vecchio non sovrascrive un risultato successivo.
- Revoca collaboratore impedisce letture e nuova generazione; una revoca prima
  del salvataggio impedisce di conservare nuove attività per quell'account.
- Eliminare un upload elimina anche i job e i risultati associati tramite FK.
- Il browser apre il PDF tramite download autenticato e URL blob temporaneo;
  il bucket non viene reso pubblico e non si salvano URL firmati permanenti.

Verifiche: 39 test Node; 12 verifiche SQL in PGlite con fixture Auth/Storage;
prove HTTP/browser con server Next reale, after reale, PDF reale e risposte
Supabase/Cloudflare simulate. Nessuna generazione reale è stata eseguita qui con
l'account dell'utente. Le verifiche automatiche non attestano correttezza disciplinare.

Fonti ufficiali consultate il 2 novembre 2026:
- https://nextjs.org/docs/app/api-reference/functions/after
- https://vercel.com/docs/functions/configuring-functions/duration
- https://supabase.com/docs/guides/api/api-keys

### Audit dipendenze — 2 novembre 2026

L’audit completo segnala 16 voci moderate propagate dalla stessa advisory
GHSA-g3hv-75wg-m249 di minimatch nella catena ESLint, già presente nel lockfile.
L’audit delle sole dipendenze runtime (`npm audit --omit=dev`) riporta zero
vulnerabilità note. Questo incremento non cambia versioni delle dipendenze.
Il problema riguarda amplificazione di pattern glob controllati da un attaccante;
gli strumenti lint del progetto usano configurazione e percorsi del repository.
Una correzione della catena degli strumenti di sviluppo va gestita e verificata
separatamente. Non eseguire `npm audit fix --force`: l’output propone anche
downgrade incompatibili di ESLint/config, non una correzione mirata per il progetto.
Fonte primaria: https://github.com/advisories/GHSA-g3hv-75wg-m249
