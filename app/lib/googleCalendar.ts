import { google } from "googleapis";

const calendarId = process.env.GOOGLE_CALENDAR_ID;
const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!calendarId) {
  throw new Error("Missing GOOGLE_CALENDAR_ID");
}

if (!serviceAccountEmail) {
  throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
}

if (!privateKey) {
  throw new Error("Missing GOOGLE_PRIVATE_KEY");
}

const auth = new google.auth.JWT({
  email: serviceAccountEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

export const googleCalendar = google.calendar({
  version: "v3",
  auth,
});

export const monetcoreCalendarId = calendarId;