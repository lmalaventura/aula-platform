import type { StudyBank } from "./bank.ts";
const questions = [
  {
    question: "Dove vengono conservati i risultati di questo allenamento?",
    choices: [
      "Nel browser utilizzato",
      "In un registro ufficiale dell’ateneo",
      "Nel PDF degli appunti",
      "In un messaggio inviato al docente",
    ],
    correctIndex: 0,
    explanation:
      "Questo flusso salva i dati nel browser e non li sincronizza fra dispositivi.",
  },
  {
    question:
      "Durante una sessione con timer, cosa succede chiudendo la scheda?",
    choices: [
      "Il tempo viene raddoppiato",
      "Il timer viene azzerato",
      "La scadenza rimane quella iniziale",
      "Le risposte vengono pubblicate",
    ],
    correctIndex: 2,
    explanation:
      "La scadenza è un istante assoluto: il tempo continua anche con la scheda chiusa.",
  },
  {
    question: "Il risultato di una sessione equivale al voto dell’esame reale?",
    choices: [
      "Sì, sempre",
      "No, è soltanto un’autovalutazione sulle domande disponibili",
      "Solo se tutte le risposte sono corrette",
      "Solo se si usa il timer",
    ],
    correctIndex: 1,
    explanation:
      "Quantità e difficoltà dipendono dalla banca. Non è una valutazione certificata o una riproduzione dell’esame.",
  },
  {
    question: "Quale azione riprende una sessione già salvata?",
    choices: [
      "Caricare un nuovo PDF",
      "Cambiare account Cloudflare",
      "Scaricare il progetto",
      "Premere Riprendi la sessione nello stesso browser",
    ],
    correctIndex: 3,
    explanation:
      "La sessione locale si riapre nello stesso browser e sulla stessa versione della banca.",
  },
  {
    question:
      "Quando si seleziona un concetto della mappa, cosa può essere consultato?",
    choices: [
      "Spiegazione, relazioni e fonte",
      "Una password del servizio AI",
      "Un voto ufficiale",
      "Una nuova registrazione obbligatoria",
    ],
    correctIndex: 0,
    explanation:
      "Il lettore della mappa presenta spiegazioni, collegamenti e pagine fonte dei contenuti pubblicati.",
  },
  {
    question: "A cosa serve la trascrizione di un episodio audio?",
    choices: [
      "Ad aumentare il volume",
      "A leggere il contenuto e confrontarlo con le fonti",
      "A cambiare il nome della materia",
      "A cancellare i risultati dei quiz",
    ],
    correctIndex: 1,
    explanation:
      "La trascrizione rende il contenuto consultabile anche come testo e mantiene il collegamento alle fonti.",
  },
  {
    question: "Che cosa rappresentano le frecce di una mappa concettuale?",
    choices: [
      "Un timer",
      "Un voto",
      "Relazioni fra concetti",
      "Un elenco di account",
    ],
    correctIndex: 2,
    explanation:
      "Ogni collegamento della mappa esprime una relazione etichettata fra due concetti.",
  },
  {
    question: "Che cosa consente il pulsante del capitolo in un podcast?",
    choices: [
      "Di generare una nuova lezione",
      "Di pubblicare un PDF",
      "Di cambiare corso automaticamente",
      "Di spostare la posizione di ascolto",
    ],
    correctIndex: 3,
    explanation:
      "I capitoli indicano posizioni dell’audio; il pulsante porta al tempo indicato.",
  },
];
export const practiceDemoBank: StudyBank = {
  schemaVersion: 1,
  subjectSlug: "demo-tecnica",
  sourceId: "demo-tecnica",
  sourceSha256: "0".repeat(64),
  sourceTitle: "Testo dimostrativo dell’interfaccia",
  sourceUrl: "/materials/demo/demo.pdf",
  publishedAt: "2026-01-01T00:00:00.000Z",
  reviewedAt: "2026-01-01T00:00:00.000Z",
  coveredUnits: 1,
  availableUnits: 1,
  topics: [
    { id: "t-0000000000000001", title: "Funzionamento della sessione" },
    { id: "t-0000000000000002", title: "Uso degli strumenti" },
  ],
  quiz: questions.map((q, i) => ({
    ...q,
    id: `q-${(i + 1).toString(16).padStart(16, "0")}`,
    topicId: i < 4 ? "t-0000000000000001" : "t-0000000000000002",
    page: 1,
    quote:
      "Dati tecnici dimostrativi: descrivono il funzionamento dell’interfaccia, non gli appunti di un insegnamento.",
  })),
  flashcards: [
    {
      id: "f-0000000000000001",
      topicId: "t-0000000000000001",
      front: "Dove si salvano i dati di questa demo?",
      back: "Nel browser, separati dai risultati delle materie.",
      page: 1,
      quote:
        "Dati tecnici dimostrativi, separati dai risultati di studio delle materie.",
    },
  ],
};
