# Aula

**Demo pubblica:** [Apri Aula](https://aula-platform-phi.vercel.app/)

Piattaforma di studio condivisa per gli studenti. Gli insegnamenti raccolgono
appunti comuni, materiali utili e attività pronte per il ripasso. Primo contesto:
magistrale in Informatica e Innovazione Digitale di UniUrb. Progetto indipendente,
non servizio ufficiale dell'ateneo.

## Flusso del prodotto

- Una fonte principale di appunti per insegnamento; esami, esercizi e progetti
  rimangono materiali distinti.
- Quiz e flashcard pubblicati dalla redazione, disponibili senza account,
  per tutti gli argomenti disponibili o per un macroargomento.
- Numero di domande derivato dalla banca; quiz con una domanda alla volta,
  feedback e ripasso degli argomenti da rivedere.
- Pulsante + Proponi materiale: contributi privati in attesa di revisione,
  senza generazione AI e senza aggiunta automatica al catalogo.
- Preparazione editoriale in blocco, cache incrementale e pubblicazione soltanto
  delle raccolte approvate. La navigazione pubblica non chiama modelli AI.

Lo stack resta Next.js App Router, React, TypeScript, Tailwind e npm. Nessuna
nuova dipendenza applicativa per il flusso condiviso. I contenuti pubblicati
sono file versionati in Git e distribuiti da Vercel; Supabase gestisce accesso,
file privati e revisioni dei contributi.

## Lavorare sul progetto

Node 24 LTS e npm, dalla directory del progetto. Su PowerShell usare npm.cmd.

```powershell
npm.cmd ci
npm.cmd run dev
```

Il server di sviluppo ascolta su 127.0.0.1. La redazione locale si apre da
http://127.0.0.1:3000/redazione; in produzione è disabilitata.

La guida operativa corrente è [docs/STUDIO_CONDIVISO.md](docs/STUDIO_CONDIVISO.md):
applicazione della migrazione, preparazione dei contenuti, revisione e rilascio.
Le vecchie guide di generazione personale descrivono il flusso storico.

## Preparare e pubblicare le attività

```powershell
npm.cmd run study:prepare -- --subject machine-learning
```

Aprire la redazione locale, rivedere le bozze e premere Pubblica nel progetto.
Il comando non acquista servizi: usa la configurazione Cloudflare già presente.
Le bozze rimangono in .aula/editor, ignorato da Git; i risultati approvati sono
in src/content/study-banks. Dopo commit e deployment lo studente li usa anche
con il computer della redazione spento e senza disponibilità del provider AI.

Per aggiornare un PDF sostituito:

```powershell
npm.cmd run content:sync
npm.cmd run study:prepare -- --subject machine-learning
```

I contenuti identici vengono riutilizzati; i cambiamenti richiedono revisione.
La firma del PDF impedisce di presentare attività su una fonte diversa come
aggiornate. Non è una certificazione della correttezza didattica.

## Contenuti e verifiche

- src/content/subjects.json e resources.json: catalogo.
- src/content/study-sources.json: una fonte principale per materia.
- src/content/study-banks: banche approvate da distribuire.
- scripts/editor e src/lib/editor: preparazione, revisione e pubblicazione.
- supabase/migrations: permessi e revisioni dei contributi.
- docs/PROJECT_STATUS.md: checkpoint e decisioni.

```powershell
npm.cmd run check
```

Il controllo esegue lint, test Node con risposte simulate e build. Non genera
contenuti sul servizio reale. Non committare credenziali, cache locali o bozze.
L'upload anonimo, l'integrazione automatica nel LaTeX e una revisione antimalware
non sono disponibili: il caricamento rimane riservato ai collaboratori abilitati,
mentre lo studio pubblico è libero.

## Licenze e attribuzioni

La licenza del codice del progetto e le licenze di riuso dei materiali devono
ancora essere definite esplicitamente. In questo snapshot non è presente un
file LICENSE; non viene dichiarata una licenza open source o Creative Commons.
Le dipendenze mantengono le rispettive licenze e gli appunti mantengono le
attribuzioni e le indicazioni riportate nei documenti e nei metadati.

PDF.js (`pdfjs-dist` 6.4.299, Apache-2.0) è una dipendenza applicativa usata per
l’estrazione del testo nel CLI e sul server. Il provider della prima prova è Cloudflare Workers AI
con Llama 3.3, soggetto alla [Llama 3.3 Community License](https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/LICENSE).
**Built with Llama.** Non vengono distribuiti pesi del modello.
Il codice mantiene la licenza ancora da definire indicata sopra.
