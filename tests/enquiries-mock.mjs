import {randomUUID} from 'node:crypto';
export const enquiryState={rows:[],keys:new Map(),requests:0,mails:[],receipts:[],smtp:'ok',smtpResponse:'250 2.0.0 queued as SYNTHETIC-123',failSave:false,lostCommit:false,failClaim:false,failReceipt:false};
export function resetEnquiries(){enquiryState.rows=[];enquiryState.keys.clear();Object.assign(enquiryState,{requests:0,mails:[],receipts:[],smtp:'ok',smtpResponse:'250 2.0.0 queued as SYNTHETIC-123',failSave:false,lostCommit:false,failClaim:false,failReceipt:false});}
export async function saveEnquiry(key,hash,ip,payload){
 if(enquiryState.failSave)throw Error('Synthetic persistence failure');
 if(++enquiryState.requests>10)throw Object.assign(Error('rate'),{code:'ENQUIRY_RATE_LIMIT'});
 if(enquiryState.keys.has(key)){const old=enquiryState.keys.get(key);if(old.hash!==hash)throw Object.assign(Error('conflict'),{code:'ENQUIRY_CONFLICT'});return old.row;}
 let row=enquiryState.rows.find(r=>r.hash===hash);if(!row){row={id:randomUUID(),hash,payload,notification_state:'pending',attempts:0};enquiryState.rows.push(row);}
 enquiryState.keys.set(key,{hash,row});if(enquiryState.lostCommit)throw Error('Synthetic lost commit receipt');return row;
}
export async function claimNotification(id){
 if(enquiryState.failClaim)throw Error('Synthetic claim failure');
 const row=enquiryState.rows.find(r=>(!id||r.id===id)&&r.notification_state==='pending'&&r.attempts<5);
 if(!row)return null;row.notification_state='started';row.attempts++;return structuredClone(row);
}
export async function finishNotification(id,state,category){if(enquiryState.failReceipt)throw Error('Synthetic receipt failure');const row=enquiryState.rows.find(r=>r.id===id);row.notification_state=state==='pending'&&row.attempts>=5?'failed':state;enquiryState.receipts.push({state:row.notification_state,category});}
export async function maintainEnquiryQueue(){for(const row of enquiryState.rows)if(row.notification_state==='started')row.notification_state='uncertain';}
export async function notificationProblems(){return enquiryState.rows.filter(r=>['uncertain','failed'].includes(r.notification_state)).map(r=>({notification_state:r.notification_state,count:1}));}
const mailer = {createTransport(options){return {close(){},async sendMail(mail){enquiryState.mails.push({options,...mail});if(enquiryState.smtp==='hang')return new Promise(()=>{});if(enquiryState.smtp==='pre')throw Object.assign(Error('synthetic'),{command:'CONN'});if(enquiryState.smtp==='uncertain')throw Object.assign(Error('synthetic'),{command:'DATA'});return {response:enquiryState.smtpResponse,accepted:enquiryState.smtp==='reject'?[]:[mail.to],rejected:enquiryState.smtp==='reject'?[mail.to]:[]};}};}};

export default mailer;
