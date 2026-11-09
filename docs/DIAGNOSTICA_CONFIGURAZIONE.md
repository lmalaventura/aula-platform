# Strumenti assenti in anteprima: verifica della configurazione

Aggiornamento del 2 novembre 2026, sulla base del commit c1b51ab del ramo
`feat/web-study-generation`.

## Stato e modifica

L'utente conferma che la generazione funziona in locale. Nell'anteprima Vercel
la pagina Contribuisci mostra invece «La generazione automatica non è ancora
attiva». Un nuovo deployment Preview senza cache non ha cambiato il risultato.
Le foto mostrano i nomi delle variabili e gli ambienti, non i loro valori.
La specifica causa remota non è ancora verificata.

La pagina ora chiama `connection()` prima di leggere la configurazione: il
controllo avviene nel server durante la richiesta, anziché essere fissato nella
pagina statica durante la build. Le altre pagine del catalogo restano statiche.
Il controllo delle credenziali conserva le stesse regole; in caso negativo
scrive nei log server i nomi delle variabili problematiche e motivi prestabiliti.
Non scrive i valori e non li invia al browser. Non avvia elaborazioni AI.

## Config e Secret

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Config.
- `SUPABASE_SECRET_KEY` e `CLOUDFLARE_API_TOKEN`: Secret.
- `CLOUDFLARE_ACCOUNT_ID`: può rimanere Secret; il tipo non blocca la lettura
  dal server, anche se l'identificativo non è una credenziale di autenticazione.

Un Secret salvato non è visualizzabile dalla dashboard, anche per il
proprietario. Si può sostituire il valore con Edit; non occorre eliminarlo.
Usare i valori originali del file `.env.local` funzionante o del servizio che
li ha emessi, senza inviarli in chat, screenshot o commit.

Riferimenti ufficiali verificati il 2 novembre 2026:
- https://vercel.com/docs/environment-variables/sensitive-environment-variables
- https://vercel.com/docs/environment-variables/managing-environment-variables
- https://vercel.com/docs/logs/runtime

## Applicare il pacchetto

1. Fermare il server locale con Ctrl+C. In PowerShell:

   ```powershell
   Set-Location "$env:USERPROFILE\Projects\aula-platform"
   git switch feat/web-study-generation
   ```

2. Estrarre lo ZIP. Copiare il contenuto di `update` nella directory del
   progetto, confermando le sostituzioni. Sono modificati due file applicativi
   e viene aggiunta questa guida; nessuna dipendenza, variabile o tabella nuova.

3. Verificare, un comando alla volta e fermandosi al primo errore:

   ```powershell
   npm.cmd run lint
   npm.cmd run build
   git diff --check
   git add -- src/app/contribuisci/page.tsx src/lib/study/web-server.ts docs/DIAGNOSTICA_CONFIGURAZIONE.md
   git commit -m "fix: check study configuration at request time with safe diagnostics"
   git push origin feat/web-study-generation
   ```

   Nella build `/contribuisci` deve risultare `ƒ`, cioè renderizzata alla
   richiesta. Non è necessario eseguire `npm ci` per questa correzione.

## Leggere il risultato remoto

1. Nel progetto Vercel Aula aprire Deployments e attendere Ready per il nuovo
   commit del ramo `feat/web-study-generation`, ambiente Preview.
2. Aprire `/contribuisci` da quel deployment, ricaricare con Ctrl+F5 ed entrare
   nel proprio account se necessario.
3. Se gli strumenti rimangono disattivati, aprire Logs del progetto, filtrare
   sull'ambiente Preview e sul nuovo deployment; cercare `AULA_STUDIO_CONFIG`.
   Ricaricare la pagina mentre i log sono aperti se occorre.

Esiti:
- `[AULA_STUDIO_CONFIG] OK`: le variabili superano i controlli locali di forma.
  Non certifica autorizzazioni o validità effettiva dei token presso i servizi.
- `...: assente o vuota`: la variabile non è disponibile con un valore non vuoto
  nel deployment aperto. Controllare ambiente e possibile filtro di branch.
- `SUPABASE_SECRET_KEY: formato non valido`: richiesta una chiave `sb_secret_`,
  non una chiave legacy JWT `service_role` né la publishable key.
- `CLOUDFLARE_ACCOUNT_ID: formato non valido`: richiesti 32 caratteri esadecimali.

Se compare un problema, sostituire soltanto il relativo valore Preview tramite
Edit e Save. Incollare il valore senza `NOME=`, senza virgolette esterne.
Poi eseguire un nuovo Redeploy del ramo corretto: le variabili modificate
non aggiornano i deployment esistenti. Non trasformare le chiavi in Config.
Per l'assistenza è sufficiente la riga con prefisso `AULA_STUDIO_CONFIG`;
non condividere l'intero ambiente o dump dei valori.

Se ricompare il pulsante, usare il PDF già salvato: Genera strumenti di studio,
poi Apri strumenti di studio. Il percorso PDF/archivio non è cambiato.

## Verifiche eseguite qui

- Lint e build Next 16.4.3 riusciti; `/contribuisci` risulta dinamica.
- Sei scenari su server Next di produzione reale: tre segreti assenti, chiave
  Supabase di formato errato, account Cloudflare di formato errato, token
  assente, segreti aggiunti solo a runtime, spazi esterni ai valori.
- Risposte e prop del componente coerenti con la configurazione runtime;
  pagina senza cache; nomi diagnostici attesi nei log; marcatori dei valori
  server assenti da HTML e log.
- Sette test esistenti del generatore web superati, con provider simulato.
- Nessuna chiamata ai servizi Supabase o Cloudflare dell'utente eseguita qui.
  La diagnosi della configurazione reale su Vercel resta da completare.
