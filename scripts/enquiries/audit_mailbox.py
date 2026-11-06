"""Read-only, exact-enquiry-ID mailbox investigation. Never sends or moves mail."""
import email,hashlib,imaplib,re,ssl,time
from email.utils import getaddresses
MAILBOX='hello@monetcore.dev'
UUID=re.compile(r'[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}')

def folder(item):
 literal=None
 if isinstance(item,tuple):item,literal=item
 match=re.fullmatch(rb'\(([^)]*)\) (?:NIL|"(?:[^"\\]|\\.)*") (.+)',item)
 if not match:raise ValueError('Unrecognized LIST response')
 flags=match[1].lower().split()
 if b'\\noselect' in flags:return None
 name=literal if literal is not None else match[2]
 if literal is not None:name=b'"'+name.replace(b'\\',b'\\\\').replace(b'"',b'\\"')+b'"'
 label=name.strip(b'"').decode('ascii','replace').lower()
 category='inbox' if label=='inbox' else 'other'
 for flag,kind in [(b'\\sent','sent'),(b'\\junk','junk'),(b'\\trash','trash'),(b'\\archive','archive'),(b'\\all','archive')]:
  if flag in flags:category=kind
 leaf=re.split(r'[./]',label)[-1].replace(' ','')
 if category=='other':
  category={'spam':'junk','junk':'junk','sent':'sent','sentitems':'sent','sentmail':'sent','trash':'trash','deleteditems':'trash','archive':'archive'}.get(leaf,'other')
 return name,category,hashlib.sha256(name).hexdigest()[:12]

def metadata(message):
 sender=[a.lower() for _,a in getaddresses(message.get_all('From',[]))]
 recipients=[a.lower() for _,a in getaddresses(message.get_all('To',[]))]
 return sender,recipients

def headers(client,uid):
 status,parts=client.uid('FETCH',uid,'(BODY.PEEK[HEADER.FIELDS (MESSAGE-ID X-MONETCORE-ENQUIRY-ID FROM TO CONTENT-TYPE)])')
 if status!='OK':raise ValueError('Header search incomplete')
 raw=b''.join(p[1] for p in parts if isinstance(p,tuple))
 if len(raw)>32768:raise ValueError('Header limit exceeded')
 return email.message_from_bytes(raw)

def delivery_status(raw):
 result=[]
 message=email.message_from_bytes(raw)
 for part in message.walk():
  if part.get_content_type()!='message/delivery-status':continue
  blocks=part.get_payload()
  if not isinstance(blocks,list):continue
  for block in blocks:
   status=block.get('Status','').strip();action=block.get('Action','').strip().lower()
   recipient=block.get('Final-Recipient','').rsplit(';',1)[-1].strip().lower()
   if recipient!=MAILBOX or not re.fullmatch(r'[245]\.\d{1,3}\.\d{1,3}',status) or action not in ['failed','delayed','delivered','relayed','expanded']:continue
   result.append({'action':action,'status':status})
 return result

def audit(ids,password,seconds=60):
 if not ids or len(ids)>10 or len(set(ids))!=len(ids) or not all(UUID.fullmatch(x) for x in ids):raise ValueError('Invalid enquiry IDs')
 report={'inbox_verified':False,'scan_complete':False,'messages':{id:{'message_id':'<monetcore.enquiry.'+id+'@monetcore.dev>','inbox_found':False,'locations':[],'delivery_status':[]} for id in ids},'issues':[]}
 deadline=time.monotonic()+seconds
 try:
  with imaplib.IMAP4_SSL('mail.privateemail.com',993,ssl_context=ssl.create_default_context(),timeout=8) as client:
   client.login(MAILBOX,password)
   status,data=client.list()
   if status!='OK':raise ValueError('Folder inventory unavailable')
   folders=[]
   for item in data:
    if item is None:continue
    parsed=folder(item)
    if parsed:folders.append(parsed)
   if len(folders)>200:raise ValueError('Folder limit exceeded')
   if not any(x[1]=='inbox' for x in folders):raise ValueError('INBOX missing from inventory')
   folders.sort(key=lambda f:f[1]!='inbox')
   for name,category,folder_id in folders:
    if time.monotonic()>deadline:report['issues'].append('scan_deadline');break
    if client.select(name,readonly=True)[0]!='OK':report['issues'].append('folder_not_readable:'+folder_id);continue
    for id in ids:
     marker=report['messages'][id]['message_id'];matched=set()
     for field,needle in [('Message-ID',marker),('X-Monetcore-Enquiry-ID',id)]:
      status,hits=client.uid('SEARCH',None,'HEADER',field,'"'+needle+'"')
      if status!='OK':raise ValueError('Exact-header search failed')
      if len(hits[0].split())>20:report['issues'].append('header_match_limit:'+folder_id)
      for uid in hits[0].split()[:20]:
       if time.monotonic()>deadline:raise TimeoutError('scan deadline')
       if uid in matched:continue
       message=headers(client,uid);sender,recipients=metadata(message)
       identity=message.get('Message-ID','').strip()==marker or message.get('X-Monetcore-Enquiry-ID','').strip()==id
       if identity and MAILBOX in sender and MAILBOX in recipients:
        matched.add(uid);report['messages'][id]['locations'].append({'folder_category':category,'folder_id':folder_id,'uid':uid.decode('ascii'),'matched_by':field})
        if category=='inbox':report['messages'][id]['inbox_found']=True
     # Search only each unique original ID; fetch bodies solely for matching DSNs.
     status,hits=client.uid('SEARCH',None,'TEXT','"'+marker+'"')
     if status!='OK':raise ValueError('Delivery-status search failed')
     if len(hits[0].split())>20:report['issues'].append('dsn_match_limit:'+folder_id)
     for uid in hits[0].split()[:20]:
      if time.monotonic()>deadline:raise TimeoutError('scan deadline')
      if uid in matched:continue
      message=headers(client,uid)
      if message.get_content_type()!='multipart/report' or message.get_param('report-type')!='delivery-status':continue
      status,parts=client.uid('FETCH',uid,'(BODY.PEEK[]<0.131072>)')
      if status!='OK':raise ValueError('Delivery-status fetch failed')
      raw=b''.join(p[1] for p in parts if isinstance(p,tuple))
      if marker.encode() not in raw:continue
      report['messages'][id]['delivery_status'].extend(delivery_status(raw))
   else:report['scan_complete']=not report['issues']
 except Exception:report['issues'].append('mailbox_scan_incomplete')
 report['inbox_verified']=all(x['inbox_found'] for x in report['messages'].values())
 report['status']='INBOX_VERIFIED' if report['inbox_verified'] else 'MAILBOX_DELIVERY_UNCONFIRMED'
 return report
