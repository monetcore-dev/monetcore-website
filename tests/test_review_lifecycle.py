"""V2 lifecycle tests: disposable files, synthetic PM2/cgroup/HTTP; never a VPS."""
from contextlib import ExitStack
import copy
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
from types import SimpleNamespace
import sys
import tempfile
import unittest
from unittest.mock import patch

SOURCE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('review_lifecycle',SOURCE/'scripts/vps/review-deploy.py')
m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
SITE='''server {
 listen 443 ssl;
 server_name review.monetcore.dev;
 ssl_certificate /etc/review/fullchain.pem;
 ssl_certificate_key /etc/review/privkey.pem;
 auth_basic off;
 location = /api { return 403; }
 location ^~ /api/ { return 403; }
 location / {
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_pass http://127.0.0.1:4300;
 }
}
'''
SHA='a'*40
CHECKSUM='c'*64
POLICY={'startup_bytes':512*1024**2,'reserve_bytes':128*1024**2,'basis':'Synthetic test budget; not real VPS measurements.'}

class Model:
    def __init__(self,root):
        self.root=root;self.apps={};self.next_id=10;self.mode=None;self.mode_used=False;self.actions=[];self.health_calls=0
        self.proc=root/'proc';self.proc.mkdir();self.home=root/'home';(self.home/'.pm2').mkdir(parents=True)
        self.cg=root/'cgroup';self.cg.mkdir();(self.cg/'cgroup.controllers').write_text('memory')
        for p,limit in [(self.cg,'max'),(self.cg/'system.slice','max'),(self.cg/'system.slice'/m.UNIT,str(1024**3))]:
            p.mkdir(exist_ok=True);(p/'memory.current').write_text(str(128*1024**2));(p/'memory.max').write_text(limit)
            (p/'memory.events').write_text('max 0\noom 0\noom_kill 0\n')
        self.leaf=self.cg/'system.slice'/m.UNIT
        for name in ['state','releases','incoming']:(root/name).mkdir()
        self.site=root/'review-site';self.site.write_text(SITE)
        daemon_proc=self.proc/'5';daemon_proc.mkdir();(daemon_proc/'stat').write_text('5 (synthetic-daemon) '+' '.join(['0','1']+['0']*17+['1']))
        self.a=self.make('20261029T100000Z-aaaaaaaa',4300)
        self.b=self.make('20261029T100001Z-bbbbbbbb',4301)
        self.daemon={'pid':5,'start':'1','uid':os.getuid(),'boot_id':'11111111-1111-4111-8111-111111111111'}
        self.index={'version':2,'status':'ready','current':self.a,'rollback':self.b,'pending':None,'routing_hash':m.digest(self.site.read_bytes()),'daemon':self.daemon,'memory_policy':POLICY,'restore_policy':m.RESTORE_POLICY,'acknowledged':{}}
        m.save(root/'state/lifecycle.json',self.index)
    def sync(self):
        (self.leaf/'cgroup.procs').write_text(str(getattr(self,'daemon',{'pid':5})['pid'])+'\n'+'\n'.join(str(v['record']['process']['pid']) for v in self.apps.values() if v['record'].get('process')))
    def files(self,release,sha):
        release.mkdir(exist_ok=True)
        (release/'server.js').write_text('synthetic server')
        (release/'review-start.cjs').write_text('synthetic disabled integration guard')
        (release/'release.json').write_text(json.dumps({'commit':sha,'platform':'linux','arch':'x64'}))
        (release/'.next/cache').mkdir(parents=True,exist_ok=True)
    def process(self,record):
        self.next_id+=1;pid=1000+self.next_id
        proc=self.proc/str(pid);proc.mkdir(exist_ok=True)
        (proc/'stat').write_text(str(pid)+' (synthetic) '+' '.join(['0']*19+[str(pid)]))
        (proc/'cgroup').write_text('0::/system.slice/'+m.UNIT+'\n')
        return {'pid':pid,'start':str(pid),'cwd':str(self.root/'releases'/record['id']),'uid':os.getuid()}
    def make(self,ident,port,sha=SHA):
        directory=self.root/'releases'/ident;self.files(directory,sha)
        record={'id':ident,'commit':sha,'checksum':CHECKSUM,'port':port,'pm_id':self.next_id,'restarts':0}
        record['process']=self.process(record)
        m.save(self.root/'state'/f'{ident}.seal.json',{'id':ident,'commit':sha,'checksum':CHECKSUM,'tree':m.release_tree(directory)})
        self.apps[m.app_name(record)]={'record':record,'status':'online'}
        self.sync()
        return record
    def inventory(self):
        output=[]
        for name,value in self.apps.items():
            r=value['record'];directory=str(self.root/'releases'/r['id'])
            output.append({'name':name,'pid':r['process']['pid'] if r['process'] else 0,'pm_id':r['pm_id'],
             'pm2_env':{'pm_cwd':directory,'pm_exec_path':directory+'/review-start.cjs','exec_interpreter':m.NODE,'status':value['status'],'restart_time':r['restarts'],
                        'SECRET_SENTINEL':'must never appear in diagnostic output'}})
        return output
    def at(self,port):
        for value in self.apps.values():
            r=value['record']
            if r['port']==port and value['status']=='online':return copy.deepcopy(r['process'])
        raise m.Stop('review_listener_missing_or_ambiguous')
    def runtime(self,args):
        self.actions.append(tuple(args))
        if args==['ping']:return 'pong'
        if args==['jlist']:return json.dumps(self.inventory())
        if args[0]=='start':
            # Real persisted intent must precede even a rejected/uncertain start.
            pending=m.private_json(self.root/'state/lifecycle.json')['pending']
            assert pending['status'] in ('starting','boot-starting')
            if self.mode=='reject_start':raise m.Stop('command_failed_pm2')
            ecosystem=json.loads(Path(args[1]).read_text())['apps'][0];ident=Path(ecosystem['cwd']).name
            record=copy.deepcopy(pending['candidate'] if pending['status']=='starting' else next(r for r in m.private_json(self.root/'state'/f"{pending['id']}.index.json").values() if isinstance(r,dict) and r.get('id')==ident));record.update(pm_id=self.next_id,restarts=0);record['process']=self.process(record)
            self.apps[ecosystem['name']]={'record':record,'status':'online'}
            self.sync()
            if self.mode=='pressure':(self.leaf/'memory.events').write_text('max 1\noom 1\noom_kill 1\n')
            if self.mode=='accepted_timeout':raise m.Stop('command_unavailable_or_timeout')
            if self.mode=='stopped_timeout':
                shutil.rmtree(self.proc/str(record['process']['pid']));record['process']=None;self.apps[ecosystem['name']]['status']='errored';self.sync()
                raise m.Stop('command_unavailable_or_timeout')
            return 'started'
        if args[0]=='delete':
            if self.mode=='cleanup_failure':raise m.Stop('command_failed_pm2')
            for name,value in list(self.apps.items()):
                r=value['record']
                if str(r['pm_id'])==args[1]:
                    if r['process']:shutil.rmtree(self.proc/str(r['process']['pid']))
                    del self.apps[name];self.sync();return 'deleted'
            raise m.Stop('unknown_pm2_id')
        if args==['save','--force']:
            rows=[dict(row['pm2_env'],name=row['name']) for row in self.inventory()]
            (self.home/'.pm2/dump.pm2').write_text(json.dumps(rows));return 'saved'
        raise AssertionError(args)
    def command(self,args,**kwargs):
        if args[:2]==['/usr/bin/systemctl','show']:
            return 'ControlGroup=/system.slice/'+m.UNIT+'\nActiveState=active\nSubState=running\n'
        if args==[m.NODE,'--version']:return 'v24.19.0'
        if args[:2]==['/usr/bin/ss','-ltnpH']:
            return '\n'.join(f'LISTEN 0 128 127.0.0.1:{v["record"]["port"]} 0.0.0.0:* users:(("next",pid={v["record"]["process"]["pid"]},fd=1))' for v in self.apps.values() if v['status']=='online')
        if args[0] in [m.NGINX,'/usr/bin/systemctl']:return ''
        raise AssertionError(args)
    def health(self,port,sha=None):
        process=self.at(port)
        record=next(v['record'] for v in self.apps.values() if v['record']['port']==port)
        if sha:assert record['commit']==sha
        return process
    def public(self,sha=None):
        port=m.vhost(self.site.read_text())[0]
        if self.mode=='post_switch_failure' and port not in [4300,4301] and not self.mode_used:
            self.mode_used=True;raise m.Stop('public_page_health_failed')
        return self.health(port,sha)
    def sleep(self,seconds):
        if self.mode=='restart_candidate' and not self.mode_used:
            candidates=[v for v in self.apps.values() if v['record']['id'] not in (self.a['id'],self.b['id'])]
            if candidates:
                record=candidates[0]['record'];shutil.rmtree(self.proc/str(record['process']['pid']));record['process']=self.process(record);record['restarts']+=1;self.mode_used=True;self.sync()
    def unpack(self,stream,sha,checksum,path):self.files(path,sha)
    def current(self):return m.private_json(self.root/'state/lifecycle.json')

class LifecycleTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
        self.stack=ExitStack();self.addCleanup(self.stack.close)
        self.stack.enter_context(patch.object(m,'ROOT',self.root))
        self.stack.enter_context(patch.object(m,'trusted',side_effect=lambda p,**kw:Path(p)))
        self.model=Model(self.root)
        for name,value in [('HOME',str(self.model.home)),('PROC_ROOT',self.model.proc),('CGROUP_ROOT',self.model.cg)]:self.stack.enter_context(patch.object(m,name,value))
        for name,value in [('runtime',self.model.runtime),('command',self.model.command),('process_at',self.model.at),('direct_health',self.model.health),('public_health',self.model.public),('unpack',self.model.unpack)]:self.stack.enter_context(patch.object(m,name,side_effect=value))
        self.stack.enter_context(patch.object(m,'daemon_identity',side_effect=lambda:copy.deepcopy(self.model.daemon)))
        self.stack.enter_context(patch.object(m,'nginx_snapshot',side_effect=lambda site,inventory=False: {'sha256':'other','files':{},'directories':{}} if inventory else 'other'))
        self.stack.enter_context(patch.object(m.pwd,'getpwnam',return_value=SimpleNamespace(pw_uid=os.getuid())))
        self.stack.enter_context(patch.object(m.time,'sleep',side_effect=self.model.sleep))
        self.stack.enter_context(patch.object(m.os,'chown'))
        self.cfg={'other_nginx_sha256':'other'}
    def deploy(self):return m.deploy(io.BytesIO(b'synthetic artifact'),SHA,CHECKSUM,self.cfg,self.model.site)
    def test_repeated_deployments_bound_pair_preserve_files_and_dump(self):
        for _ in range(5):
            result=self.deploy();index=self.model.current()
            self.assertEqual(index['status'],'ready');self.assertEqual(index['current']['id'],result['release'])
            self.assertEqual(len(self.model.apps),2)
            self.assertEqual(set(self.model.apps),{m.app_name(index['current']),m.app_name(index['rollback'])})
            self.assertTrue((self.root/'releases'/self.model.b['id']).is_dir())
        self.assertEqual(len(list((self.root/'releases').iterdir())),7)
        self.assertEqual(len(json.loads((self.model.home/'.pm2/dump.pm2').read_text())),2)
    def test_current_and_rollback_health_required_before_start(self):
        for record in [self.model.a,self.model.b]:
            with self.subTest(record=record['id']),patch.object(m,'direct_health',side_effect=m.Stop('page_health_failed')):
                with self.assertRaisesRegex(m.Stop,'page_health_failed'):self.deploy()
        self.assertFalse(any(a[0]=='start' for a in self.model.actions))
    def test_leaf_and_parent_headroom_fail_before_intent_or_start(self):
        for path in [self.model.leaf,self.model.cg/'system.slice']:
            old=(path/'memory.max').read_text();(path/'memory.max').write_text(str(512*1024**2))
            with self.assertRaisesRegex(m.Stop,'insufficient_cgroup'):self.deploy()
            self.assertEqual(self.model.current()['status'],'ready');(path/'memory.max').write_text(old)
        self.assertFalse(any(a[0]=='start' for a in self.model.actions))
    def test_invalid_or_underbudgeted_memory_policy_rejected(self):
        for policy in [None,{},dict(POLICY,startup_bytes=True),dict(POLICY,startup_bytes=1),dict(POLICY,reserve_bytes=1)]:
            with self.assertRaises(m.Stop):m.memory_policy(policy)
    def test_host_headroom_preserved(self):
        original=Path.read_text
        def read(path,*args,**kw):return 'MemAvailable: 1024 kB\n' if str(path)=='/proc/meminfo' else original(path,*args,**kw)
        with patch.object(Path,'read_text',read),self.assertRaisesRegex(m.Stop,'insufficient_memory_headroom'):self.deploy()
    def test_rejected_accepted_timeout_and_stopped_start_recover_pair(self):
        for mode in ['reject_start','accepted_timeout','stopped_timeout']:
            self.model.mode=mode
            with self.subTest(mode=mode),self.assertRaisesRegex(m.Stop,'rollback_verified'):self.deploy()
            self.assertEqual(self.model.current()['status'],'ready');self.assertEqual(len(self.model.apps),2)
            self.assertEqual(m.vhost(self.model.site.read_text())[0],4300)
    def test_candidate_restart_after_health_blocks_without_deleting_changed_identity(self):
        self.model.mode='restart_candidate'
        with self.assertRaisesRegex(m.Stop,'CRITICAL'):self.deploy()
        self.assertEqual(self.model.current()['status'],'blocked');self.assertEqual(len(self.model.apps),3)
        self.assertFalse(any(a[0]=='delete' for a in self.model.actions))
    def test_oom_counter_delta_blocks_after_safe_pair_restoration(self):
        self.model.mode='pressure'
        with self.assertRaisesRegex(m.Stop,'reconciliation_required'):self.deploy()
        self.assertEqual(self.model.current()['status'],'blocked');self.assertEqual(len(self.model.apps),2)
    def test_postswitch_failure_restores_pair_and_records_backup(self):
        self.model.mode='post_switch_failure'
        with self.assertRaisesRegex(m.Stop,'rollback_verified'):self.deploy()
        self.assertEqual(self.model.site.read_text(),SITE);self.assertEqual(self.model.current()['status'],'ready')
        self.assertEqual(len(self.model.apps),2);self.assertTrue(list((self.root/'state').glob('*.nginx')))
    def test_cleanup_failure_blocks_without_claiming_success(self):
        self.model.mode='cleanup_failure'
        with self.assertRaisesRegex(m.Stop,'retirement_blocked'):self.deploy()
        self.assertEqual(self.model.current()['status'],'blocked');self.assertEqual(len(self.model.apps),3)
    def test_incomplete_and_critical_state_block(self):
        index=self.model.current();index['status']='transaction';m.save(self.root/'state/lifecycle.json',index)
        with self.assertRaisesRegex(m.Stop,'blocked_or_incomplete'):self.deploy()
        index['status']='ready';m.save(self.root/'state/lifecycle.json',index)
        m.save(self.root/'state/20261029T000000Z-deadbeef.json',{'status':'CRITICAL-rollback-unconfirmed'})
        with self.assertRaisesRegex(m.Stop,'history_requires_reconciliation'):self.deploy()
    def test_missing_index_requires_explicit_migration(self):
        (self.root/'state/lifecycle.json').unlink()
        with self.assertRaisesRegex(m.Stop,'migration_required'):self.deploy()
    def test_daemon_resurrection_or_foreign_inventory_blocks(self):
        self.model.daemon['start']='restarted'
        with self.assertRaisesRegex(m.Stop,'daemon_changed'):self.deploy()
        self.model.daemon['start']='1';self.model.make('20261029T000001Z-deadbeef',4308)
        with self.assertRaisesRegex(m.Stop,'foreign_or_resurrected'):self.deploy()
    def test_changed_current_identity_or_release_files_block(self):
        self.model.a['process']['start']='changed'
        with self.assertRaisesRegex(m.Stop,'restarted_or_changed'):self.deploy()
        self.model.a['process']['start']=str(self.model.a['process']['pid'])
        (self.root/'releases'/self.model.a['id']/'server.js').write_text('modified')
        with self.assertRaisesRegex(m.Stop,'tree_changed'):self.deploy()
    def test_changed_nginx_fingerprint_blocks_before_start(self):
        self.cfg['other_nginx_sha256']='unexpected'
        with self.assertRaisesRegex(m.Stop,'unrelated_nginx_change_stop'):self.deploy()
        self.assertFalse(any(a[0]=='start' for a in self.model.actions))
    def test_changed_previous_pid_prevents_automatic_rollback(self):
        state={'before_hash':m.digest(SITE.encode()),'after_hash':'x','other_files':{},'other_directories':{},'previous_port':4300,'previous_process':dict(self.model.a['process'],start='wrong')}
        with self.assertRaisesRegex(m.Stop,'previous_process_changed'):m.recover(state,self.model.site)
    def test_foreign_uid_prevents_retirement(self):
        self.model.b['process']['uid']+=1
        with self.assertRaisesRegex(m.Stop,'process_mismatch'):m.retire_record(self.model.b,[self.model.a,self.model.b],lambda:None,[self.model.a])
        self.assertFalse(any(a[0]=='delete' for a in self.model.actions))
    def test_manual_rollback_swaps_verified_pair(self):
        release=self.deploy()['release'];result=m.rollback_v2(release,self.cfg,self.model.site)
        self.assertEqual(result['status'],'rolled-back');self.assertEqual(self.model.current()['current']['id'],self.model.a['id'])
        self.assertEqual(len(self.model.apps),2)
        m.rollback_v2(self.model.a['id'],self.cfg,self.model.site)
        self.assertEqual(self.model.current()['current']['id'],release)
    def test_public_api_guard_is_required(self):
        original=importlib.util.spec_from_file_location('api_guard',SOURCE/'scripts/vps/review-deploy.py')
        module=importlib.util.module_from_spec(original);sys.modules[original.name]=module;original.loader.exec_module(module)
        with patch.object(module,'request',return_value=(200,b'')),self.assertRaisesRegex(module.Stop,'nginx_api_guard_failed'):module.public_health()
    def plan(self):
        records=[copy.deepcopy(v['record']) for v in self.model.apps.values()]
        plan={'version':2,'index_hash':m.digest((self.root/'state/lifecycle.json').read_bytes()),'nginx_hash':m.digest(self.model.site.read_bytes()),'other_nginx_sha256':'other',
              'daemon':self.model.daemon,'current_id':self.model.a['id'],'rollback_id':self.model.b['id'],'records':records,
              'acknowledge':{k:v[1] for k,v in m.history().items()},'memory_policy':POLICY,'restore_policy':m.RESTORE_POLICY,'reason':'Administrator explicitly reviewed the critical history and approved this synthetic reconciliation.'}
        path=self.root/'state/lifecycle-reconcile.json';m.save(path,plan);return m.digest(path.read_bytes())
    def test_admin_reconciliation_explicitly_acknowledges_critical_without_editing_it(self):
        self.model.make('20261029T000002Z-deadbeef',4308)
        critical=self.root/'state/20261029T000000Z-deadbeef.json';m.save(critical,{'status':'CRITICAL-rollback-unconfirmed','before_hash':m.digest(SITE.encode()),'after_hash':m.digest(m.rewrite(SITE,4308).encode())});backup=critical.with_suffix('.nginx');backup.write_text(SITE);backup.chmod(0o600)
        before=critical.read_bytes();checksum=self.plan()
        with patch.object(m,'admin_only'):
            result=m.reconciliation(checksum,self.cfg,self.model.site,False)
            self.assertFalse(result['changes_made']);self.assertEqual(len(self.model.apps),3)
            result=m.reconciliation(checksum,self.cfg,self.model.site,True)
        self.assertEqual(result['retired_count'],1);self.assertEqual(critical.read_bytes(),before)
        self.assertEqual(self.model.current()['status'],'ready');self.assertEqual(len(self.model.apps),2)
        self.assertEqual(m.load_lifecycle(self.model.site)['current']['id'],self.model.a['id'])
    def test_reconciliation_plan_tamper_and_unacknowledged_history_rejected(self):
        checksum=self.plan();path=self.root/'state/lifecycle-reconcile.json';plan=json.loads(path.read_text());plan['reason']='modified plan after review';m.save(path,plan)
        with patch.object(m,'admin_only'),self.assertRaisesRegex(m.Stop,'plan_changed'):m.reconciliation(checksum,self.cfg,self.model.site,True)
        checksum=self.plan();m.save(self.root/'state/20261029T000000Z-deadbeef.json',{'status':'pending'})
        with patch.object(m,'admin_only'),self.assertRaisesRegex(m.Stop,'all_history'):m.reconciliation(checksum,self.cfg,self.model.site,True)
    def test_deployment_account_cannot_use_admin_commands(self):
        with patch.object(m.os,'geteuid',return_value=0),patch.dict(os.environ,{'SUDO_USER':m.DEPLOY_USER}),self.assertRaisesRegex(m.Stop,'administrator_console_required'):m.admin_only()

class AdditionalLifecycleTests(unittest.TestCase):
    setUp=LifecycleTests.setUp
    deploy=LifecycleTests.deploy
    plan=LifecycleTests.plan
    # Inherit the shared isolated fixture, not production services.
    def test_root_cgroup_without_memory_control_files_is_supported(self):
        (self.model.cg/'memory.max').unlink();(self.model.cg/'memory.current').unlink()
        rows=m.admit_memory(POLICY);self.assertEqual(len(rows),2)
    def test_missing_leaf_counter_or_changed_limit_fails_closed(self):
        rows=m.memory_snapshot();(self.model.leaf/'memory.max').write_text(str(2*1024**3))
        with self.assertRaisesRegex(m.Stop,'cgroup_changed'):m.memory_checkpoint(rows,POLICY)
        (self.model.leaf/'memory.events').unlink()
        with self.assertRaises(OSError):m.memory_snapshot()
    def test_foreign_or_stale_listener_after_delete_blocks_completion(self):
        original=self.model.command
        def command(args,**kwargs):
            if args[:2]==['/usr/bin/ss','-ltnpH'] and m.app_name(self.model.b) not in self.model.apps:
                return 'LISTEN 0 128 127.0.0.1:4301 0.0.0.0:* users:(("synthetic",pid=42,fd=1))'
            return original(args,**kwargs)
        with patch.object(m,'command',side_effect=command),self.assertRaisesRegex(m.Stop,'retirement_blocked'):self.deploy()
        self.assertEqual(self.model.current()['status'],'blocked')
    def test_process_lingers_after_pm2_delete_blocks(self):
        original=self.model.runtime
        def runtime(args):
            if args[0]=='delete':
                record=next(v['record'] for v in self.model.apps.values() if str(v['record']['pm_id'])==args[1])
                data=(self.model.proc/str(record['process']['pid'])/'stat').read_text();pid=record['process']['pid']
                output=original(args);path=self.model.proc/str(pid);path.mkdir();(path/'stat').write_text(data);return output
            return original(args)
        with patch.object(m,'runtime',side_effect=runtime),self.assertRaisesRegex(m.Stop,'retirement_blocked'):self.deploy()
        self.assertEqual(self.model.current()['status'],'blocked')
    def test_saved_dump_cannot_include_obsolete_entry(self):
        original=self.model.runtime
        def runtime(args):
            value=original(args)
            if args==['save','--force']:
                path=self.model.home/'.pm2/dump.pm2';rows=json.loads(path.read_text());rows.append(dict(rows[0],name='foreign'));path.write_text(json.dumps(rows))
            return value
        with patch.object(m,'runtime',side_effect=runtime),self.assertRaisesRegex(m.Stop,'retirement_blocked'):self.deploy()
        self.assertEqual(self.model.current()['status'],'blocked')
    def test_interrupt_after_accepted_start_keeps_durable_intent_until_verified_cleanup(self):
        original=self.model.runtime
        def runtime(args):
            value=original(args)
            if args[0]=='start':raise KeyboardInterrupt()
            return value
        with patch.object(m,'runtime',side_effect=runtime),self.assertRaisesRegex(m.Stop,'rollback_verified'):self.deploy()
        self.assertEqual(len(self.model.apps),2);self.assertEqual(self.model.current()['status'],'ready')
    def test_new_snapshot_blocks_an_unacknowledged_interrupted_intent(self):
        tx=m.prepare_transaction(self.model.current(),self.model.site,dict(self.model.a,id='20261029T000003Z-deadbeef',port=4308),'deploy')
        self.assertEqual(tx['status'],'intent')
        with self.assertRaisesRegex(m.Stop,'blocked_or_incomplete'):self.deploy()
    def test_reconciliation_backup_corruption_and_routing_mismatch_rejected(self):
        record=self.root/'state/20261029T000000Z-deadbeef.json';backup=record.with_suffix('.nginx')
        m.save(record,{'status':'CRITICAL-rollback-unconfirmed','before_hash':m.digest(SITE.encode()),'after_hash':'f'*64})
        backup.write_text('bad');backup.chmod(0o600);checksum=self.plan()
        with patch.object(m,'admin_only'),self.assertRaisesRegex(m.Stop,'backup_changed'):m.reconciliation(checksum,self.cfg,self.model.site)
        backup.write_text(SITE);plan=m.private_json(self.root/'state/lifecycle-reconcile.json');plan['nginx_hash']='e'*64;m.save(self.root/'state/lifecycle-reconcile.json',plan)
        checksum=m.digest((self.root/'state/lifecycle-reconcile.json').read_bytes())
        with patch.object(m,'admin_only'),self.assertRaisesRegex(m.Stop,'config_changed'):m.reconciliation(checksum,self.cfg,self.model.site)
    def test_reconciliation_missing_original_archive_never_trusts_loose_files(self):
        (self.root/'state'/f"{self.model.a['id']}.seal.json").unlink();checksum=self.plan()
        with patch.object(m,'admin_only'),self.assertRaises(FileNotFoundError):m.reconciliation(checksum,self.cfg,self.model.site)
        self.assertEqual(len(self.model.apps),2)
    def test_archive_backed_legacy_adoption_matches_tree_and_checksum(self):
        import gzip,tarfile
        from test_review_deploy import artifact
        raw=artifact();packed=gzip.compress(raw);record=self.model.a
        directory=self.root/'releases'/record['id']
        with tarfile.open(fileobj=io.BytesIO(raw)) as archive:
            for member in archive:
                if not member.isfile():continue
                path=directory/member.name.removeprefix('./');path.parent.mkdir(parents=True,exist_ok=True)
                path.write_bytes(archive.extractfile(member).read());path.chmod(0o644)
        record['checksum']=m.digest(packed)
        path=self.root/'incoming'/f"{record['id']}.migration.tar.gz";path.write_bytes(packed)
        seal=m.migration_seal(record);self.assertEqual(seal['tree'],m.release_tree(directory))
        m.verify_record(record,m.pm2_inventory(),seal=seal)
        path.write_bytes(packed+b'corrupted')
        with self.assertRaisesRegex(m.Stop,'checksum_mismatch'):m.migration_seal(record)

class RetirementBoundaryTests(unittest.TestCase):
    setUp=LifecycleTests.setUp
    def test_routing_edit_at_destructive_boundary_prevents_delete(self):
        original=m.verify_record
        def verify(record,*args,**kwargs):
            result=original(record,*args,**kwargs)
            if record['id']==self.model.b['id']:self.model.site.write_text(m.rewrite(SITE,4308))
            return result
        guard=m.retirement_guard(self.model.site,m.digest(SITE.encode()),'other',[self.model.a])
        with patch.object(m,'verify_record',side_effect=verify),self.assertRaisesRegex(m.Stop,'configuration_changed_at_retirement'):
            m.retire_record(self.model.b,[self.model.a,self.model.b],guard,[self.model.a])
        self.assertFalse(any(a[0]=='delete' for a in self.model.actions))
    def test_finite_memory_high_is_a_conservative_admission_boundary(self):
        (self.model.leaf/'memory.high').write_text(str(512*1024**2))
        with self.assertRaisesRegex(m.Stop,'insufficient_cgroup'):m.admit_memory(POLICY)
    def test_orphan_worker_in_unit_blocks_without_foreign_process_reads(self):
        orphan=self.model.proc/'9999';orphan.mkdir();(orphan/'stat').write_text('9999 (orphan) '+' '.join(['0','1']+['0']*17+['123']))
        with (self.model.leaf/'cgroup.procs').open('a') as f:f.write('\n9999')
        with self.assertRaisesRegex(m.Stop,'unregistered_or_orphan'):m.unit_process_snapshot([self.model.a,self.model.b])
        self.assertFalse(any(a[0]=='delete' for a in self.model.actions))
    def test_existing_transaction_or_release_is_never_overwritten(self):
        candidate=dict(self.model.a,id='20261029T000004Z-deadbeef',port=4308)
        record=self.root/'state'/f"{candidate['id']}.json";m.save(record,{'status':'CRITICAL-preserve-original'})
        original=record.read_bytes()
        with self.assertRaisesRegex(m.Stop,'transaction_identity_exists'):m.prepare_transaction(self.model.current(),self.model.site,candidate,'deploy')
        self.assertEqual(record.read_bytes(),original)
    def test_admin_protocol_not_available_through_forced_ssh(self):
        import runpy
        for command in ['inventory','reconcile-check '+'a'*64,'reconcile-apply '+'b'*64]:
            with patch.dict(os.environ,{'SSH_ORIGINAL_COMMAND':command},clear=True),patch.object(os,'execve') as execute,self.assertRaises(SystemExit):
                runpy.run_path(str(SOURCE/'scripts/vps/review-deploy-ssh.py'))
            execute.assert_not_called()
    def test_retained_release_never_retired(self):
        with self.assertRaisesRegex(m.Stop,'retained_release_cannot_be_retired'):
            m.retire_record(self.model.a,[self.model.a,self.model.b],lambda:None,[self.model.a,self.model.b])
        self.assertFalse(any(a[0]=='delete' for a in self.model.actions))

if __name__=='__main__':unittest.main()
