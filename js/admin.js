(function () {
"use strict";

let firebaseReady = false;
let auth, db;
try {
  if (!FIREBASE_CONFIG.apiKey.includes("PASTE") && typeof firebase !== "undefined") {
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
    firebaseReady = true;
  }
} catch (e) {
  console.error(e);
  firebaseReady = false;
}
const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();

const loginCard = document.getElementById("loginCard");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const logoutBtn = document.getElementById("logoutBtn");
const setupNotice = document.getElementById("setupNotice");
const adminMsg = document.getElementById("adminMsg");

function say(cls, text) {
  adminMsg.className = "form-msg show " + cls;
  adminMsg.textContent = text;
}

if (!firebaseReady) {
  setupNotice.style.display = "block";
  loginForm.querySelector("button").disabled = true;
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!firebaseReady) return;
  loginMsg.className = "form-msg show info";
  loginMsg.textContent = "Signing in…";
  try {
    await auth.signInWithEmailAndPassword(
      document.getElementById("adminEmail").value.trim(),
      document.getElementById("adminPass").value
    );
  } catch (err) {
    loginMsg.className = "form-msg show err";
    loginMsg.textContent = "Couldn't sign in — check the email and password.";
  }
});

logoutBtn.addEventListener("click", () => auth.signOut());

if (firebaseReady) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      loginCard.style.display = "none";
      dashboard.style.display = "block";
      logoutBtn.style.display = "inline-flex";
      loadAll();
    } else {
      loginCard.style.display = "block";
      dashboard.style.display = "none";
      logoutBtn.style.display = "none";
    }
  });
}

/* ---------- Tabs ---------- */
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => (p.style.display = "none"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).style.display = "block";
  });
});

async function loadAll() {
  await Promise.all([loadBookings(), loadBlocks()]);
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

/* ---------- Bookings ---------- */
async function loadBookings() {
  const pendingWrap = document.getElementById("pendingList");
  const confirmedWrap = document.getElementById("confirmedList");
  pendingWrap.textContent = "Loading…";
  confirmedWrap.textContent = "Loading…";

  const snap = await db.collection("bookings").orderBy("date", "asc").get();
  const pending = [];
  const confirmed = [];
  snap.forEach((d) => {
    const b = { id: d.id, ...d.data() };
    if (b.status === "pending") pending.push(b);
    if (b.status === "confirmed") confirmed.push(b);
  });

  pendingWrap.innerHTML = pending.length ? "" : '<div class="empty-state">No pending requests right now — new bookings will appear here.</div>';
  pending.forEach((b) => pendingWrap.appendChild(bookingCard(b, true)));

  confirmedWrap.innerHTML = confirmed.length ? "" : '<div class="empty-state">No confirmed bookings yet.</div>';
  confirmed.forEach((b) => confirmedWrap.appendChild(bookingCard(b, false)));
}

function bookingCard(b, actionable) {
  const card = el("div", "request-card");
  const info = el("div");
  info.appendChild(el("span", "status-pill " + b.status, b.status));
  const h = el("h4", "", `${b.categoryLabel || b.category} — ${b.subtype}`);
  h.style.marginTop = "8px";
  info.appendChild(h);
  info.appendChild(el("div", "meta", `${prettyDate(b.date)} · ${fmtTime(b.time)}`));
  info.appendChild(el("div", "meta", `${b.name} · ${b.phone}${b.email ? " · " + b.email : ""}`));
  if (b.notes) {
    const n = el("div", "meta", `"${b.notes}"`);
    n.style.marginTop = "6px";
    info.appendChild(n);
  }
  card.appendChild(info);

  const actions = el("div", "request-actions");
  if (actionable) {
    const accept = el("button", "accept", "Accept");
    accept.addEventListener("click", () => acceptBooking(b, accept));
    const decline = el("button", "decline", "Decline");
    decline.addEventListener("click", () => declineBooking(b));
    actions.append(accept, decline);
  } else {
    const wa = el("a", "", "WhatsApp client");
    wa.href = whatsappToClient(b);
    wa.target = "_blank";
    wa.rel = "noopener";
    wa.className = "btn btn-outline";
    wa.style.padding = "9px 16px";
    wa.style.fontSize = "0.85rem";
    const cancel = el("button", "decline", "Cancel booking");
    cancel.addEventListener("click", () => declineBooking(b, true));
    actions.append(wa, cancel);
  }
  card.appendChild(actions);
  return card;
}

async function acceptBooking(b, btn) {
  btn.disabled = true;
  try {
    await db.collection("bookings").doc(b.id).update({ status: "confirmed" });
    if (b.slotId) await db.collection("slots").doc(b.slotId).set({ date: b.date, time: b.time, status: "confirmed" });

    let msg = `Accepted — ${b.date} ${fmtTime(b.time)} is now marked as booked for everyone.`;
    if (emailReady() && b.email) {
      const ok = await sendEmail({
        to: b.email,
        subject: "Your booking is confirmed — Potential Hair Trader",
        html: buildConfirmationHtml(b, "confirmed")
      });
      msg += ok ? ` Confirmation emailed to ${b.email}.` : " (Email couldn't be sent — use the WhatsApp button on the Confirmed tab.)";
    } else {
      msg += " Use “WhatsApp client” on the Confirmed tab to send them their confirmation.";
    }
    say("ok", msg);
  } catch (err) {
    console.error(err);
    say("err", "Something went wrong accepting that booking. Please try again.");
  }
  loadBookings();
}

async function declineBooking(b, wasConfirmed) {
  const label = wasConfirmed ? "Cancel this confirmed booking?" : "Decline this request?";
  if (!confirm(label + " The slot will open up again for other clients.")) return;
  try {
    await db.collection("bookings").doc(b.id).update({ status: "declined" });
    if (b.slotId) await db.collection("slots").doc(b.slotId).delete();
    say("info", "Done — that slot is available again.");
  } catch (err) {
    console.error(err);
    say("err", "Something went wrong. Please try again.");
  }
  loadBookings();
}

/* ---------- Time off ---------- */
async function loadBlocks() {
  const wrap = document.getElementById("blocksList");
  wrap.textContent = "Loading…";
  const snap = await db.collection("blocks").orderBy("date", "asc").get();
  const blocks = [];
  snap.forEach((d) => blocks.push({ id: d.id, ...d.data() }));

  wrap.innerHTML = blocks.length ? "" : '<div class="empty-state">No time blocked off. Use the form above when you need personal time.</div>';

  blocks.forEach((b) => {
    const card = el("div", "request-card");
    const info = el("div");
    info.appendChild(el("h4", "", prettyDate(b.date)));
    info.appendChild(el("div", "meta", `${fmtTime(b.time)}${b.reason ? " · " + b.reason : ""}`));
    card.appendChild(info);
    const actions = el("div", "request-actions");
    const remove = el("button", "decline", "Unblock");
    remove.addEventListener("click", async () => {
      for (const id of b.slotIds || []) await db.collection("slots").doc(id).delete();
      await db.collection("blocks").doc(b.id).delete();
      loadBlocks();
    });
    actions.appendChild(remove);
    card.appendChild(actions);
    wrap.appendChild(card);
  });
}

function populateBlockTimeOptions() {
  const dateVal = document.getElementById("blockDate").value;
  const sel = document.getElementById("blockTime");
  sel.innerHTML = '<option value="ALL">All day</option>';
  if (!dateVal) return;
  const dow = new Date(dateVal + "T00:00:00").getDay();
  slotsForWeekday(dow).forEach((t) => {
    const o = document.createElement("option");
    o.value = t;
    o.textContent = fmtTime(t);
    sel.appendChild(o);
  });
  if (slotsForWeekday(dow).length === 0) {
    const o = document.createElement("option");
    o.value = "ALL";
    o.textContent = "Closed that day — nothing to block";
    sel.innerHTML = "";
    sel.appendChild(o);
  }
}
document.getElementById("blockDate").addEventListener("change", populateBlockTimeOptions);

document.getElementById("blockForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const date = document.getElementById("blockDate").value;
  const time = document.getElementById("blockTime").value;
  const reason = document.getElementById("blockReason").value.trim();
  if (!date) return;

  const dow = new Date(date + "T00:00:00").getDay();
  const times = time === "ALL" ? slotsForWeekday(dow) : [time];
  const slotIds = [];
  const skipped = [];
  for (const t of times) {
    const id = `${date}_${t.replace(":", "")}`;
    const existing = await db.collection("slots").doc(id).get();
    if (existing.exists) {
      skipped.push(fmtTime(t)); // never overwrite a real booking
      continue;
    }
    await db.collection("slots").doc(id).set({ date, time: t, status: "blocked", createdAt: serverTimestamp() });
    slotIds.push(id);
  }
  if (slotIds.length) await db.collection("blocks").add({ date, time, reason, slotIds, createdAt: serverTimestamp() });

  say(
    skipped.length ? "info" : "ok",
    skipped.length
      ? `Blocked what was free. Skipped ${skipped.join(", ")} — those already have a booking request (handle them in Pending/Confirmed first).`
      : "Time blocked — clients will now see it as unavailable."
  );
  document.getElementById("blockForm").reset();
  loadBlocks();
});

})();
