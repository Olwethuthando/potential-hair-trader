/* Salon schedule — edit freely. Used by the booking page and the dashboard.
   Each day of the week has its own list of hourly appointment start times.
   0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday,
   5 = Friday, 6 = Saturday. A day with an empty list is closed. */

function hourlySlots(startHour, startMin, endHour, endMin) {
  const out = [];
  let h = startHour, m = startMin;
  while (h < endHour || (h === endHour && m <= endMin)) {
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    h += 1; // hourly slots
  }
  return out;
}

const MON_THU = hourlySlots(17, 0, 23, 0); // 17:00 – 23:00
const FRI = hourlySlots(14, 30, 22, 30);   // 14:30 – 22:30
const SAT = hourlySlots(5, 0, 19, 0);      // 05:00 – 19:00

const SCHEDULE = {
  0: [],       // Sunday — closed
  1: MON_THU,  // Monday
  2: MON_THU,  // Tuesday
  3: MON_THU,  // Wednesday
  4: MON_THU,  // Thursday
  5: FRI,      // Friday
  6: SAT       // Saturday
};

const OPEN_WEEKDAYS = Object.keys(SCHEDULE)
  .filter((d) => SCHEDULE[d].length > 0)
  .map(Number); // [1,2,3,4,5,6] — closed only on Sunday

const DAYS_VISIBLE = 7;

function slotsForWeekday(dow) {
  return SCHEDULE[dow] || [];
}
