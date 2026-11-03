-- Administrator read-only queue inspection. No customer payloads or credentials.
BEGIN READ ONLY;
SELECT notification_state,count(*) FROM monetcore_enquiries.enquiries GROUP BY notification_state;
SELECT id,notification_state,attempts,last_error_category,created_at,started_at,accepted_at,updated_at
FROM monetcore_enquiries.enquiries WHERE notification_state IN ('uncertain','failed')
ORDER BY created_at LIMIT 100;
SELECT count(*) AS pending_over_five_minutes FROM monetcore_enquiries.enquiries
WHERE notification_state='pending' AND created_at<now()-interval '5 minutes';
COMMIT;
