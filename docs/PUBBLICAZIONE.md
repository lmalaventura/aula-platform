# Pubblicazione: GitHub e Vercel

Procedura preparata il 25 ottobre 2026. L'esito del deployment e gli URL effettivi
vanno registrati solo dopo la pubblicazione verificata.

## Scelta dell'hosting

Vercel Hobby è gratuito per progetti personali non commerciali, con limiti di utilizzo.
Per la demo usare l'URL vercel.app assegnato al progetto; non occorre acquistare un dominio.
La situazione commerciale e i piani potranno essere rivalutati se cambia l'uso del progetto.

Il repository conserva codice e PDF. Vercel esegue la build e serve il sito online:
non dipende dal PC Windows acceso. Non servono database, chiavi API o variabili
ambiente per le funzioni attuali.

## 1. Preparare il commit

Dalla cartella C:\Users\x\Projects\aula-platform, in PowerShell:

```powershell
git diff --check
git status --short
git add README.md .gitattributes docs src/app/page.tsx src/components/site-header.tsx src/components/subject-card.tsx src/components/resource-card.tsx
git commit -m "chore: prepare MVP for public deployment"
```

I controlli sul codice sono documentati nel rapporto allegato all'aggiornamento.
Se si modifica altro codice oltre al pacchetto verificato, ripetere lint e build.

## 2. Pubblicare il repository con GitHub Desktop

1. Aprire GitHub Desktop ed effettuare l'accesso al proprio account, se necessario.
2. File → Add local repository → Choose.
3. Selezionare C:\Users\x\Projects\aula-platform, poi Add repository.
4. Se compare Publish repository, aprirlo e usare:
   - Name: aula-platform (oppure un altro nome disponibile).
   - Description: Piattaforma collaborativa di apprendimento universitario.
   - Keep this code private: deselezionato per avere una repository pubblica.
   - Organization: None, per pubblicarla nell'account personale.
5. Premere Publish repository.
6. Repository → View on GitHub e controllare codice, README e public/materials.

Se esiste già un remote e compare Push origin, non rimuoverlo automaticamente:
controllare Repository → View on GitHub e verificare che sia la destinazione desiderata.
Il nome del ramo esistente può rimanere master. Non serve creare un secondo progetto.

## 3. Importare il progetto su Vercel

1. Aprire https://vercel.com/signup e scegliere l'accesso con GitHub.
2. Selezionare l'uso personale/Hobby. Non serve attivare Pro o una prova a pagamento.
3. Aprire https://vercel.com/new e la sezione Import Git Repository.
4. Se necessario collegare GitHub e concedere accesso alla sola repository aula-platform.
5. Selezionare aula-platform e premere Import.
6. Verificare il Framework Preset Next.js e la Root Directory del repository.
7. Nelle opzioni di build impostare:

| Impostazione | Valore |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | Radice, dove si trova package.json |
| Install Command | npm ci |
| Build Command | npm run lint && npm run build |
| Output Directory | Valore predefinito di Next.js, senza override manuale |
| Environment Variables | Nessuna necessaria per questo MVP |

Sulla piattaforma Linux si usano npm e &&. Il suffisso .cmd delle istruzioni
locali serve a PowerShell e non va riportato nella dashboard.

8. Usare Node.js 24.x. Per verificarlo o selezionarlo, dopo la creazione:
   progetto → Settings → Build and Deployment → Node.js Version. Se si cambia
   la versione dopo una prima build, eseguire un nuovo deployment.
9. Premere Deploy e attendere lo stato Ready. In caso di errore inviare il log
   prima di cambiare versione del framework o rimuovere controlli.

## 4. Verificare l'accesso pubblico

Copiare il dominio di produzione indicato nella sezione Domains del progetto.
Il nome esatto dipende dalla disponibilità: non si presume che sia aula-platform.vercel.app.
Non confondere il dominio stabile di produzione con un URL generato per una singola build.

Aprirlo in una finestra in incognito, senza sessione Vercel, e dal telefono.
La navigazione non deve chiedere un account Vercel.

Se il dominio di produzione chiede autenticazione, aprire progetto → Settings →
Deployment Protection e controllare l'ambito della protezione. Standard Protection
lascia pubblici i domini di produzione e protegge gli altri URL; All Deployments
protegge anche la produzione. Usare il dominio di produzione e una configurazione
che lo lasci pubblico; non occorre rendere pubbliche anche tutte le anteprime.

Provare homepage, catalogo, materia, ricerca, apertura diretta di una pagina
interna, PDF e download. Verificare /risorse/non-esiste. Ripetere dopo aver
fermato npm.cmd run dev e npm.cmd start sul PC: il sito pubblico deve funzionare.

Registrare l'URL reale nel README e in PROJECT_STATUS.md solo dopo queste prove.

## 5. Aggiornamenti successivi

1. Modificare file locali e contenuti.
2. Eseguire lint/build e le prove pertinenti.
3. Effettuare commit e Push origin da GitHub Desktop.
4. Controllare il deployment generato da Vercel.

I push sul ramo di produzione configurato aggiornano il sito di produzione;
gli altri rami possono generare anteprime. Controllare che il ramo di produzione
sia quello effettivamente usato dal repository (inizialmente master).

## Fonti ufficiali consultate

- https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop?platform=windows
- https://vercel.com/docs/git
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- https://vercel.com/docs/deployment-protection

Le etichette della dashboard possono cambiare: in caso di schermate differenti
condividere il testo o uno screenshot della schermata interessata.
