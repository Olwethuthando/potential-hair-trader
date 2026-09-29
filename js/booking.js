(function () {
"use strict";

/* ---------- Firebase ---------- */
let db = null;
let firebaseReady = false;
try {
  if (!FIREBASE_CONFIG.apiKey.includes("PASTE") && typeof firebase !== "undefined") {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    firebaseReady = true;
  }
} catch (e) {
  console.error(e);
  firebaseReady = false;
}
const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();

/* ---------- State ---------- */
const state = {
  weekOffset: 0,
  selectedDate: null,
  selectedTime: null,
  category: null,
  subtype: null,
  avail: {} // dateStr -> { "09:00": "pending" | "confirmed" | "blocked" }
};

const dowLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* Local-date string (avoids the UTC shift that toISOString causes in South Africa) */
function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayMidnight() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function isTimePassed(dateStr, time) {
  const now = new Date();
  if (dateStr !== toDateStr(now)) return false;
  const [h, m] = time.split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
}

/* Effective status of a slot: free | pending | booked | unavailable */
function slotState(dateStr, time) {
  const raw = state.avail[dateStr]?.[time];
  if (raw === "confirmed") return "booked";
  if (raw === "blocked") return "unavailable";
  if (raw === "pending") return "pending";
  if (isTimePassed(dateStr, time)) return "unavailable";
  return "free";
}

/* ---------- Selects ---------- */
function populateCategorySelect() {
  const sel = document.getElementById("categorySelect");
  sel.innerHTML = '<option value="">Choose a service…</option>';
  SERVICES.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.label;
    sel.appendChild(opt);
  });
}

function populateSubtypeSelect(categoryId) {
  const sel = document.getElementById("subtypeSelect");
  const service = SERVICES.find((s) => s.id === categoryId);
  if (!service) {
    sel.innerHTML = '<option value="">Choose a service first…</option>';
    sel.disabled = true;
    return;
  }
  sel.innerHTML = '<option value="">Choose the specific option…</option>';
  service.options.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.name;
    o.textContent = opt.note ? `${opt.name} — ${opt.note}` : opt.name;
    sel.appendChild(o);
  });
  sel.disabled = false;
}

/* ---------- Availability fetching ---------- */
async function fetchAvailability(dates) {
  if (!firebaseReady || !dates.length) return;
  try {
    const snap = await db.collection("slots").where("date", "in", dates).get();
    dates.forEach((d) => (state.avail[d] = {}));
    snap.forEach((docSnap) => {
      const s = docSnap.data();
      if (!state.avail[s.date]) state.avail[s.date] = {};
      state.avail[s.date][s.time] = s.status;
    });
  } catch (e) {
    console.error("Availability error", e);
  }
}

function weekDates() {
  const today = todayMidnight();
  const out = [];
  for (let i = 0; i < DAYS_VISIBLE; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + state.weekOffset * DAYS_VISIBLE + i);
    out.push(d);
  }
  return out;
}

/* ---------- Day strip ---------- */
function renderDayStrip() {
  const strip = document.getElementById("dayStrip");
  strip.innerHTML = "";
  const today = todayMidnight();

  weekDates().forEach((d) => {
    const dateStr = toDateStr(d);
    const closed = !OPEN_WEEKDAYS.includes(d.getDay());
    const isPast = d < today;
    const disabled = closed || isPast;

    let label = "";
    if (closed) label = "Closed";
    else if (isPast) label = "";
    else if (firebaseReady && state.avail[dateStr]) {
      const open = slotsForWeekday(d.getDay()).filter((t) => slotState(dateStr, t) === "free").length;
      label = open === 0 ? "Full" : `${open} open`;
    }

    const chip = document.createElement("div");
    chip.className =
      "day-chip" + (disabled ? " disabled" : "") + (state.selectedDate === dateStr ? " selected" : "");
    chip.innerHTML = `<span class="dow">${dowLabels[d.getDay()]}</span><span class="dom">${d.getDate()}</span><span class="avail">${label}</span>`;
    if (!disabled) chip.addEventListener("click", () => selectDate(dateStr));
    strip.appendChild(chip);
  });
}

async function refreshWeek() {
  renderDayStrip();
  const today = todayMidnight();
  const dates = weekDates()
    .filter((d) => d >= today && OPEN_WEEKDAYS.includes(d.getDay()))
    .map(toDateStr);
  await fetchAvailability(dates);
  renderDayStrip();
  if (state.selectedDate) renderSlotGrid();
}

/* ---------- Date + slots ---------- */
async function selectDate(dateStr) {
  state.selectedDate = dateStr;
  state.selectedTime = null;
  renderDayStrip();
  document.getElementById("selectedDateLabel").textContent = prettyDate(dateStr);
  document.getElementById("slotGrid").innerHTML =
    '<p style="grid-column:1/-1;color:var(--ink-soft);">Checking availability…</p>';
  await fetchAvailability([dateStr]);
  renderDayStrip();
  renderSlotGrid();
  updateSummary();
}

function renderSlotGrid() {
  const grid = document.getElementById("slotGrid");
  grid.innerHTML = "";

  if (!firebaseReady) {
    grid.innerHTML =
      '<p style="grid-column:1/-1;color:var(--ink-soft);">Live availability isn\'t connected yet. Please WhatsApp us to book for now.</p>';
    return;
  }

  const dayOfWeek = new Date(state.selectedDate + "T00:00:00").getDay();
  slotsForWeekday(dayOfWeek).forEach((time) => {
    const st = slotState(state.selectedDate, time);
    const div = document.createElement("div");
    const selected = state.selectedTime === time && st === "free";
    div.className =
      "slot" +
      (st === "booked" || st === "unavailable" ? " taken" : "") +
      (st === "pending" ? " pending" : "") +
      (selected ? " selected" : "");
    const suffix = { booked: " · Booked", unavailable: " · Unavailable", pending: " · Pending", free: "" }[st];
    div.textContent = fmtTime(time) + suffix;
    if (st === "free") {
      div.addEventListener("click", () => {
        state.selectedTime = time;
        renderSlotGrid();
        updateSummary();
      });
    }
    grid.appendChild(div);
  });
}

/* ---------- Summary ---------- */
function updateSummary() {
  const service = SERVICES.find((s) => s.id === state.category);
  document.getElementById("sumService").textContent = service ? service.label : "—";
  document.getElementById("sumOption").textContent = state.subtype || "—";
  document.getElementById("sumDate").textContent = state.selectedDate ? prettyDate(state.selectedDate) : "—";
  document.getElementById("sumTime").textContent = state.selectedTime ? fmtTime(state.selectedTime) : "—";
  document.getElementById("submitBtn").disabled = !(
    state.category &&
    state.subtype &&
    state.selectedDate &&
    state.selectedTime
  );
}

/* ---------- Submit ---------- */
function setMsg(cls, text) {
  const msg = document.getElementById("formMsg");
  msg.className = "form-msg show " + cls;
  msg.textContent = text;
}

async function submitBooking(e) {
  e.preventDefault();

  if (!firebaseReady) {
    setMsg("err", "Online booking isn't connected yet. Please WhatsApp us on " + BUSINESS.phoneDisplay + " to book.");
    return;
  }

  const name = document.getElementById("clientName").value.trim();
  const phone = document.getElementById("clientPhone").value.trim();
  const email = document.getElementById("clientEmail").value.trim();
  const notes = document.getElementById("clientNotes").value.trim();

  if (!name || !phone || !email) {
    setMsg("err", "Please add your name, phone number and email so we can send your confirmation.");
    return;
  }

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  setMsg("info", "Sending your request…");

  const service = SERVICES.find((s) => s.id === state.category);
  const booking = {
    category: state.category,
    categoryLabel: service.label,
    subtype: state.subtype,
    date: state.selectedDate,
    time: state.selectedTime,
    name,
    phone,
    email,
    notes,
    status: "pending"
  };
  const slotId = `${booking.date}_${booking.time.replace(":", "")}`;

  try {
    // Claim the slot first. If someone else already holds it, security rules reject this write.
    await db.collection("slots").doc(slotId).set({
      date: booking.date,
      time: booking.time,
      status: "pending",
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error(err);
    setMsg("err", "Sorry, that slot was just taken by someone else. Please choose another time.");
    await fetchAvailability([booking.date]);
    renderDayStrip();
    renderSlotGrid();
    return;
  }

  try {
    await db.collection("bookings").add({ ...booking, slotId, createdAt: serverTimestamp() });
  } catch (err) {
    console.error(err);
    setMsg("err", "Something went wrong saving your request. Please WhatsApp us on " + BUSINESS.phoneDisplay + ".");
    return;
  }

  showConfirmation(booking);

  // Emails (client confirmation + heads-up to the salon) — never block the UI
  const html = buildConfirmationHtml(booking, "requested");
  const sent = await sendEmail({
    to: email,
    subject: "Booking request received — Potential Hair Trader",
    html
  });
  sendEmail({
    to: EMAILJS_CONFIG.notifyEmail,
    subject: `New booking request: ${booking.subtype} — ${booking.name}`,
    html: `<p>New booking request from <strong>${name}</strong> (${phone}, ${email}) for ${booking.subtype} on ${prettyDate(
      booking.date
    )} at ${fmtTime(booking.time)}.</p><p>Open your dashboard to accept or decline.</p>`
  });
  const note = document.getElementById("emailNote");
  if (note) {
    note.textContent = sent
      ? `A copy of this confirmation has been emailed to ${email}.`
      : "Please screenshot or print this confirmation for your records.";
  }
}

function showConfirmation(booking) {
  const wrap = document.getElementById("confirmation");
  const ref = paymentReference(booking.name, booking.date, booking.time);
  wrap.innerHTML = `
    <div class="confirm-shell">
      ${buildConfirmationHtml(booking, "requested")}
      <p id="emailNote" style="text-align:center;margin:16px auto 0;font-size:0.9rem;"></p>
      <div class="confirm-actions">
        <a class="btn btn-primary" href="${whatsappToSalon(booking)}" target="_blank" rel="noopener">Send proof of payment on WhatsApp</a>
        <button class="btn btn-outline" id="copyRef" type="button">Copy payment reference</button>
        <button class="btn btn-outline" id="printConf" type="button">Print / save as PDF</button>
        <button class="btn btn-outline" id="bookAnother" type="button">Make another booking</button>
      </div>
    </div>`;
  wrap.style.display = "block";
  document.getElementById("bookingArea").style.display = "none";
  wrap.scrollIntoView({ behavior: "smooth", block: "start" });

  document.getElementById("copyRef").addEventListener("click", async (ev) => {
    try {
      await navigator.clipboard.writeText(ref);
      ev.target.textContent = "Copied ✓";
    } catch {
      ev.target.textContent = ref;
    }
  });
  document.getElementById("printConf").addEventListener("click", () => window.print());
  document.getElementById("bookAnother").addEventListener("click", () => {
    wrap.style.display = "none";
    document.getElementById("bookingArea").style.display = "";
    document.getElementById("bookingForm").reset();
    state.category = state.subtype = state.selectedTime = null;
    populateSubtypeSelect(null);
    document.getElementById("formMsg").className = "form-msg";
    updateSummary();
    refreshWeek();
  });
}

/* ---------- Init ---------- */
function init() {
  populateCategorySelect();
  populateSubtypeSelect(null);

  document.getElementById("categorySelect").addEventListener("change", (e) => {
    state.category = e.target.value || null;
    state.subtype = null;
    populateSubtypeSelect(state.category);
    updateSummary();
  });
  document.getElementById("subtypeSelect").addEventListener("change", (e) => {
    state.subtype = e.target.value || null;
    updateSummary();
  });
  document.getElementById("prevWeek").addEventListener("click", () => {
    if (state.weekOffset > 0) {
      state.weekOffset--;
      refreshWeek();
    }
  });
  document.getElementById("nextWeek").addEventListener("click", () => {
    state.weekOffset++;
    refreshWeek();
  });
  document.getElementById("bookingForm").addEventListener("submit", submitBooking);

  if (!firebaseReady) {
    const banner = document.getElementById("connectionBanner");
    if (banner) banner.style.display = "block";
  }

  renderDayStrip();
  // Show real availability straight away: load this week and open the first bookable day
  refreshWeek().then(() => {
    const today = todayMidnight();
    const first = weekDates().find((d) => d >= today && OPEN_WEEKDAYS.includes(d.getDay()));
    if (first && !state.selectedDate) selectDate(toDateStr(first));
  });
  updateSummary();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

})();
