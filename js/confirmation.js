
const BUSINESS = {
  name: "Potential Hair Trader",
  email: "hairtraderpotential@gmail.com",
  whatsapp: "27619499625",
  phoneDisplay: "061 949 9625",
  bank: "Capitec",
  account: "1662305115",
  linkedNo: "061-949-9625"
};

const TERMS = [
  "A deposit of R100 is required (non-refundable).",
  "Rescheduling must be done at least 24 hours before your confirmed appointment.",
  "Your wig must be customised and clean, and not matted with glue. If it is not clean, an additional R75 will be charged.",
  "Your natural hair must be flat braided (cornrows / snoopy) unless it is short.",
  "Arriving more than 15 minutes late carries an extra R100 charge. Arriving 30+ minutes late will result in your appointment being cancelled."
];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function fmtTime(t) {
  if (t === "ALL") return "All day";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function prettyDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/* Reference format from the salon's confirmation: Name/DD/MM/YY/3pm */
function paymentReference(name, dateStr, time) {
  const first = (name || "Client").trim().split(/\s+/)[0];
  const [y, m, d] = dateStr.split("-");
  const [h, min] = time.split(":").map(Number);
  const per = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const t = min ? `${h12}:${String(min).padStart(2, "0")}${per}` : `${h12}${per}`;
  return `${first}/${d}/${m}/${y.slice(2)}/${t}`;
}

function normalisePhone(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "27" + digits.slice(1);
  return digits;
}

/* One inline-styled block used both on the page and inside the email */
function buildConfirmationHtml(b, stage) {
  const confirmed = stage === "confirmed";
  const ref = paymentReference(b.name, b.date, b.time);
  const intro = confirmed
    ? `Hi ${esc(b.name)}, your appointment is <strong>confirmed</strong>. If your R100 deposit hasn't been paid yet, please pay it using the details below and send proof of payment on WhatsApp.`
    : `Hi ${esc(b.name)}, thank you for booking with ${BUSINESS.name}. Your slot is being held while Promise confirms it. To secure your appointment, please pay the R100 deposit using the details below and send proof of payment on WhatsApp.`;

  const row = (k, v) =>
    `<tr><td style="padding:6px 0;color:#7a6c65;width:38%;">${k}</td><td style="padding:6px 0;color:#1c1512;"><strong>${v}</strong></td></tr>`;

  return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#fffaf6;border:1px solid #ecdcd2;padding:32px;color:#4a3f3a;line-height:1.55;">
  <div style="font-size:12px;letter-spacing:2px;color:#a9895b;text-transform:uppercase;">${BUSINESS.name}</div>
  <h1 style="font-family:Georgia,serif;font-weight:normal;color:#6e1e2b;font-size:30px;margin:8px 0 2px;">${confirmed ? "Booking Confirmed" : "Booking Request Received"}</h1>
  <div style="font-family:Georgia,serif;font-style:italic;color:#a9695f;margin-bottom:18px;">It's your time to shine</div>
  <p style="margin:0 0 18px;">${intro}</p>

  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:22px;border-top:1px solid #ecdcd2;border-bottom:1px solid #ecdcd2;">
    ${row("Service", esc(b.categoryLabel || b.category))}
    ${row("Option", esc(b.subtype))}
    ${row("Date", esc(prettyDate(b.date)))}
    ${row("Time", esc(fmtTime(b.time)))}
    ${row("Status", confirmed ? "Confirmed" : "Pending confirmation")}
  </table>

  <h3 style="font-family:Georgia,serif;font-weight:normal;color:#1c1512;font-size:20px;margin:0 0 8px;">Before your appointment</h3>
  <ul style="padding-left:20px;margin:0 0 22px;font-size:14px;">
    ${TERMS.map((t) => `<li style="margin-bottom:6px;">${esc(t)}</li>`).join("")}
  </ul>

  <div style="background:#f7efe8;padding:18px 20px;font-size:14px;">
    <div style="font-family:Georgia,serif;font-size:18px;color:#6e1e2b;margin-bottom:8px;">Deposit payment details</div>
    <div>Bank: <strong>${BUSINESS.bank}</strong></div>
    <div>Account No: <strong>${BUSINESS.account}</strong></div>
    <div>Reference: <strong>${esc(ref)}</strong></div>
    <div>Linked No: <strong>${BUSINESS.linkedNo}</strong></div>
  </div>

  <p style="font-size:13px;margin:22px 0 0;">Questions or need to reschedule? WhatsApp / call ${BUSINESS.phoneDisplay} or Instagram @potentialhairtrader.</p>
</div>`;
}

/* ---------- WhatsApp helpers ---------- */
function whatsappToSalon(b) {
  const ref = paymentReference(b.name, b.date, b.time);
  const text = `Hi Promise, I've booked ${b.subtype} for ${prettyDate(b.date)} at ${fmtTime(b.time)}. Here is my proof of payment for the R100 deposit (ref: ${ref}).`;
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`;
}

function whatsappToClient(b) {
  const ref = paymentReference(b.name, b.date, b.time);
  const text =
    `Hi ${b.name}, your ${b.subtype} appointment at Potential Hair Trader is CONFIRMED for ${prettyDate(b.date)} at ${fmtTime(b.time)}.\n\n` +
    `Booking rules:\n${TERMS.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\n` +
    `Deposit (R100) details:\n${BUSINESS.bank}\nAccount: ${BUSINESS.account}\nReference: ${ref}\nLinked No: ${BUSINESS.linkedNo}\n\n` +
    `It's your time to shine!`;
  return `https://wa.me/${normalisePhone(b.phone)}?text=${encodeURIComponent(text)}`;
}

/* ---------- Email via EmailJS ---------- */
function emailReady() {
  return !Object.values(EMAILJS_CONFIG).some((v) => String(v).includes("PASTE"));
}

async function sendEmail({ to, subject, html }) {
  if (!emailReady() || !to) return false;
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.serviceId,
        template_id: EMAILJS_CONFIG.templateId,
        user_id: EMAILJS_CONFIG.publicKey,
        template_params: { to_email: to, subject, message_html: html }
      })
    });
    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}
