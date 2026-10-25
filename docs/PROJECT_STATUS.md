# Aula — Stato del progetto

## Obiettivo
Piattaforma collaborativa di apprendimento universitario.
Primo contesto: magistrale in Informatica e Innovazione Digitale, UniUrb.

## Decisioni
- Next.js App Router 16.4.3, React 19.3.0, TypeScript e Tailwind CSS.
- Node.js 24 LTS e npm; conservare package-lock.json.
- Un'unica applicazione, senza database o autenticazione per il primo MVP.
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
- MVP iniziale pubblicato e utilizzabile. Aggiornare contenuti e raccogliere riscontri prima di ampliare il perimetro.

## Funzioni future
Upload web, autenticazione, approvazioni, strumenti didattici e integrazioni AI.

