import { SlotPlan } from "./slotPlan";

/** Everything the bot itself (not the language model) says in the chat */
export const messages = {
  askForContact:
    "Ciao! Per sapere chi sei ho bisogno del tuo numero di telefono: tocca il pulsante qui sotto e conferma la condivisione. Se il pulsante non funziona, scrivi /tastiera.",
  askForContactKeyboard:
    "Tocca il pulsante «📱 Condividi il mio numero» qui sotto. Se non lo vedi, apri la tastiera del bot con l'icona accanto al campo del messaggio.",
  shareContactButton: "📱 Condividi il mio numero",
  notOwnContact:
    "Mi serve il tuo numero, non quello di un altro contatto: usa il pulsante qui sotto.",
  welcomeAdmin:
    "Numero verificato: sei tra gli amministratori. Scrivimi cosa ti serve sugli slot, ad esempio: «crea ghiaccio agonismo ogni martedì e giovedì di novembre dalle 17 alle 18».",
  notAdmin:
    "Il tuo numero non risulta tra gli amministratori. Per ora questo assistente è riservato a loro.",
  notConfigured:
    "L'assistente non è ancora configurato del tutto. Avvisa chi gestisce il sistema.",
  textOnly: "Per ora capisco solo i messaggi di testo.",
  newConversation: "Va bene, ricominciamo da capo. Cosa ti serve?",
  busy: "Un attimo, sto ancora lavorando alla tua richiesta precedente.",
  noAnswer:
    "Non sono riuscito a rispondere a questa richiesta. Prova a riformularla.",
  overloaded:
    "In questo momento ci sono troppe richieste. Riprova tra un minuto.",
  error: "Si è verificato un errore. Riprova tra poco.",
  confirmQuestion: "Confermi?",
  confirmButton: "✅ Conferma",
  cancelButton: "❌ Annulla",
  openPreviewButton: "🗓 Apri e scegli cosa confermare",
  cancelled: "Annullato: non ho cambiato nulla.",
  planNotValid:
    "Questa proposta non è più valida. Dimmi di nuovo cosa vuoi fare.",
  loggedOnly: (plan: SlotPlan) =>
    `Confermato (${plan.creates.length} nuovi, ${plan.updates.length} modificati, ${plan.deletes.length} eliminati).\n\n⚠️ Modalità di prova: le modifiche sono state solo registrate, il calendario non è stato toccato.`,
};
