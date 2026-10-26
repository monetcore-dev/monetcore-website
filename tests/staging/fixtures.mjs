/** Synthetic only; generated dates remain future weekdays as the clock advances. */
export function bookingFixtures(now = Date.now()) {
  const date = new Date(now + 7 * 86400000);
  date.setUTCHours(12, 0, 0, 0);
  while ([0, 6].includes(date.getUTCDay()))
    date.setUTCDate(date.getUTCDate() + 1);
  const base = {
    name: "Synthetic Staging Person",
    email: "synthetic-booking@example.invalid",
    company: "Synthetic Test Company",
    consultationType: "Discovery Call - 30 minutes",
    date: date.toISOString().slice(0, 10),
    time: "09:00",
    message: "SYNTHETIC LOCAL FIXTURE — no customer data",
    website: "",
    startedAt: now - 5000,
  };
  return {
    base,
    duplicate: { ...base },
    invalidEmail: { ...base, email: "invalid" },
    invalidDate: { ...base, date: "2030-02-31" },
    unknownType: { ...base, consultationType: "Unapproved type" },
    honeypot: { ...base, website: "synthetic-bot" },
  };
}
