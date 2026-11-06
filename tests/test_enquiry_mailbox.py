import importlib.util,pathlib,unittest,uuid
from unittest.mock import Mock,patch
p=pathlib.Path(__file__).resolve().parents[1]/'scripts/enquiries/audit_mailbox.py'
spec=importlib.util.spec_from_file_location('mail_audit',p);a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
class MailboxTests(unittest.TestCase):
 def scan(self,location='INBOX',rewrite=False,wrong_sender=False):
  ids=[str(uuid.uuid4()),str(uuid.uuid4())];client=Mock();factory=Mock();factory.return_value.__enter__=Mock(return_value=client);factory.return_value.__exit__=Mock(return_value=False)
  client.list.return_value=('OK',[b'(\\HasNoChildren) "/" "INBOX"',b'(\\Sent) "/" "Sent"',b'(\\Junk) "/" "Spam"']);current={};calls=[]
  def select(name,**kw):current['folder']=name.strip(b'"').decode();self.assertTrue(kw.get('readonly'));return 'OK',[b'2']
  client.select.side_effect=select
  def uid(command,*args):
   calls.append((command,args))
   if command=='SEARCH':
    if args[1]=='TEXT':return 'OK',[b'']
    field,needle=args[2:];id=next((x for x in ids if x in needle),None)
    return 'OK',[(str(ids.index(id)+1).encode() if id and current['folder']==location and (field=='X-Monetcore-Enquiry-ID' or not rewrite) else b'')]
   self.assertEqual(command,'FETCH');self.assertIn('BODY.PEEK',args[1]);id=ids[int(args[0])-1];marker='<rewritten@provider.invalid>' if rewrite else '<monetcore.enquiry.'+id+'@monetcore.dev>'
   raw=('Message-ID: '+marker+'\r\nX-Monetcore-Enquiry-ID: '+id+'\r\nFrom: '+('wrong@example.invalid' if wrong_sender else 'Monetcore <hello@monetcore.dev>')+'\r\nTo: hello@monetcore.dev\r\n').encode();return 'OK',[(b'h',raw)]
  client.uid.side_effect=uid
  with patch.object(a.imaplib,'IMAP4_SSL',factory):report=a.audit(ids,'synthetic-only')
  return report,client,calls
 def test_exact_messages_in_inbox_verify_actual_delivery(self):
  report,client,calls=self.scan();self.assertTrue(report['inbox_verified']);self.assertTrue(report['scan_complete']);self.assertEqual(report['status'],'INBOX_VERIFIED');client.store.assert_not_called();client.expunge.assert_not_called()
 def test_sent_copy_is_not_inbox_delivery(self):
  report,_,_=self.scan('Sent');self.assertFalse(report['inbox_verified']);self.assertTrue(all(x['locations'][0]['folder_category']=='sent' for x in report['messages'].values()))
 def test_spam_is_found_but_never_claimed_as_inbox(self):
  report,_,_=self.scan('Spam');self.assertFalse(report['inbox_verified']);self.assertTrue(all(x['locations'][0]['folder_category']=='junk' for x in report['messages'].values()))
 def test_rewritten_message_id_uses_exact_custom_reference(self):
  report,_,_=self.scan(rewrite=True);self.assertTrue(report['inbox_verified']);self.assertTrue(all(x['locations'][0]['matched_by']=='X-Monetcore-Enquiry-ID' for x in report['messages'].values()))
 def test_wrong_sender_does_not_match(self):
  report,_,_=self.scan(wrong_sender=True);self.assertFalse(report['inbox_verified'])
 def test_invalid_ids_never_contact_provider(self):
  with patch.object(a.imaplib,'IMAP4_SSL') as factory:
   with self.assertRaises(ValueError):a.audit(['bad'],'synthetic-only')
   factory.assert_not_called()
 def test_connection_failure_never_claims_verification(self):
  with patch.object(a.imaplib,'IMAP4_SSL',side_effect=OSError('synthetic')):report=a.audit([str(uuid.uuid4())],'synthetic-only')
  self.assertFalse(report['inbox_verified']);self.assertFalse(report['scan_complete']);self.assertIn('mailbox_scan_incomplete',report['issues'])
 def test_list_handles_literals_quoted_spaces_and_noselect(self):
  self.assertIsNone(a.folder(b'(\\Noselect) "/" "Container"'))
  self.assertEqual(a.folder((b'(\\Junk) "/" {11}',b'Junk Emails'))[1],'junk')
  self.assertEqual(a.folder(b'(\\Sent) "/" "Sent Items"')[0],b'"Sent Items"')
 def test_dsn_failure_is_evidence_not_inbox_success(self):
  raw=b'Content-Type: multipart/report; report-type=delivery-status; boundary=x\r\n\r\n--x\r\nContent-Type: message/delivery-status\r\n\r\nReporting-MTA: dns; example.invalid\r\n\r\nFinal-Recipient: rfc822; hello@monetcore.dev\r\nAction: failed\r\nStatus: 5.7.1\r\n\r\n--x--\r\n'
  self.assertEqual(a.delivery_status(raw),[{'action':'failed','status':'5.7.1'}])
if __name__=='__main__':unittest.main()
