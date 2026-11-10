# Allenamento in modalità esame

Da applicare dopo aula-mappe-podcast-v1, già provato sul portatile. Questo
incremento usa la banca approvata esistente e aggiunge sessioni di allenamento,
non nuove domande generate o regole attribuite al docente.

## Cosa funziona

- Quantità di domande scelta entro quelle disponibili nella selezione corrente.
- Tutti gli argomenti oppure il macroargomento scelto nella pagina di studio.
- Tempo massimo configurabile, oppure sessione senza limite.
- Risposte modificabili, navigazione avanti/indietro e salto alle non risposte.
- Ripresa nello stesso browser, con domande estratte, posizione e risposte
  conservate. La scadenza non riparte ricaricando la pagina.
- Correzione finale: corrette, errate, non risposte e riepilogo per argomento.
- Ripasso mirato degli errori e delle non risposte. Una risposta corretta in
  una sessione successiva rimuove quella domanda dalla lista da ripassare.
- Ultimo risultato e cronologia delle ultime dieci sessioni.
- Azzeramento dei dati della banca corrente con conferma.

Il quiz rapido e le flashcard precedenti rimangono disponibili. L'allenamento
non chiama modelli, non richiede account e non invia risposte al server.
È un'autovalutazione sulle domande pubblicate: quantità, difficoltà e durata
non attestano copertura dell'esame o equivalenza con la prova del docente.

## Applicazione e un'unica prova del blocco

Aprire PowerShell e fermare dev con Ctrl+C, se in esecuzione. Si può continuare
sullo stesso ramo feat/learning-tools, conservando le modifiche di mappe e audio.

```powershell
Set-Location "$env:USERPROFILE\Projects\aula-platform"
explorer.exe .
```

Estrarre lo ZIP, copiare il contenuto di update nella directory aperta e
confermare le sostituzioni. Nessuna nuova dipendenza, migrazione o variabile.

```powershell
npm.cmd run dev
```

Aprire http://127.0.0.1:3000/redazione. Usare il collegamento **Allenamento** in
alto e premere **Prova l’allenamento dimostrativo**. Sono otto domande tecniche sull'uso dell'interfaccia;
non vengono pubblicate come domande di una materia e hanno dati locali separati.

1. Scegliere tre domande e cinque minuti, poi Avvia allenamento.
2. Rispondere a due domande, sbagliandone deliberatamente una per provare il
   ripasso; lasciare la terza senza risposta.
3. Ricaricare la pagina, riaprire la demo e premere Riprendi la sessione:
   domande, risposte e posizione devono essere conservate. Il timer continua.
4. Termina e correggi: controllare i tre conteggi, il riepilogo per argomento e
   le spiegazioni. Il ripasso mirato usa solo gli errori e le non risposte.
5. Tornare alle impostazioni e consultare Ultime sessioni su questo browser.

Nelle materie reali il pulsante Allenamento in modalità esame si trova accanto
al quiz e alle flashcard, quando è presente una banca pubblicata. Le fonti del
risultato rimandano al PDF corretto. La demo tecnica non mostra collegamenti a
PDF inventati; nel catalogo pubblico non vengono aggiunti contenuti dimostrativi.

Fermare dev ed eseguire una sola verifica completa dell'incremento:

```powershell
npm.cmd run check
git diff --check
```

## Persistenza e timer

I dati sono in localStorage, separati per sito/origine, materia e versione delle
domande. Localhost, 127.0.0.1 e il dominio Vercel hanno archivi distinti. Non
passano da GitHub, non vengono sincronizzati fra computer o profili e possono
essere cancellati dal browser; in incognito la conservazione è temporanea.

Fonte o domande diverse usano una versione distinta: i risultati precedenti non
vengono attribuiti automaticamente alla nuova banca. Una ripubblicazione con
contenuti identici conserva la versione locale. La cronologia mostra al massimo
dieci sessioni della banca corrente; l'ultimo risultato mantiene le spiegazioni.

Il tempo è basato sull'istante di scadenza memorizzato, non sul numero di tick.
Se la scheda è sospesa o chiusa, alla riapertura viene rilevata l'eventuale
scadenza e la correzione usa le risposte già salvate. Una richiesta di risposta
arrivata dopo la scadenza non aggiorna il risultato. Si usa l'orologio del
computer: il sistema è destinato all'allenamento personale.

Storage non disponibile o pieno: messaggio esplicito e possibilità di continuare
in memoria nell'allenamento aperto. Dati corrotti o incompatibili non sono
eseguiti e non bloccano una nuova sessione. Quiz rapido e flashcard non sono
inclusi in questa nuova persistenza.

## Organizzazione del codice

- src/lib/study/practice.ts: selezione, validazione, correzione e transizioni.
- src/lib/study/practice-store.ts: salvataggio locale e aggiornamenti browser.
- src/components/exam-practice.tsx: interfaccia comune a tutte le materie.
- src/lib/study/practice-demo.ts e PracticeDemo: dati tecnici e accesso locale.
- scripts/practice/practice.test.mts: prove su timer, ripresa, risultati e dati.

Nessun modello specifico per materia o domanda reale scritta nel componente.
La simulazione dello stile del docente richiederà esempi e criteri effettivi.
La generazione dei contenuti rimane separata da questo incremento.

## Salvataggio al checkpoint

Quando si decide di salvare il blocco corrente (mappe/audio e allenamento):

```powershell
git add -- src scripts docs public README.md next.config.ts package.json ':(exclude)src/content/study-kits/*.json' ':(exclude)scripts/check-ai.mjs'
git --no-pager diff --cached --stat
git commit -m "feat: add learning tools and timed practice sessions"
git push -u origin feat/learning-tools
```

Controllare l'elenco dei file prima del commit. Le esclusioni sono quelle già
concordate per diagnostica e vecchie raccolte non revisionate. La pubblicazione
sul dominio principale resta il checkpoint di rilascio dell'intero incremento.
