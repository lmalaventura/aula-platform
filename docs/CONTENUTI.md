# Gestione dei contenuti

## Configurare il sito

src/content/site.json contiene nome del prodotto, descrizione, istituzione,
corso di studio e dichiarazione di indipendenza. Il nome è usato anche nella
homepage, nel menu, nel footer e nei titoli delle pagine; il simbolo testuale
nel menu usa la sua prima lettera. Il favicon rimane quello del template iniziale.

## Aggiungere un insegnamento

In src/content/subjects.json aggiungere un oggetto con:

- slug: identificatore URL univoco, lettere minuscole, numeri e trattini.
- label: sigla breve da mostrare nella scheda.
- title: nome dell'insegnamento.
- description: descrizione dello spazio di studio.

Usare il formato delle voci esistenti. Lo slug diventa /insegnamenti/SLUG:
modificarlo cambia l'indirizzo. Un nuovo insegnamento non richiede una nuova
pagina TSX; il modello condiviso viene generato alla build.

## Aggiungere una categoria

In src/content/categories.json aggiungere id e title. L'id deve essere univoco
e rispettare lo stesso formato degli slug. Le categorie prive di materiali
non vengono mostrate nelle pagine delle materie; rimangono disponibili nei filtri.

## Aggiungere un PDF

1. Copiare il PDF in public/materials/SLUG-MATERIA/NOME-FILE.pdf.
2. Usare nomi minuscoli con lettere, numeri e trattini, senza spazi.
3. Aggiungere una voce in src/content/resources.json usando una delle esistenti
   come riferimento e compilando tutti i campi del tipo StudyResource.
4. id deve essere univoco; subjectSlug e categoryId devono esistere nei rispettivi JSON.
5. fileUrl è il percorso pubblico, per esempio
   /materials/machine-learning/appunti-machine-learning.pdf: non contiene public.
6. pageCount è il numero totale di pagine del PDF, compresi frontespizio e indice.
7. byteSize è la dimensione esatta del file in byte. Si può leggere in PowerShell:

```powershell
(Get-Item -LiteralPath ".\public\materials\machine-learning\appunti-machine-learning.pdf").Length
```

Compilare title, description, authors, academicYear, status, provenance e reviewNote
con informazioni attendibili. Una sintesi editoriale non va presentata come
programma ufficiale. Non presumere che un documento sia stato revisionato dal docente.

version e updatedAt possono essere null: sono indicazioni dichiarate sul contenuto,
non la data automatica di compilazione del PDF. Non inventarle.

Tutti i PDF in public sono destinati alla consultazione tramite URL pubblico.
L'MVP non ha un'area riservata né un workflow di approvazione dei caricamenti.

## Aggiornare un PDF esistente

Sostituire il file e aggiornare pageCount e byteSize. Compilare versione e data
se definite realmente. Conservare id e fileUrl per mantenere stabili i collegamenti.
Per aggiornare anche gli indici e i conteggi della piattaforma occorre una nuova build.

## Controlli esistenti

Il catalogo controlla slug duplicati o malformati, riferimenti a materia/categoria,
formato dei percorsi locali, esistenza del file, numero di pagine positivo e dimensione.
Il numero di pagine non viene ricalcolato automaticamente dal sito; la correttezza
scientifica dei contenuti non viene certificata da questi controlli tecnici.

## Verifica e pubblicazione dell'aggiornamento

Eseguire dalla radice del progetto, fermandosi in caso di errore:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd start
```

Provare materia, ricerca, lettura e download. Poi fermare con Ctrl+C e verificare
le modifiche con git diff --check e git status --short. Registrare file e metadati
nello stesso commit, poi eseguire Push origin da GitHub Desktop.
Con l'integrazione Vercel configurata, controllare l'esito del nuovo deployment.
