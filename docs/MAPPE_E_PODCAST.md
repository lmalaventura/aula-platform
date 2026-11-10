# Mappe concettuali e podcast: lettori e redazione

Questo incremento parte da `feat/shared-study`, commit `d069225`. Aggiunge le
basi funzionanti dei due strumenti senza richiedere generazione AI, nuovi
account, variabili, migrazioni o dipendenze applicative.

## Cosa può fare lo studente

Dalla materia → Studia e ripassa sceglie fra gli strumenti pubblicati. Le
modalità senza contenuti non hanno pulsanti inattivi. Una mappa o un episodio
può essere disponibile anche se la banca quiz non è ancora pronta.

- Mappa: concetti selezionabili, frecce direzionali, spiegazioni, relazioni
  etichettate e pagina fonte. Vista elenco alternativa al grafo, tastiera e zoom.
- Podcast: audio MP3/WAV, velocità, capitoli con salto temporale, trascrizione,
  download e rimandi alle pagine fonte. L'audio non parte automaticamente.
- Provenienza originale o con supporto AI; audio registrato o sintetizzato;
  autore/redattore e data di revisione.

I lettori sono gli stessi per tutte le materie. Le visite non chiamano il
modello e non richiedono account. Le attività pubblicate sono distribuite da
Vercel insieme al resto del sito, anche con il PC della redazione spento.

## 1. Applicare l'incremento sul portatile

Aprire PowerShell. Fermare dev con Ctrl+C, se è in esecuzione.

```powershell
Set-Location "$env:USERPROFILE\Projects\aula-platform"
git switch -c feat/learning-tools
explorer.exe .
```

Il ramo deve partire dal checkpoint `d069225` appena salvato. Se esiste già,
usare `git switch feat/learning-tools` senza ricrearlo. Estrarre lo ZIP e
copiare il contenuto di update nella directory del progetto, confermando le
sostituzioni. Non creare una sottocartella update. I file locali esclusi dal
precedente commit non vengono cancellati.

## 2. Una prova completa senza consumare quota

```powershell
npm.cmd run dev
```

Aprire http://127.0.0.1:3000/redazione e scendere a **Mappe e podcast**.

1. **Prova la mappa dimostrativa**: selezionare un concetto, leggere le
   relazioni, provare Elenco dei concetti e zoom. La demo descrive il lettore,
   non gli appunti di Machine Learning.
2. **Prova l'audio dimostrativo**: è un segnale sonoro di tre secondi,
   esplicitamente privo di lezione parlata. Provare play/pausa, velocità,
   trascrizione e Vai al capitolo 2.
3. Le demo esistono solo nell'anteprima locale e non creano materiali nel
   catalogo. Il server rifiuta la pubblicazione di contenuti marcati demo.

Questa prova verifica i lettori anche con Cloudflare bloccato. Non occorre
inventare contenuti didattici o dichiararli approvati per mostrare una demo.
La generazione automatica di mappe, sceneggiature e voci rimane un incremento
successivo: qui non è presentata come già disponibile.

## 3. Preparare un contenuto reale dalla redazione

### Mappa

- Scegliere Materia degli strumenti → Nuova mappa.
- Compilare titolo, descrizione, autore/redattore e provenienza.
- Inserire i concetti, le spiegazioni e le pagine fisiche del PDF fonte.
- Inserire relazioni fra i concetti: il testo indica il significato della
  freccia, ad esempio una relazione di inclusione o una condizione.
- Mostra anteprima dello strumento, poi Salva bozza dello strumento.

Non basta trasformare l'indice del PDF in nodi: i collegamenti devono esprimere
relazioni concettuali verificabili nelle fonti. La validazione del formato non
sostituisce questa valutazione editoriale.

### Podcast

- Nuovo episodio → metadati comuni.
- Scegliere un MP3 o WAV, massimo 10 MB. Indicare se la voce è registrata o
  sintetizzata; i due casi non vengono confusi con la provenienza del testo.
- Inserire titolo, trascrizione e pagina fonte di ogni capitolo.
- I tempi sono espressi in secondi: primo capitolo a zero, successivi in ordine
  crescente. Ascoltare il file e controllare che tutti i tempi siano corretti.
- Salvare e riascoltare dall'anteprima.

L'audio della bozza resta privato nel progetto locale. Il nome originale del
file non viene usato come percorso; il salvataggio usa l'impronta del contenuto.
Sono controllati dimensione, intestazione e integrità, non eseguita una scansione
antimalware né una verifica semantica dell'audio.

### Importazione e riuso

**Importa contenuto JSON** legge lo stesso formato del modulo: è il punto di
integrazione per una futura generazione automatica comune. Il JSON contiene il
contenuto, non codice eseguibile; non permette di imporre percorsi, fonti o date
di approvazione. L'audio di un nuovo episodio si sceglie separatamente.

Non è necessario scrivere JSON: il modulo crea e modifica gli stessi dati.
Per una nuova materia cambia la configurazione della fonte, non il lettore.
Il contratto è in src/lib/learning-tools/schema.ts.

## 4. Revisione e pubblicazione

La bozza si può riaprire dal selettore dopo reload. Modificarla non sostituisce
subito la versione pubblica. Dopo il salvataggio, controllare l'anteprima,
spuntare la conferma della revisione e premere **Pubblica lo strumento nel
progetto**. Il server verifica che bozza e PDF non siano cambiati nel frattempo.

Aprire **Apri lo studio della materia**: lo strumento deve comparire insieme
alle altre modalità disponibili, senza accesso. **Ritira lo strumento dal
progetto** rimuove la versione pubblicata e conserva la bozza. Un audio ancora
usato da un altro episodio pubblicato viene mantenuto.

Pubblicazione e ritiro sono modifiche ai file locali: commit, push e deployment
aggiornano il sito online. Un ritiro non può cancellare copie già scaricate.
Non è un sistema di revoca di documenti distribuiti.

Se cambia il PDF fonte, gli strumenti riferiti alla vecchia impronta non sono
presentati come aggiornati. Riaprire la bozza, controllare contenuto e pagine,
salvare e approvare una nuova versione. La vecchia approvazione non viene
trasferita automaticamente alla fonte nuova.

## 5. Controllo e salvataggio del blocco

Fermare dev e lanciare una volta:

```powershell
npm.cmd run check
git diff --check
```

Dopo la verifica dell'intero incremento:

```powershell
git add -- src scripts docs public README.md next.config.ts package.json ':(exclude)src/content/study-kits/*.json' ':(exclude)scripts/check-ai.mjs'
git --no-pager diff --cached --stat
git commit -m "feat: add concept maps and podcast tools with local editorial workflow"
git push -u origin feat/learning-tools
```

Il comando include gli audio effettivamente pubblicati in public/media/study;
non aggiunge .aula o credenziali. Controllare che le banche eventualmente
aggiunte siano contenuti reali revisionati. Le demo locali non producono questi
file. L'anteprima Vercel sarà quella del nuovo ramo; integrare in master dopo la
verifica complessiva, senza pubblicare ogni micro-modifica.

## Struttura e cambio computer

| Percorso | Contenuto |
| --- | --- |
| src/lib/learning-tools | Contratto e lettura dei contenuti pubblicati |
| scripts/learning-tools | Salvataggio, revisione, pubblicazione, test |
| src/content/learning-tools/{materia} | JSON dei singoli strumenti approvati |
| public/media/study/{materia} | Audio pubblicati, nome basato sull'impronta |
| .aula/editor-tools | Bozze e audio locali non pubblicati, ignorati da Git |

Sul secondo PC gli strumenti già pubblicati si riaprono direttamente dai file
versionati; l'audio può essere ricostruito dalla copia pubblicata. Le bozze non
pubblicate richiedono invece un trasferimento privato di .aula/editor-tools.
Questo si aggiunge al backup delle bozze quiz in .aula/editor già documentato.

La redazione resta solo locale con Host/Origin/token, limite della richiesta e
protezione iframe. La nuova API risponde 404 in produzione. Non esporre dev in
rete o attraverso tunnel. Lo studio pubblico non utilizza questa API.
