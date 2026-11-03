import notifications from './runtime/notifications.js';
import database from './runtime/database.js';
try {
  await notifications.drainEnquiryQueue();
  console.log('Enquiry queue pass completed.');
} catch {
  console.error('Enquiry queue processing failed; operator review required.');
  process.exitCode=1;
} finally {
  try { await database.closeEnquiryPool(); }
  catch { console.error('Enquiry queue shutdown failed.'); process.exitCode=1; }
}
