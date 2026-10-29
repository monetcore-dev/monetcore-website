"""Isolated boot, protocol and HTTP-free SSH transport regression tests."""
import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import test_review_lifecycle as fixture
SOURCE=fixture.SOURCE
m=fixture.m

# Reuse only the disposable fixture, not inherited lifecycle test cases.
class RestoreTests(unittest.TestCase):
    setUp=fixture.LifecycleTests.setUp
    def reboot(self,host=True):
        for value in self.model.apps.values():
            shutil.rmtree(self.model.proc/str(value['record']['process']['pid']))
        self.model.apps.clear()
        self.model.daemon=dict(self.model.daemon,pid=6,start='2')
        if host:self.model.daemon['boot_id']='22222222-2222-4222-8222-222222222222'
        proc=self.model.proc/'6';proc.mkdir();(proc/'stat').write_text('6 (daemon) '+' '.join(['0','1']+['0']*17+['2']))
        self.model.sync()
    def restore(self):
        raw=(self.root/'state/lifecycle.json').read_bytes()
        return m.boot_pair(json.loads(raw),self.cfg,self.model.site,m.digest(raw))
    def starts(self):return [a for a in self.model.actions if a[0]=='start']
    def test_reboot_restores_exact_pair_and_idempotent_repeat(self):
        self.reboot();result=self.restore()
        self.assertEqual(result['applications_started'],2)
        index=self.model.current();self.assertEqual(index['daemon'],self.model.daemon)
        self.assertEqual(index['current']['id'],self.model.a['id']);self.assertEqual(index['rollback']['id'],self.model.b['id'])
        self.assertEqual(self.restore()['applications_started'],0);self.assertEqual(len(self.starts()),2)
        self.assertEqual(len(json.loads((self.model.home/'.pm2/dump.pm2').read_text())),2)
        self.assertFalse(any(a[0] in ('delete','resurrect') for a in self.model.actions))
    def test_normal_service_restart_same_boot_id_new_daemon(self):
        before=self.model.daemon['boot_id'];self.reboot(host=False)
        self.assertEqual(before,self.model.daemon['boot_id']);self.assertEqual(self.restore()['applications_started'],2)
    def test_invalid_index_and_unresolved_critical_never_start(self):
        self.reboot();path=self.root/'state/lifecycle.json';original=json.loads(path.read_text())
        for key,value in [('status','blocked'),('pending',{'status':'interrupted'}),('restore_policy','unknown')]:
            index=copy.deepcopy(original);index[key]=value;m.save(path,index)
            with self.assertRaises(m.Stop):self.restore()
        m.save(path,original);m.save(self.root/'state/20261029T000000Z-deadbeef.json',{'status':'CRITICAL-rollback-unconfirmed'})
        with self.assertRaisesRegex(m.Stop,'critical_or_incomplete'):self.restore()
        self.assertEqual(self.starts(),[])
    def test_invalid_rollback_artifact_prevents_even_live_start(self):
        self.reboot();(self.root/'releases'/self.model.b['id']/'server.js').write_text('tampered')
        with self.assertRaises(m.Stop):self.restore()
        self.assertEqual(self.starts(),[])
    def test_mismatched_routing_never_starts(self):
        self.reboot();self.model.site.write_text(m.rewrite(self.model.site.read_text(),4308))
        with self.assertRaisesRegex(m.Stop,'boot_recorded_routing'):self.restore()
        self.assertEqual(self.starts(),[])
    def test_missing_index_fails_without_start(self):
        (self.root/'state/lifecycle.json').unlink()
        with patch.object(m,'boot_service_context'),self.assertRaisesRegex(m.Stop,'migration_required'):m.boot_restore(self.cfg,self.model.site)
        self.assertEqual(self.starts(),[])
    def test_memory_capacity_blocks_without_changing_one_gib_cap(self):
        self.reboot();cap=self.model.leaf/'memory.max';before=cap.read_bytes()
        (self.model.leaf/'memory.current').write_text(str(681*1024**2))
        with self.assertRaisesRegex(m.Stop,'boot_restore_blocked'):self.restore()
        self.assertEqual(self.starts(),[]);self.assertEqual(cap.read_bytes(),before)
        self.assertEqual(self.model.current()['status'],'blocked')
    def test_live_retained_when_rollback_start_has_insufficient_capacity(self):
        self.reboot();real=self.model.runtime
        def pressure(args):
            result=real(args)
            if args[0]=='start':(self.model.leaf/'memory.current').write_text(str(500*1024**2))
            return result
        with patch.object(m,'runtime',side_effect=pressure),self.assertRaises(m.Stop):self.restore()
        self.assertEqual(len(self.starts()),1);self.assertIn(m.app_name(self.model.a),self.model.apps)
        self.assertEqual(self.model.current()['status'],'blocked')
    def test_port_conflict_and_other_configuration_change_refuse_start(self):
        self.reboot()
        with patch.object(m,'port_unbound',side_effect=m.Stop('retired_or_pending_listener_still_present')),self.assertRaises(m.Stop):self.restore()
        with patch.object(m,'nginx_snapshot',return_value='changed'),self.assertRaises(m.Stop):self.restore()
        self.assertEqual(self.starts(),[])
    def test_accepted_start_timeout_consumes_intent_and_requires_admin_retry(self):
        self.reboot();self.model.mode='accepted_timeout'
        with self.assertRaisesRegex(m.Stop,'boot_restore_blocked'):self.restore()
        self.assertEqual(len(self.model.apps),1);blocked=(self.root/'state/lifecycle.json').read_bytes()
        evidence=m.history();self.assertEqual(len(self.starts()),1)
        with self.assertRaises(m.Stop):self.restore()
        self.assertEqual(len(self.starts()),1)
        self.model.mode=None
        with patch.object(m,'restore_service_contract'),patch.object(m,'admin_only'):
            result=m.boot_retry(m.digest(blocked),self.cfg,self.model.site)
        self.assertEqual(result['applications_started'],1);self.assertEqual(len(self.starts()),2)
        self.assertEqual(len(self.model.apps),2)
        for ident,(_,checksum) in evidence.items():self.assertEqual(m.digest((self.root/'state'/f'{ident}.json').read_bytes()),checksum)
    def test_rejected_start_remains_blocked_no_automatic_repeat(self):
        self.reboot();self.model.mode='reject_start'
        with self.assertRaises(m.Stop):self.restore()
        self.assertEqual(len(self.model.apps),0)
        with self.assertRaises(m.Stop):self.restore()
        self.assertEqual(len(self.starts()),1)
    def test_interrupted_start_retains_approved_live_application(self):
        self.reboot();real=self.model.runtime
        def interrupt(args):
            result=real(args)
            if args[0]=='start':raise KeyboardInterrupt()
            return result
        with patch.object(m,'runtime',side_effect=interrupt),self.assertRaises(m.Stop):self.restore()
        self.assertEqual(len(self.model.apps),1);self.assertEqual(self.model.current()['status'],'blocked')
    def test_unexpected_daemon_generation_during_start_blocks(self):
        self.reboot();real=self.model.runtime
        def changed(args):
            result=real(args)
            if args[0]=='start':self.model.daemon['start']='99'
            return result
        with patch.object(m,'runtime',side_effect=changed),self.assertRaises(m.Stop):self.restore()
        self.assertEqual(self.model.current()['status'],'blocked')
    def test_same_daemon_changed_application_not_silently_adopted(self):
        self.model.a['restarts']=1
        with self.assertRaisesRegex(m.Stop,'restarted_or_changed'):self.restore()
        self.assertEqual(self.starts(),[])
    def test_foreign_application_never_deleted_or_adopted(self):
        self.reboot();self.model.make('20261029T000002Z-deadbeef',4308)
        with self.assertRaisesRegex(m.Stop,'foreign_or_resurrected'):self.restore()
        self.assertEqual(self.starts(),[]);self.assertEqual(len(self.model.apps),1)
    def test_boot_retry_wrong_hash_or_nonboot_transaction_refused(self):
        with patch.object(m,'restore_service_contract'),patch.object(m,'admin_only'):
            with self.assertRaisesRegex(m.Stop,'index_changed'):m.boot_retry('0'*64,self.cfg,self.model.site)
            raw=(self.root/'state/lifecycle.json').read_bytes()
            with self.assertRaisesRegex(m.Stop,'requires_boot_transaction'):m.boot_retry(m.digest(raw),self.cfg,self.model.site)
    def test_status_requires_automatic_restorer_active(self):
        with patch.object(m,'restore_service_contract',side_effect=m.Stop('automatic_restore_not_ready')),self.assertRaises(m.Stop):m.controller_status(self.cfg,self.model.site)
        with patch.object(m,'restore_service_contract') as contract:
            result=m.controller_status(self.cfg,self.model.site)
        contract.assert_called_once_with(ready=True);self.assertTrue(result['migration_complete']);self.assertEqual(result['protocol'],m.CONTROLLER_PROTOCOL)
    def test_direct_boot_command_not_allowed_outside_root_unit(self):
        (self.model.proc/'self').mkdir();(self.model.proc/'self/cgroup').write_text('0::/user.slice/admin.scope\n')
        with patch.object(m,'restore_service_contract'),patch.object(m,'admin_only'),self.assertRaisesRegex(m.Stop,'verified_restore_service_required'):m.boot_service_context()

class ContractTests(unittest.TestCase):
    def test_sealed_restore_sources_match_controller(self):
        for path,expected in [('scripts/vps/monetcore-review-restore.service',m.RESTORE_UNIT_SHA256),('scripts/vps/review-pm2-start.sh',m.RESTORE_LAUNCHER_SHA256)]:
            self.assertEqual(hashlib.sha256((SOURCE/path).read_bytes()).hexdigest(),expected)
    def test_root_restore_is_separate_and_restart_bound(self):
        unit=(SOURCE/'scripts/vps/monetcore-review-restore.service').read_text()
        for token in ['User=root','Group=root','Type=oneshot','RemainAfterExit=yes','BindsTo='+m.UNIT,'PartOf='+m.UNIT,'boot-restore','IPAddressDeny=any','IPAddressAllow=localhost']:
            self.assertIn(token,unit)
        runtime=(SOURCE/'scripts/vps/monetcore-review-pm2.service').read_text()
        self.assertIn('Wants='+m.RESTORE_UNIT,runtime);self.assertIn('MemoryMax=1G',runtime);self.assertIn('Restart=always',runtime);self.assertIn('RestartSec=3',runtime)
        launcher=(SOURCE/'scripts/vps/review-pm2-start.sh').read_text();self.assertIn('exec /usr/bin/pm2 ping',launcher)
        self.assertNotIn('exec /usr/bin/pm2 resurrect',launcher)
    def test_loaded_service_contract_and_readiness_reject_tampering(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);unit=root/'restore.service';launcher=root/'launcher'
            unit.write_bytes((SOURCE/'scripts/vps/monetcore-review-restore.service').read_bytes())
            launcher.write_bytes((SOURCE/'scripts/vps/review-pm2-start.sh').read_bytes())
            main={'Wants':m.RESTORE_UNIT,'NeedDaemonReload':'no','MemoryMax':str(1024**3),'Restart':'always','RestartUSec':'3s','UnitFileState':'enabled'}
            restore={'User':'root','Group':'root','Type':'oneshot','RemainAfterExit':'yes','NoNewPrivileges':'yes','ProtectHome':'yes','ProtectSystem':'full','ProtectControlGroups':'yes','NeedDaemonReload':'no','DropInPaths':'','FragmentPath':str(unit),'BindsTo':m.UNIT,'PartOf':m.UNIT,'After':m.UNIT,'IPAddressDeny':'any','IPAddressAllow':'localhost','ActiveState':'active','SubState':'exited'}
            def properties(name,props):return main if name==m.UNIT else restore
            with patch.object(m,'RESTORE_UNIT_FILE',unit),patch.object(m,'RESTORE_LAUNCHER',launcher),patch.object(m,'trusted'),patch.object(m,'system_properties',side_effect=properties):
                m.restore_service_contract(ready=True)
                for obj,key,value in [(main,'MemoryMax',str(2*1024**3)),(main,'UnitFileState','disabled'),(main,'Restart','on-failure'),(main,'Wants',''),(main,'NeedDaemonReload','yes'),(restore,'DropInPaths','unexpected.conf'),(restore,'PartOf',''),(restore,'ActiveState','failed')]:
                    original=obj[key];obj[key]=value
                    with self.assertRaises(m.Stop):m.restore_service_contract(ready=True)
                    obj[key]=original
                launcher.write_text('tampered')
                with self.assertRaisesRegex(m.Stop,'launcher_version_mismatch'):m.restore_service_contract()
    def test_legacy_or_administrator_remote_commands_rejected(self):
        for command in ['review-deploy '+'a'*40+' '+'b'*64,'review-rollback 20261029T000000Z-deadbeef','boot-restore','boot-retry '+'a'*64,'review-status old']:
            result=subprocess.run(['python3','-I',str(SOURCE/'scripts/vps/review-deploy-ssh.py')],env={'SSH_ORIGINAL_COMMAND':command},capture_output=True)
            self.assertNotEqual(result.returncode,0)
    def transport(self,status,exit_status=0):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);artifact=root/'review.tar.gz';artifact.write_bytes(b'synthetic')
            (root/'review.sha256').write_text(hashlib.sha256(artifact.read_bytes()).hexdigest())
            ssh=root/'ssh';ssh.write_text('#!/usr/bin/python3\nimport json,os,sys\nwith open(os.environ["CALLS"],"a") as f:f.write(json.dumps(sys.argv[1:])+"\\n")\nif "review-status" in sys.argv[-1]:\n print(os.environ["STATUS"])\n sys.exit(int(os.environ["EXIT_STATUS"]))\nsys.stdin.buffer.read()\n');ssh.chmod(0o700)
            env=dict(os.environ,PATH=temp+':'+os.environ['PATH'],REVIEW_DEPLOY_HOST='synthetic.invalid',REVIEW_DEPLOY_PORT='22',OPERATION='deploy',REVIEW_DEPLOY_KEY='SYNTHETIC',REVIEW_DEPLOY_KNOWN_HOSTS='SYNTHETIC',CANDIDATE_SHA='a'*40,ARTIFACT_DIR=temp,CALLS=str(root/'calls'),STATUS=status,EXIT_STATUS=str(exit_status))
            result=subprocess.run(['bash',str(SOURCE/'scripts/vps/review-deploy-transport.sh')],env=env,capture_output=True)
            calls=[json.loads(line) for line in (root/'calls').read_text().splitlines()]
            return result,calls
    def ready(self):return {'status':'ready','protocol':m.CONTROLLER_PROTOCOL,'index_version':2,'migration_complete':True,'automatic_restore':m.RESTORE_POLICY}
    def test_transport_status_before_artifact_and_exact_protocol(self):
        result,calls=self.transport(json.dumps(self.ready()));self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(len(calls),2);self.assertEqual(calls[0][-1],'review-status '+m.CONTROLLER_PROTOCOL)
        self.assertTrue(calls[1][-1].endswith(' '+m.CONTROLLER_PROTOCOL));self.assertIn('StrictHostKeyChecking=yes',calls[0])
    def test_transport_stops_on_incompatible_missing_invalid_or_failed_status(self):
        values=['not-json',json.dumps([])]
        for key,value in [('protocol','old'),('migration_complete',False),('index_version',True),('automatic_restore','none'),('status','blocked')]:
            state=self.ready();state[key]=value;values.append(json.dumps(state))
        for value in values:
            result,calls=self.transport(value);self.assertNotEqual(result.returncode,0);self.assertEqual(len(calls),1)
        result,calls=self.transport(json.dumps(self.ready()),1);self.assertNotEqual(result.returncode,0);self.assertEqual(len(calls),1)

if __name__=='__main__':unittest.main()
