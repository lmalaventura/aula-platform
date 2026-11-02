# Pubblicazione: GitHub e Vercel

> Per il successivo incremento di generazione web, usare [GENERAZIONE_WEB.md](GENERAZIONE_WEB.md), incluse le tre nuove variabili server.

Guida aggiornata il 30 ottobre 2026 per il codice degli strumenti di studio e
l'area collaboratori. Il primo MVP pubblico è già ospitato su Vercel.

- Repository: https://github.com/lmalaventura/aula-platform
- Ramo di produzione: `master`.
- Dominio stabile: https://aula-platform-phi.vercel.app/
- Ramo di lavoro osservato sul portatile: `feat/study-generation`.
- Node.js 24 LTS. Il servizio pubblicato funziona senza il PC dello sviluppatore.

## 1. Configurazione Vercel

Aprire https://vercel.com/dashboard e il progetto Aula già esistente.
Non creare un altro progetto Vercel.

In Settings → Environment Variables aggiungere, per Production e Preview:

| Nome | Valore |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | URL del progetto Supabase, come in .env.local |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Chiave sb_publishable_ del progetto, come in .env.local |

Salvare le variabili prima della nuova build. Le modifiche non cambiano i
vecchi deployment: si applicano ai nuovi. Non aggiungere password del database,
password collaboratori, service_role o sb_secret_ tra le variabili pubbliche.
L'incremento di upload non richiede credenziali Cloudflare su Vercel: le
chiamate AI sono ancora limitate al generatore da terminale.

Controllare queste impostazioni già usate per il primo MVP:

| Impostazione | Valore |
| --- | --- |
| Framework | Next.js |
| Root Directory | Radice del repository |
| Install Command | npm ci |
| Build Command | npm run lint && npm run build |
| Output Directory | Predefinita di Next.js |
| Node.js Version | 24.x |

Il suffisso `.cmd` serve su Windows, non nei comandi Linux di Vercel.

## 2. Controllo e commit sul portatile

Aprire PowerShell nella directory del progetto:

```powershell
Set-Location "$env:USERPROFILE\Projects\aula-platform"
```

Applicare la correzione del client browser, poi fermare dev con Ctrl+C per
eseguire i controlli. Fermarsi al primo errore:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
```

Il ramo osservato è feat/study-generation, nessun file staged e nessun commit
locale nuovo rispetto a origin/master. Se nel frattempo lo stato è cambiato,
eseguire `git status --short` e verificare le nuove modifiche.

Questo checkpoint pubblica il codice; i due JSON generati con domande reali
restano locali in attesa di revisione. Il programma mostra lo stato vuoto
esplicito quando non trova raccolte pubblicate. Lo script diagnostico di
connessione resta anch'esso locale. Preparare i file con:

```powershell
git add -- . ':(exclude)src/content/study-kits/*.json' ':(exclude)scripts/check-ai.mjs'
git diff --cached --check
git diff --cached --stat
git diff --cached --name-only -- .env.local "src/content/study-kits/*.json"
```

L'ultimo comando deve produrre **output vuoto**. Non cancella i JSON o `.env.local`.
I controlli precedenti hanno confermato che `.env.local` non è tracciato ed è ignorato.
Se compare uno di questi file nello staging, fermarsi prima del commit.

```powershell
git commit -m "feat: add study tools and private PDF uploads"
git push -u origin feat/study-generation
```

Il push pubblica il ramo di lavoro; non aggiorna ancora master. Se Git richiede
l'accesso, completare il login GitHub tramite la finestra del browser. Se segnala
identità autore mancante o push rifiutato, inviare l'errore prima di modificare la
storia o usare opzioni forzate.

Dopo il commit possono restare non tracciati i due JSON e check-ai.mjs: è previsto.

## 3. Verifica dell'anteprima

In Vercel → progetto Aula → Deployments individuare il deployment associato a
feat/study-generation. Attendere Ready e aprire l'URL dell'anteprima. Se richiede
il login Vercel, usare l'account proprietario del progetto; l'accesso collaboratori
Aula è distinto da quello di Vercel.

Verificare:
1. Homepage, insegnamenti, ricerca e apertura dei PDF pubblici.
2. /contribuisci mostra email/password, non “area non ancora attiva”.
3. Login con l'account Aula già verificato.
4. Upload di una copia di prova, persistenza dopo ricaricamento e download.
5. Uscita e ritorno al modulo di accesso.
6. Le pagine studio prive di JSON pubblicati mostrano lo stato vuoto previsto.

I caricamenti appartengono allo stesso account Supabase: se locale e anteprima
usano lo stesso backend, ritrovano gli stessi file. Non caricare dati riservati
nelle build di rami non fidati: per contributi esterni si configurerà un backend
Preview separato.

La configurazione Supabase non va ripetuta e la migrazione SQL non va rieseguita.
Una build fallita richiede il log effettivo, senza cambiare dipendenze alla cieca.

## 4. Promozione in produzione, dopo l'anteprima verificata

Eseguire un comando alla volta e fermarsi al primo errore:

```powershell
git switch master
git pull --ff-only origin master
git merge --ff-only feat/study-generation
git push origin master
```

Nessun force push. Se Git non può procedere in fast-forward, esaminare lo stato
prima di scegliere un'altra strategia di merge.

Attendere Ready per il deployment Production e aprire:
https://aula-platform-phi.vercel.app/contribuisci

Ripetere login/upload/download/uscita dal dominio stabile, anche dopo aver
fermato il server locale. La navigazione pubblica di produzione deve essere
accessibile senza login Vercel; i PDF nell'archivio riservato richiedono invece
il login Aula. Una finestra incognito senza accesso Aula deve vedere il modulo,
non i contributi di un altro browser.

Registrare il commit pubblicato e l'esito soltanto dopo questa verifica. Per ora
il checkpoint di caricamento reale è confermato sul portatile, non sul dominio
pubblico. Il piano Free di Supabase può sospendere il backend dopo una settimana
di inattività; il catalogo pubblico statico non interroga quel backend.

## Riferimenti

- https://vercel.com/docs/environment-variables/managing-environment-variables
- https://vercel.com/docs/git
- https://nextjs.org/docs/messages/missing-data-scroll-behavior
- https://react.dev/reference/react/useState
- docs/CARICAMENTO_WEB.md per configurazione del backend e limiti.
