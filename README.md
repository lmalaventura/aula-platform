# Aula

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
modifiche al repository e pull request: il caricamento web non è implementato.
Ogni aggiornamento dei JSON/PDF richiede una nuova build e pubblicazione.

## Pubblicazione

La procedura scelta è GitHub + Vercel Hobby, per la demo personale non commerciale.
La guida [PUBBLICAZIONE.md](docs/PUBBLICAZIONE.md) contiene impostazioni,
passaggi e prove dell'URL pubblico. L'URL effettivo verrà aggiunto dopo il primo
deployment verificato: non è ancora registrato in questo snapshot.

## Limiti attuali

- La ricerca usa i metadati, non il testo interno dei PDF.
- I filtri non sono salvati nell'URL o in un account.
- L'anteprima PDF dipende dal lettore del browser; apertura diretta e download
  rimangono disponibili anche quando non è supportata.
- Upload web, autenticazione, moderazione, strumenti didattici e AI sono sviluppi futuri.
- Il nucleo dell'applicazione funziona senza modelli o servizi AI.

## Licenze e attribuzioni

La licenza del codice del progetto e le licenze di riuso dei materiali devono
ancora essere definite esplicitamente. In questo snapshot non è presente un
file LICENSE; non viene dichiarata una licenza open source o Creative Commons.
Le dipendenze mantengono le rispettive licenze e gli appunti mantengono le
attribuzioni e le indicazioni riportate nei documenti e nei metadati.
