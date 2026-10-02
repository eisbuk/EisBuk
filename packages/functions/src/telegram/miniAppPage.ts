/**
 * The page of the bot's Telegram mini app, served by the `telegramMiniApp` function.
 * It has two uses, picked by the query string of the button that opens it:
 * - `mode=contact`: asks Telegram to share the user's phone number with the bot
 * - `plan=<id>`: shows a proposal, lets the admin leave single changes out, and confirm or cancel it
 *
 * The page holds no data of its own: it gets the proposal (texts included) from the
 * function it's served by, authenticating with the launch data Telegram signed.
 *
 * Note for editing: the page is a template literal, so its script uses neither
 * backticks, nor dollar-brace sequences, nor backslashes.
 */
export const MINI_APP_PAGE = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>EisBuk</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
  :root {
    --bg: var(--tg-theme-bg-color, #ffffff);
    --text: var(--tg-theme-text-color, #1c1c1e);
    --hint: var(--tg-theme-hint-color, #8e8e93);
    --card: var(--tg-theme-secondary-bg-color, #f2f2f7);
    --accent: var(--tg-theme-button-color, #2481cc);
    --accent-text: var(--tg-theme-button-text-color, #ffffff);
    --danger: var(--tg-theme-destructive-text-color, #d93a3a);
    --ice: #3b8fe0;
    --off-ice: #e08a3b;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 16px 16px 96px;
    background: var(--bg);
    color: var(--text);
    font: 15px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  h1 { margin: 0; font-size: 20px; }
  .period { margin: 2px 0 0; color: var(--hint); }
  h2 {
    margin: 22px 0 6px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--hint);
  }
  .card { margin: 8px 0; padding: 12px; border-radius: 12px; background: var(--card); }
  .title { font-weight: 600; }
  .title::before {
    content: "";
    display: inline-block;
    width: 9px;
    height: 9px;
    margin-right: 8px;
    border-radius: 50%;
    background: var(--hint);
  }
  .ice .title::before { background: var(--ice); }
  .off-ice .title::before { background: var(--off-ice); }
  .subtitle { color: var(--hint); }
  .weekday { display: flex; align-items: flex-start; margin-top: 10px; }
  .weekday-label { flex: 0 0 38px; padding-top: 5px; font-weight: 600; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  button { font: inherit; cursor: pointer; }
  .chip {
    padding: 4px 11px;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: var(--accent);
    color: var(--accent-text);
  }
  .chip[aria-pressed="false"] {
    border-color: var(--hint);
    background: transparent;
    color: var(--hint);
    text-decoration: line-through;
  }
  .item {
    display: flex;
    width: 100%;
    gap: 10px;
    align-items: flex-start;
    border: 0;
    text-align: left;
    color: inherit;
  }
  .item .title::before { display: none; }
  .check {
    flex: 0 0 22px;
    height: 22px;
    border: 2px solid var(--accent);
    border-radius: 6px;
    background: var(--accent);
    color: var(--accent-text);
    font-size: 14px;
    line-height: 18px;
    text-align: center;
  }
  .item[aria-pressed="false"] .check { background: transparent; color: transparent; border-color: var(--hint); }
  .item[aria-pressed="false"] .body { opacity: 0.5; text-decoration: line-through; }
  .delete .check { border-color: var(--danger); background: var(--danger); }
  .change { color: var(--hint); }
  .skipped { color: var(--hint); }
  .skipped .reason { font-style: italic; }
  footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    gap: 10px;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--card);
    background: var(--bg);
  }
  footer button { flex: 1; padding: 12px; border-radius: 10px; font-weight: 600; }
  .primary { border: 0; background: var(--accent); color: var(--accent-text); }
  .secondary { flex: 0 0 auto; border: 1px solid var(--hint); background: transparent; color: var(--text); }
  button:disabled { opacity: 0.45; cursor: default; }
  .message { padding: 18vh 12px 0; text-align: center; }
  .message p { color: var(--hint); }
  .message button { margin-top: 12px; padding: 10px 22px; border-radius: 10px; }
</style>
</head>
<body>
<main id="app"></main>
<script>
(function () {
  var tg = window.Telegram && window.Telegram.WebApp;
  var params = new URLSearchParams(window.location.search);
  var app = document.getElementById("app");

  // Texts always go in as text nodes: slot notes are written by people
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function add(parent) {
    for (var i = 1; i < arguments.length; i++) parent.appendChild(arguments[i]);
    return parent;
  }
  function show() {
    app.textContent = "";
    var footer = document.querySelector("footer");
    if (footer) footer.remove();
    for (var i = 0; i < arguments.length; i++) app.appendChild(arguments[i]);
  }
  function showMessage(title, text, buttonLabel, onClick) {
    var box = add(el("div", "message"), el("h1", "", title), el("p", "", text));
    if (buttonLabel) {
      var button = el("button", "primary", buttonLabel);
      button.addEventListener("click", onClick);
      box.appendChild(button);
    }
    show(box);
  }
  function closeSoon() {
    setTimeout(function () { tg.close(); }, 1500);
  }

  if (!tg || !tg.initData) {
    showMessage("Apri da Telegram", "Questa pagina funziona solo dentro Telegram, dal pulsante che ti manda il bot.");
    return;
  }
  tg.ready();
  tg.expand();

  function call(body) {
    body.initData = tg.initData;
    return fetch(window.location.pathname + window.location.search, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || "error");
        return data;
      });
    });
  }

  var errors = {
    "not-linked": ["Non so ancora chi sei", "Torna alla chat e condividi il tuo numero di telefono."],
    "not-admin": ["Riservato agli amministratori", "Il tuo numero non risulta tra gli amministratori."],
    "invalid-session": ["Sessione scaduta", "Chiudi questa finestra e riaprila dal pulsante nella chat."],
    "nothing-selected": ["Niente da confermare", "Hai tolto tutte le modifiche: annulla la proposta, oppure riaprila."]
  };
  var notPending = ["Proposta non più valida", "Torna alla chat e dimmi di nuovo cosa vuoi fare."];
  function showError(err) {
    var texts = errors[err.message] || ["Qualcosa è andato storto", "Riprova tra poco."];
    showMessage(texts[0], texts[1]);
  }

  // #region contact
  function askForContact() {
    if (!tg.isVersionAtLeast || !tg.isVersionAtLeast("6.9")) {
      showMessage("Aggiorna Telegram", "Questa versione di Telegram non può condividere il numero da qui. Torna alla chat e scrivi /tastiera.");
      return;
    }
    showMessage("Condividi il tuo numero", "Conferma nella finestra di Telegram: mi serve per sapere chi sei.");
    tg.requestContact(function (shared) {
      if (shared) {
        showMessage("Fatto ✅", "Torna alla chat: ti ho scritto lì.");
        closeSoon();
      } else {
        showMessage("Numero non condiviso", "Senza il numero non posso sapere chi sei.", "Riprova", askForContact);
      }
    });
  }
  // #endregion contact

  // #region plan
  function showPlan(planId, view) {
    // Everything starts selected: the admin takes out what shouldn't go through
    var selected = { creates: {}, updates: {}, deletes: {} };
    var confirmButton = el("button", "primary");

    function count() {
      return Object.keys(selected.creates).length + Object.keys(selected.updates).length + Object.keys(selected.deletes).length;
    }
    function refresh() {
      var n = count();
      confirmButton.textContent = n === 1 ? "Conferma 1 modifica" : "Conferma " + n + " modifiche";
      confirmButton.disabled = n === 0;
    }
    function toggle(button, group, key) {
      selected[group][key] = true;
      button.setAttribute("aria-pressed", "true");
      button.addEventListener("click", function () {
        var on = !selected[group][key];
        if (on) selected[group][key] = true; else delete selected[group][key];
        button.setAttribute("aria-pressed", String(on));
        refresh();
      });
      return button;
    }
    function section(title, items) {
      var nodes = items.length ? [el("h2", "", title + " · " + items.length)] : [];
      return nodes.concat(items);
    }
    function item(group, key, className, title, lines) {
      var body = add(el("span", "body"), el("div", "title", title));
      lines.forEach(function (line) { body.appendChild(el("div", "change", line)); });
      return toggle(add(el("button", "card item " + className), el("span", "check", "✓"), body), group, key);
    }

    var created = 0;
    var creates = view.creates.map(function (lesson) {
      var card = add(el("div", "card " + lesson.type), el("div", "title", lesson.title), el("div", "subtitle", lesson.subtitle));
      lesson.weekdays.forEach(function (weekday) {
        var chips = el("div", "chips");
        weekday.dates.forEach(function (date) {
          created++;
          chips.appendChild(toggle(el("button", "chip", date.label), "creates", date.index));
        });
        add(card, add(el("div", "weekday"), el("div", "weekday-label", weekday.label), chips));
      });
      return card;
    });
    var updates = view.updates.map(function (update) {
      return item("updates", update.id, "update", update.title, update.changes);
    });
    var deletes = view.deletes.map(function (slot) {
      return item("deletes", slot.id, "delete", slot.title, []);
    });
    var skipped = view.skipped.map(function (slot) {
      return add(el("div", "card skipped"), el("div", "", slot.title), el("div", "reason", slot.reason));
    });

    var nodes = [el("h1", "", "Proposta di modifiche")];
    if (view.period) nodes.push(el("p", "period", view.period));
    nodes = nodes
      .concat(creates.length ? [el("h2", "", "Nuovi slot · " + created)] : [], creates)
      .concat(section("Slot modificati", updates))
      .concat(section("Slot eliminati", deletes))
      .concat(section("Lasciati come sono", skipped));
    show.apply(null, nodes);

    var cancelButton = el("button", "secondary", "Annulla");
    function resolve(action) {
      confirmButton.disabled = cancelButton.disabled = true;
      call({
        action: action,
        planId: planId,
        selection: {
          creates: Object.keys(selected.creates).map(Number),
          updates: Object.keys(selected.updates),
          deletes: Object.keys(selected.deletes)
        }
      }).then(function (result) {
        if (result.status === "logged") showMessage("Confermato ✅", "Trovi il riepilogo nella chat.");
        else if (result.status === "cancelled") showMessage("Annullato", "Non ho cambiato nulla.");
        else showMessage(notPending[0], notPending[1]);
        closeSoon();
      }).catch(function (err) {
        showError(err);
      });
    }
    confirmButton.addEventListener("click", function () { resolve("confirm"); });
    cancelButton.addEventListener("click", function () { resolve("cancel"); });
    document.body.appendChild(add(el("footer"), cancelButton, confirmButton));
    refresh();
  }

  function loadPlan(planId) {
    showMessage("Un attimo…", "Sto caricando la proposta.");
    call({ action: "getPlan", planId: planId }).then(function (result) {
      if (result.status !== "pending") showMessage(notPending[0], notPending[1]);
      else showPlan(planId, result.view);
    }).catch(showError);
  }
  // #endregion plan

  if (params.get("mode") === "contact") askForContact();
  else if (params.get("plan")) loadPlan(params.get("plan"));
  else showMessage("EisBuk", "Apri questa pagina dal pulsante che ti manda il bot.");
})();
</script>
</body>
</html>
`;
