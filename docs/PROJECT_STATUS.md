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

## Pubblicazione
- Repository GitHub: non ancora verificato.
- URL pubblico: non ancora verificato.
- Hosting scelto: Vercel Hobby per la demo personale non commerciale.
- Prossimo passo: commit, pubblicazione GitHub, importazione Vercel, prova del dominio pubblico.

## Funzioni future
Upload web, autenticazione, approvazioni, strumenti didattici e integrazioni AI.
