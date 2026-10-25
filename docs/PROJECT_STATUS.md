# Aula — Stato del progetto

## Obiettivo
Piattaforma collaborativa di apprendimento universitario.
Primo contesto: magistrale in Informatica e Innovazione Digitale, UniUrb.

## Decisioni
- Next.js App Router 16.4.3, React 19.3.0, TypeScript e Tailwind CSS.
- Node.js 24 LTS e npm; conservare package-lock.json.
- Un'unica applicazione; nessun database o autenticazione per il primo MVP.
- Configurazione in src/content/site.json; insegnamenti in subjects.json.
- Risorse e categorie in resources.json e categories.json.
- Accesso ai contenuti tramite src/lib/catalog/.
- PDF locali in public/materials/; sola lettura e download nel primo MVP.
- Pagine di materie e risorse generate alla build.
- Visualizzazione tramite lettore PDF del browser, senza nuove dipendenze.
- Interfaccia italiana, tema chiaro, nome Aula provvisorio.
- Progetto studentesco indipendente dall'ateneo.

## Stato verificato prima di questo aggiornamento
- Homepage, catalogo, pagine delle materie e pagina 404 funzionanti.
- Lint e build: esiti 0 comunicati dall'utente.

## Incremento risorse
- Due PDF reali forniti dall'autore, conservati senza modifiche.
- Risorse raggruppate per categoria nelle pagine delle materie.
- Conteggio dei materiali nelle schede.
- Pagina di lettura /risorse/[id], download e apertura diretta del PDF.
- Autore e anno accademico ricavati dai frontespizi.
- Versione e data di aggiornamento non dichiarate: metadati null.
- Nessuna revisione disciplinare attestata; non si presume qualità certificata.
- Controlli su ID, riferimenti a materia/categoria, percorsi e dimensione file.
- Verifiche sul progetto Windows: lint, build, lettura e download completati.

## Prossimo incremento
- Ricerca e filtri dei materiali.
- Verifiche finali responsive e accessibilità.
- Documentazione repository e pubblicazione online.

## Funzioni future
Upload web, autenticazione, approvazioni, strumenti didattici e integrazioni AI.
