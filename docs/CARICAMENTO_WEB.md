# Caricamento web — primo incremento

Obiettivo verificabile: accedere dal sito, scegliere un PDF, salvarlo in un archivio
remoto privato e ritrovarlo dopo aver chiuso il browser. Nessuna configurazione
specifica per Machine Learning o dispositivi mobili nel codice del caricamento.

Questo incremento **non genera ancora strumenti dai nuovi upload e non li pubblica
nel catalogo**. Sono i due collegamenti successivi. I quiz/flashcard del prototipo
continuano a usare i risultati del generatore esistente; gli output v2 reali restano
da revisionare prima di presentarli come contenuti verificati.

## Servizio e limiti

Usiamo un solo progetto Supabase: Auth per l'accesso con email/password, Postgres
per i metadati e Storage per i PDF. L'applicazione resta su Vercel. Nessun nuovo
programma globale da installare: una sola dipendenza applicativa,
@supabase/supabase-js 2.118.0 (MIT, Node >=22), fissata nel lockfile.

Il 30 ottobre 2026 il piano Free riporta: 500 MB di database, 1 GB di file,
5 GB di traffico in uscita e 5 GB di traffico dalla cache; massimo due progetti
attivi. I progetti Free sono sospesi dopo una settimana di inattività: per
riprenderli si usa il dashboard. Il catalogo statico già pubblicato non interroga
questo backend. Non servono piani a pagamento per la prova; mantenere Free e non
attivare upgrade. Il piano Pro parte da 25 USD/mese e non è richiesto qui.

Per ora imponiamo **5 MB per PDF**, anche se il servizio consente altri limiti.
L'upload standard è consigliato da Supabase per file piccoli; l'invio riprendibile
di file più grandi sarà un incremento separato se necessario.

Fonti ufficiali consultate:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/storage/uploads/standard-uploads
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/api/api-keys

## A. Applicare il pacchetto sul portatile

1. Aprire VS Code e PowerShell. Fermare `npm.cmd run dev` con Ctrl+C, se in esecuzione.
2. Aprire la cartella del progetto in PowerShell:

```powershell
Set-Location "$env:USERPROFILE\Projects\aula-platform"
git status --short
```

3. Estrarre il nuovo ZIP in una cartella temporanea. Aprire la sua cartella
   `update`, selezionarne **il contenuto**, copiarlo dentro `aula-platform` e
   confermare la sostituzione dei file omonimi. Non copiare la cartella `update`
   come sottocartella del progetto. I nuovi file devono risultare, per esempio,
   `aula-platform\src\app\contribuisci\page.tsx` e
   `aula-platform\supabase\migrations\202610300001_private_uploads.sql`.
4. Il pacchetto parte dallo studio v2 già consegnato. Non elimina PDF,
   `.env.local`, file generati o lo script di verifica Cloudflare.
5. Eseguire un comando per volta, fermandosi se un comando fallisce:

```powershell
npm.cmd ci
npm.cmd run uploads:test
npm.cmd run study:test
npm.cmd run lint
npm.cmd run build
```

Attesi: 10 test del caricamento, 22 test dello studio, lint senza errori e build
riuscita. Queste verifiche non si collegano al tuo progetto Supabase e non
consumano Cloudflare. L'avviso già noto di deprecazione ESLint non richiede di
aggiornare tutte le dipendenze. Non approvare script npm aggiuntivi alla cieca.

```powershell
npm.cmd run dev
```

Aprire http://localhost:3000/contribuisci. Prima della configurazione il risultato
corretto è **“L’area collaboratori non è ancora attiva”**. Catalogo e materiali
restano utilizzabili. Fermare il server con Ctrl+C prima di proseguire.

## B. Creare il backend gratuito, una sola volta

Aprire https://supabase.com/dashboard nel browser.

1. Accedere o creare il proprio account; è possibile usare GitHub. L'account del
   dashboard amministra il servizio, è distinto dall'account collaboratore Aula.
2. Creare un'organizzazione personale Free se non è già disponibile.
3. Selezionare **New project**, l'organizzazione Free, nome `aula-platform`,
   una password database robusta da conservare nel proprio password manager,
   una regione europea disponibile vicina e **Create new project**.
4. Attendere che il progetto sia pronto. Non occorre installare Supabase CLI,
   Docker o un database sul portatile. Non condividere la password del database.

### Tabelle, archivio privato e permessi

Nel progetto Supabase aprire **SQL Editor → New query**. In PowerShell, dalla
cartella `aula-platform`, copiare negli appunti il file SQL fornito:

```powershell
Get-Content -Raw -Encoding UTF8 -LiteralPath ".\supabase\migrations\202610300001_private_uploads.sql" | Set-Clipboard
```

Incollare tutto nel SQL Editor e premere **Run**. Non sostituire parti del file.
Atteso: esecuzione senza errori (il dashboard può mostrare “Success. No rows
returned”). Questa migrazione va eseguita **una volta** su un progetto dedicato,
non sul database di altri progetti. È racchiusa in una transazione: un errore
annulla le sue modifiche. Se segnala “already exists” dopo un'esecuzione riuscita,
non eliminarne le tabelle: verificare gli elementi esistenti o inviare l'errore.

Controllare nel dashboard:
- **Table Editor**: tabelle `aula_contributors` e `aula_uploads`.
- **Storage**: bucket `aula-private`, contrassegnato come **privato**, MIME PDF,
  limite 5 MB. Non attivare “Public bucket”.

Non creare altre policy permissive sulle tabelle o sul bucket. Le regole incluse
permettono a ogni collaboratore abilitato di gestire soltanto i propri contributi.

### Primo account collaboratore

1. In **Authentication → Sign In / Providers** (o impostazioni dell'accesso),
   lasciare attivo il provider **Email** con password. Disabilitare l'opzione
   **Allow new users to sign up**. Non abilitare accessi anonimi.
2. Aprire **Authentication → Users → Add user → Create new user**.
3. Inserire la propria email e una password distinta da quella database.
   Attivare **Auto Confirm User**, se presente: l'account è creato direttamente
   dall'amministratore, senza inviare email. Annotare queste credenziali.
4. Aprire l'utente creato e copiare il suo **User UID / ID**, un identificativo UUID.
5. In **Table Editor → aula_contributors → Insert row**, incollare tale ID in
   `user_id`, lasciare `enabled` a `true`, salvare.

L'account dashboard non compare automaticamente tra gli utenti dell'app. Un
utente Auth senza la riga di abilitazione può accedere ma non caricare o leggere
file privati. Per revocare l'accesso, impostare `enabled=false`; non cancellare
l'utente Auth con file ancora associati. Per questa fase gli altri collaboratori
si aggiungono con lo stesso procedimento. Registrazione, inviti, recupero password
e gestione dei ruoli dal sito sono sviluppi successivi, non pulsanti simulati.

## C. Collegare il progetto locale

Nel dashboard aprire **Connect** e individuare **Project URL** e **Publishable
key**; in alternativa cercarli in **Project Settings → API Keys / Data API**.
La chiave richiesta inizia con `sb_publishable_`. Non usare `sb_secret_` o
`service_role`. La chiave pubblicabile identifica il progetto; sono login e
policy a proteggere i dati. L'app rifiuta configurazioni con chiavi segrete.

In PowerShell:

```powershell
Set-Location "$env:USERPROFILE\Projects\aula-platform"
code .env.local
```

Nel file esistente **aggiungere**, senza cancellare le righe Cloudflare:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://IL_TUO_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_LA_TUA_CHIAVE
```

Sostituire i due valori con quelli del dashboard, salvare. Non servono password
utente/database o chiavi Cloudflare in variabili `NEXT_PUBLIC_`. Non inviare
`.env.local` in chat e non aggiungerlo a Git.

```powershell
npm.cmd run dev
```

Aprire http://localhost:3000/contribuisci. Ora devono comparire email, password e
**Accedi**. Le variabili pubbliche sono incluse nella build: dopo una modifica
riavviare dev; per la produzione occorrerà una nuova build.

## D. Prova reale prima del commit

1. Accedere con l'account creato in Authentication, non con la password database.
2. Scegliere Machine Learning, titolo `Prova caricamento — da eliminare`, autore
   corretto e uno dei propri PDF esistenti (inferiore a 5 MB).
3. Confermare di poterlo condividere e premere **Salva PDF nell'archivio**.
4. Attendere lo stato **Salvato · privato** nell'elenco. Nessuna chiamata AI è
   prevista in questo incremento.
5. Ricaricare la pagina: il contributo deve restare. Premere **Scarica PDF** e
   verificare che si apra e abbia il contenuto originale.
6. In Supabase controllare `aula_uploads`: materia, titolo, autore, dimensione,
   stato `stored`; in Storage il percorso è `ID_UTENTE/ID_CONTRIBUTO.pdf`.
7. Provare lo stesso PDF nella stessa materia: deve apparire un messaggio di
   duplicato senza sovrascrivere il file precedente. Per un nuovo invio eliminare
   la prova, oppure usare un PDF effettivamente diverso.
8. **Elimina → Annulla** mantiene il file. **Elimina → Conferma eliminazione**
   rimuove file e metadati. Non eliminare manualmente righe `storage.objects`.
9. **Esci**, aprire un'altra finestra in incognito: il modulo deve chiedere
   l'accesso; il catalogo pubblico resta accessibile. Autenticandosi con lo stesso
   account nella finestra in incognito, ritrovare i contributi rimasti.

Se il caricamento si interrompe, può restare **Caricamento incompleto**. Usare
**Verifica salvataggio**: se il PDF era arrivato ma mancava la conferma, lo stato
viene recuperato. Se il file è assente, eliminare la prenotazione e riprovare.
Il pulsante **Aggiorna elenco** recupera l'elenco dal backend. Vengono mostrati al
massimo gli ultimi 100 contributi del proprio account.

Fermarsi qui e comunicare l'esito della prova o l'errore effettivo. La revisione
sul servizio reale è necessaria prima del commit/deployment; il pacchetto è stato
provato con API simulate e un database locale, non con il tuo account.

## Errori frequenti

| Risultato | Controllo concreto |
| --- | --- |
| Area non ancora attiva | URL HTTPS `...supabase.co`, chiave `sb_publishable_`, nomi variabili esatti; salvare e riavviare dev. |
| Accesso non riuscito | Account in Authentication → Users, email confermata e password dell'utente Aula; progetto non sospeso. |
| Account non abilitato | La riga di `aula_contributors` deve contenere l'UUID dello stesso utente, `enabled=true`; premere Aggiorna elenco. |
| Operazione non completata al primo accesso | Migrazione eseguita integralmente nel medesimo progetto delle variabili; progetto attivo e rete funzionante. |
| Intestazione PDF non valida | Il file non comincia con `%PDF-`; non basta rinominare un file `.pdf`. Esportarlo di nuovo dal programma originale. |
| PDF troppo grande | Limite intenzionale 5 MB per questa prova; usare uno dei PDF originali già sotto il limite. |
| Caricamento incompleto | Verifica salvataggio, oppure Elimina e nuovo invio. Evitare upload simultanei dello stesso contributo da due schede. |
| SQL “already exists” | La migrazione può essere già applicata; non cancellare il database. Inviare l'errore e verificare tabelle/bucket. |
| Porta 3000 occupata | Usare l'indirizzo stampato da Next oppure fermare l'altra istanza. Nessun redirect di login è necessario per il flusso password. |

Se occorre diagnosticare un errore, inviare il testo e l'operazione che lo ha
causato. Omettere password, token e header Authorization; non incollare la console
con credenziali. Non risolvere gli errori di permessi disabilitando RLS.

## Commit e pubblicazione: dopo la prova reale

Conservare il ramo corrente di lavoro; verificare `git status --short` prima di
crearne un altro. L'incremento si appoggia allo studio v2 non ancora pubblicato:
faremo il commit del codice dopo la verifica; le raccolte didattiche v2 richiedono
una revisione separata prima di includerle.

I file di questo incremento sono elencati nel MANIFEST del pacchetto. Il messaggio
previsto è `feat: add private contributor PDF uploads`. `.env.local` resta escluso.
Non riscrivere o sovrascrivere modifiche locali non esaminate.

Per pubblicare l'incremento verificato, la configurazione aggiuntiva su Vercel è:
1. https://vercel.com/dashboard → progetto Aula → Settings → Environment Variables.
2. Aggiungere `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` per Production e Preview, con gli stessi
   valori del progetto scelto; non aggiungere password o chiavi Cloudflare per
   questa fase. Per futuri contributi di estranei conviene un backend Preview
   separato; questo incremento usa l'unico ambiente di prova personale.
3. Dopo il push del codice verificato, attendere il deployment; se le variabili
   sono state aggiunte a una build già esistente, eseguire un nuovo deployment.
4. Aprire https://aula-platform-phi.vercel.app/contribuisci e ripetere upload,
   ricaricamento, download ed uscita in incognito. I dati sono gli stessi se le
   variabili puntano allo stesso progetto Supabase.
5. A deployment concluso si può spegnere il PC: accesso e file sono remoti.
   Resta il limite di sospensione per inattività del piano Free.

## Architettura e verifiche tecniche

- `/contribuisci` è una pagina statica senza dati di utenti. La sessione è gestita
  dal client Supabase inizializzato soltanto nel browser e riutilizzato tra
  navigazioni e Fast Refresh; non ci sono cookie SSR, proxy o service key.
- RLS su tabelle e Storage è il confine di autorizzazione; nascondere il modulo
  nell'interfaccia è soltanto UX. Un utente non può autoabilitarsi.
- Il browser valida campi, dimensione, intestazione PDF e calcola SHA-256. Questi
  controlli migliorano UX e deduplicazione, **non attestano sicurezza o correttezza
  del documento contro un collaboratore malevolo**.
- Storage limita tipo dichiarato e dimensione; la conferma remota verifica
  esistenza, dimensione e MIME memorizzati. Non ricalcola l'hash e non analizza
  integralmente il PDF. Il parsing remoto prima dell'AI sarà nel prossimo passo.
- Prenotazione metadati → invio Storage → conferma con funzione SQL. Se fallisce,
  la prenotazione permette recupero/eliminazione. Nessuna sovrascrittura.
- Cancellazione Storage prima dei metadati, con controllo remoto dell'ordine.
- `src/lib/uploads/repository.ts` contiene l'accesso al servizio; componenti e
  catalogo statico non incorporano chiamate o condizioni per singole materie.
- Le materie nel selettore vengono dal catalogo attuale. L'aggiunta delle materie
  da interfaccia e la migrazione del catalogo nel database sono ancora da fare.
- Il nuovo archivio non riscrive i PDF statici o i JSON dei contenuti pubblici.
- Nessun job remoto, coda, riconoscimento OCR o generazione AI avviato di nascosto.

Verifiche del pacchetto: test Node per validazione e flusso SDK con fetch simulato;
regole SQL eseguite in PGlite/Postgres con fixture di Auth/Storage; compilazione e
lint Next; prove browser con HTTP simulato. La compatibilità con l'istanza Supabase
ospitata resta da confermare con la prova D.
