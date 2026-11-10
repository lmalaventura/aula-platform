# Aula — Stato del progetto

## Obiettivo
Piattaforma collaborativa di apprendimento universitario.
Primo contesto: magistrale in Informatica e Innovazione Digitale, UniUrb.

## Decisioni
- Next.js App Router 16.4.3, React 19.3.0, TypeScript e Tailwind CSS.
- Node.js 24 LTS e npm; conservare package-lock.json.
- Un'unica applicazione; il primo MVP pubblico è statico. L’incremento di caricamento aggiunge un backend Supabase riservato.
- Identita e corso di studio in src/content/site.json.
- Insegnamenti, categorie e risorse nei rispettivi JSON di src/content/.
- Accesso ai contenuti tramite src/lib/catalog/.
- PDF locali in public/materials/, visualizzazione nativa e download.
- Pagine generate alla build, compresa /materiali.
- Ricerca e filtri nel browser, su metadati pubblici ricevuti dalla pagina server.
- Interfaccia italiana, tema chiaro, nome Aula provvisorio.
- Progetto studentesco indipendente dall'ateneo.

## Stato verificato su Windows prima di questo aggiornamento
- Homepage, catalogo, materie, risorse PDF, pagina 404.
- Lettura e download dei due appunti reali confermati dall'utente.
- Lint e build: codice 0, confermati dal log.
- Commit risorse: edce757, working tree pulito al termine del commit.

## Incremento ricerca
- Nuova pagina /materiali raggiungibile dal menu condiviso.
- Ricerca in titolo, descrizione, autore, materia, categoria e anno accademico.
- Maiuscole/minuscole e accenti non distinguono i risultati.
- Piu parole si combinano: devono essere tutte presenti nei metadati della risorsa.
- Filtri per insegnamento e categoria, combinati con la ricerca.
- Conteggio risultati, stato vuoto e azzeramento dei filtri.
- Schede riutilizzate con indicazione di materia/categoria.
- Lettura e download disponibili anche dai risultati.
- Nessuna nuova dipendenza o modifica ai PDF.
- Il testo interno dei PDF non e indicizzato.
- Filtri in memoria della pagina, non memorizzati in URL o account.
- Verifica manuale Windows: ricerca, filtri, azzeramento, lettura e download confermati.

## Revisione prima della pubblicazione
- Sorgenti effettivi ricevuti nello ZIP del commit b21d31434eb2623b65830868516caddedbd16daf.
- Lint e build riusciti nell'ambiente di revisione con package-lock.json originale.
- npm audit: zero vulnerabilità note segnalate al momento del controllo.
- Ricerca, filtri, lettura, download e homepage provati sui sorgenti effettivi.
- Nome configurato usato anche nel testo della homepage e nel simbolo del menu.
- Nomi accessibili corretti per rispettare il testo visibile di collegamenti e pulsanti.
- Accessibilità automatica: zero violazioni rilevate nei 16 casi esaminati; restano verifiche manuali.
- README e guide CONTENUTI/PUBBLICAZIONE aggiunti.
- Regole LF per i file di testo in .gitattributes.
- Licenze del codice e dei materiali ancora da definire; nessuna nuova licenza assegnata.

## Pubblicazione verificata
- Repository GitHub: https://github.com/lmalaventura/aula-platform
- Ramo di produzione: master.
- URL pubblico: https://aula-platform-phi.vercel.app/
- Hosting: Vercel; piano previsto per la demo personale non commerciale: Hobby.
- Codice applicativo verificato: commit d5c6ede89bc3188f610eb328b668e7e6d4e1d52e.
- Stato Vercel associato al commit su GitHub: Deployment has completed.
- Verifica esterna del 25 ottobre 2026 senza sessione autenticata: 17 controlli superati.
- Homepage, catalogo, pagine delle materie e risorse accessibili senza login.
- Ricerca, filtri combinati, stato vuoto e azzeramento verificati sul sito pubblico.
- Download di entrambi i PDF verificati mediante confronto SHA-256 con gli originali.
- Pagine principali: HTTP 200; indirizzi inesistenti provati: HTTP 404.
- Materiali verificati a 320, 390, 768 e 1440 px e mediante tastiera.
- Prove della pagina di lettura e del contenuto alternativo; anteprima PDF nativa confermata dall'utente sul proprio browser.
- MVP iniziale pubblicato e utilizzabile. Il successivo checkpoint concordato richiede strumenti di studio automatici prima della condivisione ai compagni.

## Obiettivo aggiornato — 28 ottobre 2026
- Caricare le fonti deve portare a strumenti di studio con configurazioni comuni.
- Studenti e collaboratori non devono scrivere codice, prompt o domande per materia.
- Consultazione per materia e argomento: appunti, flashcard, quiz, mappe, audio e simulazioni d'esame.
- Prove passate e resoconti degli appelli saranno fonti distinguibili per provenienza.
- Nessun addestramento separato per corso: le fonti forniscono il contesto.
- Manutenzione ridotta, contenuti salvati e aggiornamento delle sole raccolte da rielaborare.
- Area di caricamento e accesso collaboratori anticipati nella roadmap.
- Il primo incremento verifica la generazione reale prima di introdurre upload, database e code remote.

## Incremento studio automatico — preparato per verifica sul portatile
- Collegamento reale a Workers AI confermato dall'utente tramite check-ai.mjs.
- Generatore unico per tutti i PDF di resources.json, senza domande o prompt per materia.
- Quattro pagine di contenuto al massimo per PDF, selezionate tra le prime venti con esclusione euristica degli indici.
- Sei flashcard e quattro quesiti per raccolta; limite intenzionale per la prima prova.
- Citazioni controllate nel testo estratto; formato, duplicati e riferimenti controllati.
- Un solo tentativo aggiuntivo su output strutturalmente non valido; nessun retry automatico dopo errori API o di rete.
- Scrittura atomica e impronte: risultati riutilizzati se aggiornati, precedenti conservati se la nuova generazione fallisce.
- Pagina /insegnamenti/[slug]/studio, flashcard e quiz con spiegazioni, collegamenti e citazioni.
- Risultati assenti: stato vuoto esplicito. PDF cambiato: raccolte precedenti escluse dalla nuova build.
- Nessuna chiamata AI nel browser, durante la build o durante la lettura delle attivita.
- Credenziali solo in .env.local; nessuna chiave richiesta a Vercel per questo incremento.
- Estrazione effettiva verificata sui PDF reali: ML pagine 4, 6, 7, 8; dispositivi mobili 4, 5, 6, 7.
- Generazione reale di quiz/flashcard e correttezza disciplinare ancora da verificare con l'account dell'utente.
- Procedura temporaneamente da terminale: l'upload web e l'elaborazione remota automatica non sono ancora implementati.
- Nessun quiz dimostrativo inserito come contenuto reale nel pacchetto.
- Verifiche nell'ambiente di sviluppo: lint e compilazione con TypeScript riusciti.
- Quattordici test Node superati, inclusa l'estrazione effettiva dei PDF.
- Cinque prove del flusso CLI con provider simulato: estrazione senza rete, generazione per entrambe le materie, riuso, rifiuto di output non validi e gestione quota.
- Diciannove verifiche delle funzioni esistenti superate: ricerca, navigazione, PDF, responsive e tastiera.
- Undici verifiche della nuova interfaccia superate con raccolte sintetiche di test, non incluse nel pacchetto.
- Zero violazioni rilevate da axe nei dieci stati della nuova interfaccia esaminati; non equivale a certificazione di accessibilita.
- Stato vuoto e raccolta obsoleta provati mediante build di produzione.
- npm audit: zero vulnerabilita note segnalate il 28 ottobre 2026; le versioni delle dipendenze preesistenti non sono cambiate.

## Attivita successive
- Verificare output reali e qualita didattica prima di pubblicare questo incremento.
- Collegare caricamento, archivio persistente ed esecuzione remota al generatore comune.
- Estendere a organizzazione per argomento, mappe, audio e simulazioni d'esame.
- Validazione disciplinare approfondita, gestione community e moderazione in incrementi successivi.

## Correzione dei riferimenti — 28 ottobre 2026
- Prima generazione reale: Machine Learning salvato con sei flashcard e quattro domande, confermato dal log dell'utente.
- Dispositivi mobili rifiutato dopo due risposte per una citazione non corrispondente alla pagina indicata; contenuto rifiutato originale non disponibile per un confronto puntuale.
- Modifica del protocollo: passaggi preparati dal codice, sourceId scelto dal modello, pagina/citazione recuperate dal codice.
- Controllo letterale invariato; ID non forniti rifiutati; nessun ripiego o confronto approssimativo.
- Formato finale e fingerprint v1 compatibili: Machine Learning gia valido viene riutilizzato.
- Rapporti locali delle risposte rifiutate in .aula/diagnostics/, esclusi da Git e privi di token.
- Diciotto test Node e compilazione con TypeScript superati nell'ambiente di sviluppo.
- Prova reale del protocollo corretto su Cloudflare ancora da eseguire sul portatile.

## Revisione dei primi contenuti reali e procedura v2 — 28 ottobre 2026
- L'utente ha confermato build riuscita e log di lint/diff senza segnalazioni sul portatile.
- Entrambi i JSON reali ricevuti e verificati contro SHA-256 e testo dei PDF originali.
- Mobili, quiz 2: alternativa indicata come corretta riduce l'interfaccia utente agli elementi grafici, contraddicendo la fonte che ammette interfacce non grafiche.
- Mobili: tutte e quattro le domande del quiz ripetono i fronti delle flashcard; alcune citazioni terminano prima della definizione.
- ML, quiz 2: formula illeggibile copiata dall'estrazione PDF. Presente anche sillabazione tipografica nelle spiegazioni.
- Correttezza dei riferimenti letterali distinta dalla correttezza e utilita didattica degli output.
- Istruzioni comuni rafforzate: applicazione dei concetti, distrattori plausibili, coerenza fra alternativa/spiegazione, rispetto dell'ambito delle definizioni.
- Nuovi controlli deterministici di forma e leggibilita; nessuna dichiarazione di verifica disciplinare automatica.
- Estratti preferibilmente delimitati da frasi; verificati gli esempi di definizione di processo e interfaccia non grafica nei PDF reali.
- Versione procedura study-v2: rigenerazione automatica delle due raccolte tramite il comando normale, senza cancellare i file precedenti.
- Ventidue test Node, lint e build con TypeScript superati nell'ambiente di sviluppo.
- Cinque prove del flusso con provider simulato: rifiuto di output malformati, conservazione dei campioni originali, aggiornamento v1-v2, riuso e gestione errore API.
- Nuovi output reali v2 ancora da verificare prima del commit e della pubblicazione.

## Caricamento web riservato — 30 ottobre 2026
- Checkpoint concordato: completare upload e persistenza prima di aggiungere altri generatori.
- Supabase Auth, Postgres e Storage privato; SDK MIT 2.118.0 fissato, nessuna CLI obbligatoria.
- Pagina /contribuisci, account creati dall’amministratore, allowlist non modificabile dai collaboratori.
- Materia, titolo, autore, conferma diritti e PDF fino a 5 MB; stessi moduli per tutti gli insegnamenti.
- File e metadati riservati al proprietario abilitato tramite RLS, senza service key nel browser o in Vercel.
- Prenotazioni recuperabili dopo interruzioni, verifica del salvataggio, download autenticato ed eliminazione confermata.
- SHA-256 nel browser per deduplicazione per proprietario/materia; firma PDF nel browser, limite/MIME in Storage, verifica remota dei metadati. Non è un’analisi di sicurezza o validazione disciplinare del file.
- Upload non pubblicati e non inviati all’AI: collegamento remoto al generatore nello step successivo.
- Catalogo e PDF pubblici esistenti rimangono statici; materie selezionate dal catalogo comune.
- Configurazione Supabase e prova reale sul portatile confermate dall’utente il 30 ottobre 2026: accesso, upload, persistenza dopo ricaricamento, download e uscita. Credenziali non disponibili nell’ambiente di sviluppo.
- Piano Free: il backend può essere sospeso dopo una settimana di inattività, riattivabile dal dashboard.
- Guida operativa: docs/CARICAMENTO_WEB.md, con controlli e configurazione Vercel per il successivo deployment.
- Verifiche del codice: 10 test Node del caricamento e 22 test dello studio superati; lint e build Next con TypeScript riusciti.
- Quindici prove SQL superate su PGlite/Postgres con fixture Auth/Storage, incluse separazione proprietari, revoca, ordine di eliminazione e rifiuto di stato modificato dal browser.
- Dodici prove browser superate con risposte HTTP simulate, incluse persistenza sessione, duplicati, recupero e responsive a 320/390/768/1440 px.
- Zero violazioni axe negli undici stati configurati esaminati e nello stato senza configurazione; non è una certificazione di accessibilità.
- npm audit del 30 ottobre 2026: zero vulnerabilità note; nessuna versione di dipendenza preesistente modificata.

## Checkpoint prima della pubblicazione dell’area collaboratori — 30 ottobre 2026
- L’utente ha confermato i risultati attesi di test/installazione e il funzionamento dell’intero percorso di configurazione e caricamento reale.
- GitHub ricontrollato: master è ancora al commit 8b0711d49b3a56476f4a718d122b452b61620a18, unico ramo remoto osservato. Gli incrementi studio/upload non sono ancora sul repository pubblico.
- Stato Git del portatile ricevuto: ramo feat/study-generation sul commit 8b0711d, nessun file staged; .env.local ignorato, due JSON delle attività ancora non tracciati.
- Da configurare le due variabili pubblicabili Supabase su Vercel e verificare l’area sul dominio pubblico.
- Le raccolte didattiche v2 reali restano da revisionare; pubblicare il codice dell’area non ne attesta la correttezza.
- Passo successivo al checkpoint online: parsing remoto dei PDF caricati e collegamento al generatore comune, con risultati persistenti.

## Correzione del client browser — 30 ottobre 2026
- Log Windows: avvisi Multiple GoTrueClient e attributo data-scroll-behavior mancante.
- Riproduzione in Next dev: sette avvisi client duplicato e un avviso di scorrimento dopo tre rientri nella pagina; nessun errore JavaScript bloccante.
- Client inizializzato nell’effetto del componente e riutilizzato tramite cache del browser per URL/chiave pubblicabile, senza cache nel processo server.
- Rimosso il costruttore SDK dall’inizializzatore useState, che può essere eseguito due volte in Strict Mode.
- Aggiunto data-scroll-behavior="smooth" al layout, come richiesto da Next per la regola CSS già presente.
- Verifica successiva in Next dev: quattro rientri nella pagina e Fast Refresh, zero avvisi dei due tipi e zero errori JavaScript; una sola istanza osservata nella cache browser.
- Staging preparato per escludere i JSON delle attività ancora da revisionare e lo script diagnostico check-ai.mjs; .env.local resta ignorato.
- Commit, push e deployment dell’incremento ancora da eseguire sul portatile.
- Procedura Git provata su un repository temporaneo: il codice e il README delle raccolte sono staged, i JSON delle attività, .env.local e check-ai.mjs sono esclusi.
- Correzione verificata anche con lint, build di produzione e dodici prove browser del caricamento con API simulate; zero violazioni axe negli undici stati esaminati.

## Verifica sul portatile — 2 novembre 2026
- Lint, build e controllo delle modifiche confermati dall'utente.
- Correzione degli avvisi Supabase e scorrimento verificata dall'utente.
- Da verificare l'anteprima Vercel dopo il push del ramo.

## Generazione web da upload — 2 novembre 2026
- L’utente ha confermato il funzionamento dell’anteprima upload. Il commit 303bf5c è stato pubblicato, seguito dalla pulizia 624630d del file accidentale s.
- Ritmo concordato: incrementi funzionali completi e una verifica dell’utente a fine blocco; evitare checkpoint per ogni dettaglio.
- Promozione dell’upload in master e nuovo ramo feat/web-study-generation proposti; esecuzione sul portatile non ancora confermata.
- Nuovo flusso: salvataggio PDF → API autenticata → lavoro sul server dopo la risposta → risultati privati persistenti → interfaccia quiz/flashcard comune.
- Stessa procedura study-v2 del CLI: quattro pagine selezionate, sei flashcard e quattro quesiti. Nessuna implementazione per materia o nuovo addestramento.
- Verifica server di firma/dimensione/SHA-256 prima del provider. Autorizzazione e proprietà verificate prima dell’uso della chiave privilegiata.
- Migrazione 202611020001_web_study.sql: job privati, vista stati, claim e conferma riservati a service_role; cinque nuove elaborazioni per account in 24 ore; riuso senza chiamate AI.
- after di Next, maxDuration 300; supporto Vercel Fluid verificato nella documentazione. Non è una coda durabile: job interrotti riprovabili dopo sei minuti, senza retry infiniti.
- Nuova SUPABASE_SECRET_KEY solo sul server; Cloudflare già configurato localmente va configurato anche nelle variabili server di Vercel. Nessun segreto nei pacchetti o nel browser.
- PDF.js stessa versione, spostato tra le dipendenze applicative; worker incluso nel tracing della funzione.
- CLI compatibile; il catalogo statico continua a funzionare senza la generazione configurata.
- Prove nell’ambiente di sviluppo: 39 test Node, 12 verifiche SQL con PGlite/fixture Auth e Storage; server Next e browser reali con risposte remote simulate.
- La configurazione e la prima generazione su Supabase/Cloudflare dell’utente sono da verificare; nessuna chiamata reale al modello eseguita qui.
- Guida completa: docs/GENERAZIONE_WEB.md.
- Dieci prove HTTP/browser dell’intero flusso superate, sette stati axe senza violazioni; controlli dei marcatori di segreti nell’HTML e nel JavaScript pubblico superati.
- Tracciamento della funzione verificato: worker PDF incluso, dipendenze tracciate circa 5,22 MB; nessuna versione di dipendenza preesistente cambiata.
- npm audit del 2 novembre 2026: 16 vulnerabilità note segnalate.
- Le 16 segnalazioni moderate dell’audit completo sono propagate da minimatch/ESLint nella catena di sviluppo preesistente; audit runtime zero. Revisione dedicata della catena lint da pianificare, senza downgrade automatici.

## Checkpoint Production e studio per sezioni — 9 novembre 2026

- Utente: correzione configurazione confermata funzionante; dopo la promozione,
  confermato anche il funzionamento sul dominio principale.
- GitHub verificato: master e feat/web-study-generation sul commit acfc1e7;
  nessuna divergenza da recuperare prima del nuovo incremento.
- Nuovo incremento preparato su feat/document-sections nell'ambiente di
  sviluppo: indice del PDF completo entro 250 pagine/un milione di caratteri,
  ricerca nei titoli/testi, raccolte indipendenti sulle sezioni scelte.
- Titoli dai segnalibri del PDF, fallback numerato; parti brevi raggruppate,
  lunghe suddivise entro quattro pagine/frammenti e 18.000 caratteri.
- PDF Machine Learning del repository: 60 pagine esaminate, 35 sezioni
  generabili; pagine escluse esplicitate. Non è una certificazione di copertura
  di ogni concetto, di correttezza scientifica o di fedeltà di formule/figure.
- Indice preparato senza AI; stessa pipeline study-v2 per ciascuna sezione,
  sei flashcard e quattro quesiti per raccolta, con fonti letterali controllate.
- Nessuna nuova dipendenza, variabile, piattaforma o implementazione per materia.
- Nuova migrazione 202611090001_document_sections.sql: firma RPC invariata,
  quota separata di cinque indici e cinque lavori AI in 24 ore per account;
  cache riutilizzata; richieste concorrenti per sezioni diverse segnalate busy.
- Stessa tabella lavori e RLS proprietario/abilitazione; indice nel risultato
  JSON versionato. Il client invia soltanto upload/ID sezione; fonte e versione
  sono selezionate e verificate dal server, con controllo SHA-256 del PDF.
- Raccolte iniziali, generatore CLI e sito precedente compatibili; nessun dato
  o file esistente riscritto. La generazione completa automatica di tutte le
  sezioni rimane futura: ora si sceglie la parte da studiare.
- Verifiche: 47 test Node, lint e build; 12 prove SQL su PGlite/Postgres con
  fixture Auth/Storage; nove verifiche HTTP/browser con server Next e parser
  PDF reali e servizi remoti simulati; sei stati axe senza violazioni.
- Verificato il riuso dopo reload, la sezione oltre pagina quaranta, le fonti
  private, le quote, i rifiuti di accesso/input, il logout e i layout fino a
  320 px. Nessuna chiamata ai servizi reali dell'utente eseguita qui.
- Audit del 9 novembre: zero vulnerabilità note nelle dipendenze runtime;
  otto moderate nel percorso di sviluppo, riconducibili a minimatch/ESLint.
  Nessuna versione di dipendenza modificata; manutenzione separata da pianificare.
- Da fare sul portatile: applicare pacchetto e nuova migrazione, run check,
  prova locale con account reale; poi commit/push del ramo e verifica Preview.
- Istruzioni complete: docs/STUDIO_PER_SEZIONI.md.

## Correzione del prodotto: studio condiviso e redazione

- Richiesta dell'utente: una piattaforma comune di studio, non un generatore
  personale per ogni PDF caricato. Incrementi funzionali completi, con un unico
  checkpoint dell'utente per l'intero percorso.
- Base remota verificata: master/feat/web-study-generation ad acfc1e7. Il ramo
  locale feat/shared-study include anche l'incremento per sezioni già provato
  dall'utente ma non presente nel remoto. Commit e deployment sono da eseguire
  sul suo computer dopo l'applicazione e il controllo del nuovo blocco.
- Una fonte principale configurata per insegnamento in study-sources.json.
  Esami, esercitazioni e progetti rimangono materiali distinti. Le proposte non
  aggiungono automaticamente un'altra dispensa al catalogo.
- Studio pubblico senza account o chiamate AI: banca approvata, selezione di
  tutto il materiale disponibile o di un macroargomento, quiz progressivo,
  spiegazioni/fonti, flashcard e ripasso mirato dagli errori. Nessun numero
  fisso per corso e nessuna equivalenza tra quantità di domande e copertura
  scientifica o del programma d'esame.
- Contribuzione in dialogo dal pulsante + Proponi materiale; accesso dei
  collaboratori conservato per identificare la whitelist. Upload privati in
  attesa di revisione, esiti e indicazioni leggibili dall'autore. Nessuna
  generazione durante il caricamento; POST /api/studio/genera risponde 410.
- Redazione inizialmente locale: study:prepare analizza il PDF completo e
  prepara le parti mancanti con la pipeline comune. Cache per contenuto e
  ripresa del lavoro interrotto; bozze e revisioni in .aula/editor, fuori Git.
  Nessuna nuova dipendenza applicativa o variabile d'ambiente.
- Pagina /redazione e API solo in sviluppo. Dev su 127.0.0.1, controllo Host e
  Origin, token per processo e protezione dagli iframe. In produzione sono
  disabilitate; il sito pubblico continua a funzionare con il PC spento.
- Revisione, esclusione, raggruppamento dei macroargomenti e pubblicazione
  esplicita in src/content/study-banks. Pubblicazione parziale solo con scelta
  esplicita; PDF cambiato senza una banca corrispondente mostra aggiornamento.
  Cambiare le attività annulla la vecchia approvazione; le raccolte identiche
  possono essere riutilizzate anche dopo altre modifiche al PDF.
- Migrazione 202611090002_contribution_reviews.sql: lettura riservata
  all'autore abilitato, scrittura editoriale con service_role, rimozione a
  cascata con l'upload. I dati delle vecchie generazioni non vengono eliminati.
- La redazione può scaricare e valutare i contributi. Accettare per integrazione
  non fonde i documenti: aggiornare il sorgente LaTeX/PDF rimane un intervento
  editoriale. content:sync aggiorna i metadati del PDF senza contarli a mano.
- Nessuna integrazione automatica LaTeX, revisione scientifica automatica o
  scansione antimalware realizzata. L'upload anonimo e la redazione online sono
  incrementi futuri; podcast e mappe non fanno parte di questo blocco.
- Verifiche di integrazione eseguite: 16 controlli SQL con migrazioni reali in
  PGlite/Postgres e fixture Auth/Storage; nove scenari HTTP/browser su Next
  reale, con Supabase simulato e nessuna chiamata a un modello reale. Dieci
  stati axe senza violazioni rilevate, inclusi layout 320/390/768/1440 px.
  Non è una certificazione di accessibilità o di correttezza didattica.
- I dati sintetici delle prove sono esclusi dal pacchetto. La prima banca
  effettiva deve essere preparata con la configurazione Cloudflare dell'utente,
  revisionata e pubblicata. Guida corrente: docs/STUDIO_CONDIVISO.md.
- Controllo finale del codice senza banche sintetiche: 53 test Node superati,
  lint, TypeScript e build di produzione riusciti. Audit runtime eseguito:
  zero vulnerabilità note segnalate; nessuna dipendenza aggiornata.

## Preparazione reale bloccata e diagnostica — 10 novembre 2026

- Log dell'utente: entrambe le materie si interrompono alla prima raccolta;
  tutte le 53 prove, lint e build riescono. Nessun codice HTTP nel messaggio
  disponibile: la causa remota non è ancora determinata.
- Individuata la perdita della diagnostica in scripts/editor/repository.mts:
  il client Cloudflare preserva HTTP e codici, ma prepareDraft li rimpiazzava
  con un messaggio generico. Correzione: riportare solo stato/codici e cause
  di rete riconosciute, senza token, account o messaggi remoti arbitrari.
- Nessun nuovo tentativo automatico, cambio modello o piano; le raccolte già
  pronte rimangono conservate. Configurazione AI mancante fermata alla prima
  parte, evitando di ripetere il medesimo errore su tutte le parti.
- Passo sul portatile: applicare la correzione e riprovare machine-learning
  con --max-units 1; leggere l'errore effettivo prima di modificare il servizio.
  Non serve ripetere le migrazioni o intervenire sul deployment per questa
  preparazione locale.
- Tre regressioni riprodotte prima della correzione e superate dopo: HTTP e
  codici persi, causa di rete nascosta, configurazione mancante ripetuta sulle
  parti successive. Controllo completo finale riuscito: 56 test Node, lint,
  TypeScript e build. Servizio AI simulato; causa dell'errore reale ancora da
  ricevere dal portatile.

## Checkpoint: sviluppo indipendente dalla quota AI
- Codice verificato con lint, test e build.
- Generazione reale bloccata: Cloudflare HTTP 429/4006, quota gratuita esaurita.
- Preparazione completa delle banche e verifica didattica ancora da completare.
- Decisione: salvare il blocco corrente e continuare le funzionalita indipendenti dal provider.
- Prossimo blocco: basi riutilizzabili per mappe concettuali e podcast.
