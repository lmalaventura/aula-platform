# Aula — Stato del progetto

## Obiettivo
Piattaforma collaborativa di apprendimento universitario.
Primo contesto: magistrale in Informatica e Innovazione Digitale, UniUrb.

## Decisioni
- Next.js App Router, React, TypeScript e Tailwind CSS.
- Node.js 24 LTS e npm; conservare package-lock.json.
- Un'unica applicazione, senza database o autenticazione per il primo MVP.
- Contenuti separati dai componenti.
- Configurazione iniziale in src/content/site.json.
- Accesso alla configurazione tramite src/lib/site.ts.
- Interfaccia italiana, inizialmente con tema chiaro.
- Nome Aula provvisorio; progetto indipendente dall'ateneo.

## Incremento corrente
- Homepage e identità visiva iniziale.
- Header condiviso e navigazione alle sezioni.
- Presentazione dei due insegnamenti.
- Nessun materiale ancora disponibile.
- Verifica locale da completare prima del commit.

## Prossimo incremento
- Modello tipizzato del catalogo.
- Dati degli insegnamenti separati dalla configurazione del sito.
- Pagine dedicate agli insegnamenti.
- Successivamente: risorse dimostrative, visualizzazione, download e ricerca.

## Controlli
- Lint e build.
- Navigazione dei collegamenti.
- Layout mobile e navigazione da tastiera.