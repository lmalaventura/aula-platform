# Aula

**Demo pubblica:** [Apri Aula](https://aula-platform-phi.vercel.app/)

Piattaforma collaborativa di apprendimento universitario, inizialmente dedicata
alla magistrale in Informatica e Innovazione Digitale dell'Università di Urbino.
Progetto studentesco indipendente: non è un servizio ufficiale dell'ateneo.

## Funzioni dell'MVP

- Homepage, catalogo e pagine degli insegnamenti.
- Materiali organizzati per categoria e associati alla materia.
- Pagina Materiali con ricerca nei metadati e filtri combinabili.
- Lettura dei PDF tramite il browser, apertura separata e download.
- Autore, provenienza e stato dei materiali esplicitati.
- Pagine generate alla build; ricerca eseguita nel browser.
- Interfaccia italiana responsive e controlli utilizzabili da tastiera.

Il catalogo contiene attualmente due insegnamenti e due PDF reali di appunti
studenteschi, dichiarati non ufficiali e in aggiornamento.

## Requisiti e avvio locale

Node.js 24 LTS, npm e Git. Conservare package-lock.json nel repository.
Aprire il progetto in VS Code e il terminale nella directory di package.json.
I comandi seguenti sono per PowerShell; su Linux/macOS usare npm al posto di npm.cmd.

```powershell
npm.cmd ci
npm.cmd run dev
```

Aprire http://localhost:3000. L'avvio locale serve allo sviluppo; la versione
pubblicata è ospitata online e funziona indipendentemente dal PC dello sviluppatore.

## Studio automatico — incremento sperimentale

Un unico generatore prepara quiz e flashcard dai PDF presenti nel catalogo.
Il comando seleziona fino a quattro pagine di contenuto per PDF, conserva fonti e
citazioni e riutilizza i risultati aggiornati. La consultazione avviene dalla
pagina di ogni materia, tramite **Apri gli strumenti di studio**.

Questa prima prova richiede una configurazione Cloudflare unica per il progetto;
non richiede di scrivere domande o prompt per ciascuna materia. La qualita
didattica degli output reali deve essere verificata sul primo utilizzo.
La generazione non avviene durante la navigazione o la build di Vercel.

Vedere [STUDIO_AUTOMATICO.md](docs/STUDIO_AUTOMATICO.md) per configurazione,
comandi, copertura delle fonti, verifiche e limiti.

## Caricamento web riservato

La pagina `/contribuisci` aggiunge accesso collaboratori e un archivio privato
Supabase. Per configurazione iniziale, prova locale, limiti del piano gratuito
e pubblicazione vedere [CARICAMENTO_WEB.md](docs/CARICAMENTO_WEB.md). I nuovi
file restano privati; il collegamento alla generazione automatica è il prossimo
incremento. Il catalogo pubblico esistente continua a usare i JSON e PDF statici.

## Controlli e build

Fermare il server di sviluppo con Ctrl+C ed eseguire i controlli uno alla volta.
Fermarsi al primo errore.

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd start
```

L'ultimo comando serve per provare localmente la build di produzione.
Verificare navigazione, ricerca, azzeramento dei filtri, lettura e download.

## Struttura

| Percorso | Responsabilità |
| --- | --- |
| src/app/ | Pagine e layout App Router |
| src/components/ | Componenti presentazionali e ricerca interattiva |
| src/content/ | Identità, insegnamenti, categorie e risorse JSON |
| src/lib/catalog/ | Tipi, accesso e controlli sui contenuti, ricerca |
| src/lib/uploads/ | Validazione, tipi e accesso all’archivio privato |
| supabase/migrations/ | Schema e policy del backend |
| src/lib/study/ | Contratti, controlli e lettura delle attivita |
| src/content/study-kits/ | Risultati generati e provenienza |
| scripts/study/ | Estrazione PDF, generazione e verifiche con Node.js |
| public/materials/ | PDF serviti come file statici |
| docs/CONTENUTI.md | Aggiunta e aggiornamento dei materiali |
| docs/PUBBLICAZIONE.md | Repository GitHub e deployment Vercel |
| docs/PROJECT_STATUS.md | Decisioni e stato verificato del progetto |

Le pagine leggono i contenuti tramite i moduli di src/lib/. Il componente di
ricerca riceve dati serializzabili e non importa il codice che accede ai file.
L'installazione iniziale descrive un corso di studio; dati e componenti non
richiedono contenuti specifici di Informatica.

## Contenuti e contributi

Per aggiungere un insegnamento, una categoria o un documento consultare
[la guida ai contenuti](docs/CONTENUTI.md). Per ora i contributi avvengono tramite
modifiche al repository e pull request. Il nuovo caricamento web riservato
salva contributi privati; non li pubblica ancora nel catalogo.
Ogni aggiornamento dei JSON/PDF richiede una nuova build e pubblicazione.

## Pubblicazione

La demo è pubblicata su Vercel e collegata a questa repository.
È consultabile senza un account della piattaforma e senza avviare il progetto in locale.
La guida [PUBBLICAZIONE.md](docs/PUBBLICAZIONE.md) contiene impostazioni,
passaggi di manutenzione e prove dell'URL pubblico.

Il 25 ottobre 2026 sono stati completati 17 controlli esterni sul dominio pubblico:
navigazione, ricerca e filtri, stati vuoti, lettura delle pagine delle risorse,
download dei due PDF, comportamento responsive e gestione degli indirizzi inesistenti.
I PDF scaricati sono stati confrontati con gli originali tramite SHA-256.

## Limiti attuali

- La ricerca usa i metadati, non il testo interno dei PDF.
- I filtri non sono salvati nell'URL o in un account.
- L'anteprima PDF dipende dal lettore del browser; apertura diretta e download
  rimangono disponibili anche quando non è supportata.
- Pubblicazione degli upload, generazione remota automatica, moderazione, mappe, podcast e simulazioni d'esame restano sviluppi futuri.
- La generazione sperimentale di quiz e flashcard avviene dal terminale; non e ancora un caricamento web automatico.
- Il nucleo dell'applicazione funziona senza modelli o servizi AI.

## Licenze e attribuzioni

La licenza del codice del progetto e le licenze di riuso dei materiali devono
ancora essere definite esplicitamente. In questo snapshot non è presente un
file LICENSE; non viene dichiarata una licenza open source o Creative Commons.
Le dipendenze mantengono le rispettive licenze e gli appunti mantengono le
attribuzioni e le indicazioni riportate nei documenti e nei metadati.

PDF.js (`pdfjs-dist` 6.4.299, Apache-2.0) e una dipendenza di sviluppo usata per
l'estrazione del testo. Il provider della prima prova e Cloudflare Workers AI
con Llama 3.3, soggetto alla [Llama 3.3 Community License](https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/LICENSE).
**Built with Llama.** Non vengono distribuiti pesi del modello.
Il codice mantiene la licenza ancora da definire indicata sopra.
