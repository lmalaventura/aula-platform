# Aula: studio condiviso e redazione

Questo è il flusso corrente. Sostituisce la generazione personale da Contribuisci.

## Il prodotto

Lo studente apre l'insegnamento, legge gli appunti condivisi e sceglie quiz o
flashcard su tutti gli argomenti disponibili o su un macroargomento. Le attività
sono già preparate e revisionate: studiare non richiede accesso e non interroga
l'AI. Il numero di domande dipende dalla banca pubblicata, senza un limite fisso
per corso. Il quiz mostra una domanda alla volta; dagli errori si può ripartire
sull'argomento corrispondente.

Ogni insegnamento ha una sola fonte principale configurata per gli appunti.
Prove d'esame, esercitazioni e progetti restano categorie di materiali distinte;
non devono essere forzati dentro il PDF di teoria. Il software e il generatore
sono comuni a tutte le materie; cambiano soltanto dati, fonte e contenuti.

Il pulsante + Proponi materiale apre il modulo in un dialogo. I contributi sono
proposte private in attesa di revisione; non creano nuove dispense pubbliche e
non avviano l'AI. La redazione può scaricarli, chiedere modifiche, non accoglierli
o accettarli per l'integrazione. L'autore vede l'esito e il messaggio ricevuto.

Accettare per integrazione non modifica da solo il documento comune. La fusione
corretta nel LaTeX/PDF è ancora un intervento editoriale esplicito. Non esistono
in questo incremento una fusione semantica automatica, un antivirus o una
revisione disciplinare automatica. Firma PDF, dimensione, MIME e impronta non
certificano la sicurezza del contenuto. I file restano in quarantena privata.

Lo studio pubblico non richiede account. L'invio conserva per ora gli account
collaboratori già abilitati: una whitelist senza identità verificabile non è
una whitelist. L'upload anonimo aperto a tutti rimane un incremento distinto.

## Architettura essenziale

| Parte | Dati e responsabilità |
| --- | --- |
| Fonte comune | PDF in public/materials; risorsa del catalogo assegnata in study-sources.json |
| Preparazione | Comando editoriale generico; estrazione completa, cache per contenuto, generazione AI a blocchi |
| Bozze e revisioni | .aula/editor, locale e ignorato da Git |
| Redazione | /redazione solo in sviluppo, per rivedere, raggruppare e pubblicare |
| Attività pubblicate | src/content/study-banks, versionate in Git insieme alla fonte |
| Studio | Pagine Next statiche: nessuna chiamata a Cloudflare o Supabase per usare le attività |
| Contributi | Storage privato Supabase e tabella revisioni con RLS per proprietario |

La redazione locale è una scelta iniziale per ridurre servizi e permessi: non
serve implementare subito un CMS remoto. Non significa che il sito dipenda dal
computer acceso: Vercel distribuisce fonte e banca pubblicata. Il CMS online e
il caricamento anonimo potranno essere aggiunti senza cambiare l'interfaccia di
studio o i formati della banca.

## 1. Applicare il nuovo incremento

Aprire PowerShell nella cartella del progetto. Fermare dev con Ctrl+C. Non
scartare le modifiche dello scorso incremento: il nuovo pacchetto le include.

```powershell
Set-Location "$env:USERPROFILE\Projects\aula-platform"
git switch -c feat/shared-study
explorer.exe .
```

Se il ramo esiste già, usare `git switch feat/shared-study`. Estrarre lo ZIP e
copiare il contenuto di update nella directory del progetto. Confermare le
sostituzioni. Il pacchetto non contiene credenziali, PDF, bozze o domande
preconfezionate. Non cambia il lockfile né aggiunge dipendenze applicative.

## 2. Aggiungere lo stato di revisione dei contributi

Aprire https://supabase.com/dashboard → progetto Aula → SQL Editor → New query.
Copiare la sola nuova migrazione:

```powershell
Get-Content -Raw -Encoding UTF8 -LiteralPath ".\supabase\migrations\202611090002_contribution_reviews.sql" | Set-Clipboard
```

Incollare e premere Run. Atteso: nessun errore. Le migrazioni precedenti già
applicate non vanno rieseguite. La nuova tabella non modifica o pubblica gli
upload esistenti. Nessuna nuova variabile d'ambiente.

## 3. Preparare una materia in un solo blocco

La fonte principale è già configurata per Machine Learning e Dispositivi
mobili nei PDF del catalogo. Per il primo avvio basta:

```powershell
npm.cmd run study:prepare -- --subject machine-learning
```

Questo comando esamina il PDF completo entro i limiti di estrazione, ricava i
macroargomenti dai segnalibri principali e prepara le raccolte mancanti. Ogni
blocco usa la stessa procedura di generazione e verifica delle citazioni già
collaudata. Non occorre scrivere domande o codice per la materia.

È un lavoro che può richiedere diversi minuti; il programma mostra l'avanzamento.
Le pagine dei blocchi da generare vengono inviate a Cloudflare. Nessuna chiamata
per le parti identiche già in cache. Al massimo cento nuove raccolte per
invocazione e due risposte del modello per raccolta. Il limite può essere
ridotto, ad esempio `--max-units 10`; `--dry-run` esegue solo l'analisi.

Se si interrompe o Cloudflare esaurisce la quota, i risultati completati sono
conservati. Ripetere lo stesso comando riprende il lavoro. Non viene acquistato
un piano o cambiata la fatturazione. Il piano Free di Workers AI ha una quota
propria; consultare il dashboard del servizio per i consumi. Il vecchio limite
di cinque generazioni per utente del flusso web non limita questa preparazione
editoriale, e lo studio degli studenti non consuma richieste AI.

La preparazione può riutilizzare attività e revisioni precedenti se il testo,
le pagine e la procedura del blocco sono identici. Se cambiano risposte o fonti,
la precedente approvazione non vale per la nuova raccolta. Il risultato di
Cloudflare resta una bozza finché non viene approvato.

Per l'altra materia:

```powershell
npm.cmd run study:prepare -- --subject dispositivi-mobili
```

### Se la preparazione si interrompe prima di creare raccolte

Lint, test e build verificano il software con risposte simulate: non provano
che Cloudflare accetti le credenziali o che rimanga quota sull'account reale.
Il precedente messaggio «Servizio AI non disponibile o quota esaurita» non
permetteva di distinguere la causa. La diagnostica ora mantiene HTTP e codici
numerici, oppure un errore di rete riconosciuto, senza stampare token o risposte
remote grezze. Il solo stato HTTP 429 non prova l'esaurimento della quota.

Per raccogliere l'errore con al massimo una nuova raccolta:

```powershell
npm.cmd run study:prepare -- --subject machine-learning --max-units 1
$LASTEXITCODE
```

Inviare solo il messaggio di errore, non .env.local. Non eliminare la cache e
non cambiare chiavi o piano prima di leggere il codice. Una preparazione
riuscita con questo limite non copre tutto il corso; si riprende poi con il
comando ordinario. La raccolta può richiedere fino a due risposte AI se la prima
non supera le verifiche del contenuto; un errore API non viene riprovato.

Riferimenti Cloudflare verificati il 10 novembre 2026:
- HTTP 429, codice 3036: quota giornaliera gratuita esaurita.
- HTTP 429, codice 3040: capacità temporaneamente insufficiente.
- HTTP 401/403: verificare il codice specifico e autorizzazioni/account; non
  sostituire automaticamente questi errori con «quota esaurita».
- https://developers.cloudflare.com/workers-ai/platform/errors/
- https://developers.cloudflare.com/workers-ai/platform/pricing/

## 4. Rivedere e pubblicare nel progetto

```powershell
npm.cmd run dev
```

Aprire http://127.0.0.1:3000/redazione. Dev ora ascolta soltanto sull'interfaccia
locale. Usare questo comando, senza esporre il server di sviluppo in rete o
tramite un tunnel: la redazione gestisce file e chiave privilegiata sul PC.
In produzione la pagina e la sua API rispondono 404; sono inoltre protette
contro richieste da altre origini e inserimento in iframe.

1. Scegliere la materia e aprire i macroargomenti da controllare.
2. Leggere flashcard, alternative, spiegazioni e fonti delle raccolte.
3. Approvare le raccolte controllate; escludere quelle non adatte. Si può usare
   l'approvazione in blocco dopo la conferma esplicita della revisione.
4. Se utile, rinominare più gruppi con lo stesso titolo, ad esempio
   Ottimizzazione: nella banca pubblicata vengono raggruppati automaticamente.
5. Premere Pubblica nel progetto. Se mancano parti, occorre consentire
   esplicitamente la pubblicazione parziale: non viene presentata come copertura
   completa degli appunti o del programma d'esame.
6. Aprire lo studio pubblico dal collegamento nella redazione.

Pubblica nel progetto salva il JSON revisionato. La pubblicazione online
avviene con il normale commit/push e deployment. La redazione può funzionare
senza che il dashboard contributi sia aperto o Supabase sia raggiungibile:
preparazione e pubblicazione delle attività usano i file del progetto.

## 5. Un'unica verifica funzionale del blocco

Nella materia aprire Studia e ripassa, senza accedere:
- tutto il materiale disponibile e scelta di un solo macroargomento;
- quiz progressivo, risultato e ripasso mirato dagli errori;
- flashcard, risposta e collegamento al PDF fonte;
- ricaricamento della pagina: le attività sono già pronte, non si rigenerano.

Dal pulsante + Proponi materiale:
- accesso con l'account collaboratore, invio PDF e stato In attesa;
- nessun comando di generazione nel modulo;
- in redazione, Carica proposte e valutazione con messaggio;
- aggiornando I miei contributi, l'autore ritrova il messaggio e l'esito.

Poi fermare dev con Ctrl+C ed eseguire:

```powershell
npm.cmd run check
git diff --check
```

Il controllo riunisce lint, test e build; non chiama il modello reale. Le prove
manuali non vanno ripetute dopo ogni piccola modifica indipendente: il checkpoint
è questo intero percorso. Una nuova modifica ai permessi o alla pubblicazione
richiede invece di ricontrollare il comportamento interessato.

## 6. Salvare e pubblicare l'anteprima

Preparare in Git soltanto i file dell'incremento e le banche effettivamente
revisionate. Non aggiungere .env.local, .aula o file diagnostici personali.
Il comando seguente include il codice e le banche pubblicate, ma esclude i
vecchi JSON non revisionati. Controllare sempre l’elenco staged:

```powershell
git add -- src scripts/study scripts/editor scripts/prepare-shared-study.mts scripts/sync-materials.mts docs README.md next.config.ts package.json supabase/migrations public/materials ':(exclude)src/content/study-kits/*.json'
git diff --cached --name-only
git commit -m "feat: add shared study banks, editorial review and contribution dialog"
git push -u origin feat/shared-study
```

Aprire Vercel → progetto Aula → Deployments → anteprima del nuovo ramo.
Verificare lo studio anche in incognito e che /redazione non sia raggiungibile.
Dopo la verifica dell'incremento, integrare il ramo in master per il dominio
principale. Non occorrono variabili AI pubbliche: il deployment legge le banche
approvate; le credenziali Cloudflare rimangono sul PC della redazione.

## Aggiornare gli appunti condivisi

1. Integrare nel sorgente LaTeX i contributi accettati dopo averne controllato
   provenienza, contenuti e sicurezza del file. Compilare il PDF aggiornato.
2. Sostituire il PDF principale nel percorso già indicato dal catalogo.
3. Sincronizzare i metadati e preparare le parti nuove o modificate:

```powershell
npm.cmd run content:sync
npm.cmd run study:prepare -- --subject machine-learning
```

4. Rivedere la nuova bozza nella redazione e ripubblicare la banca.
5. Committare insieme PDF, resources.json e banca pubblicata.

Se viene distribuito un PDF diverso da quello su cui si basano le attività,
lo studio mostra uno stato di aggiornamento e non presenta quelle attività
come correnti. Nessuna generazione avviene durante una build o una visita.

Per una nuova materia, configurare il catalogo e la sua fonte principale nei
file di contenuto. Non si implementano un nuovo generatore, modello o quiz.

## Backup e cambio computer

Il codice, il PDF comune e le banche pubblicate passano da GitHub. Le bozze in
.aula/editor sono volutamente fuori dal repository pubblico: per riprenderle
su un altro PC, trasferire privatamente quella cartella insieme alla propria
configurazione locale. Non salvare .env.local nello ZIP pubblico o in Git.
Il punto di lavoro e le decisioni rimangono in PROJECT_STATUS.md.

## Limiti attuali e riferimenti

Restano i limiti del parser: PDF testuali, massimo 250 pagine e un milione di
caratteri; blocchi fino a quattro pagine/frammenti e 18.000 caratteri. Parti
insufficienti rimangono segnalate alla redazione. Formule e figure possono
richiedere controllo manuale; la revisione redazionale non è una certificazione
disciplinare. L'unione automatica dei contributi, gli upload anonimi, la redazione
online, podcast e mappe non sono implementati da questo incremento.

Riferimenti ufficiali verificati:
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/
- https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/LICENSE
- https://supabase.com/docs/guides/database/postgres/row-level-security
