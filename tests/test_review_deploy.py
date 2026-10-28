"""No SSH, sudo, PM2, Nginx reload or provider calls: disposable files + mocks only."""
import gzip
import hashlib
import importlib.util
import io
import json
import os
import runpy
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

SOURCE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('review_deploy',SOURCE/'scripts/vps/review-deploy.py')
m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
SHA='a'*40
SITE='''server {
 listen 443 ssl;
 server_name review.monetcore.dev;
 ssl_certificate /etc/letsencrypt/live/review/fullchain.pem;
 ssl_certificate_key /etc/letsencrypt/live/review/privkey.pem;
 auth_basic "Private review";
 auth_basic_user_file /etc/nginx/review.htpasswd;
 location ^~ /api/ { return 403; }
 location = /api { return 403; }
 location / {
   proxy_set_header Host $host;
   proxy_set_header X-Forwarded-Host $host;
   proxy_set_header X-Forwarded-Proto $scheme;
   proxy_set_header X-Forwarded-For $remote_addr;
   proxy_pass http://127.0.0.1:3003;
 }
}
'''


def artifact(extra=(), remove=()):
    raw=io.BytesIO()
    required={'server.js':b'x','review-start.cjs':b'x','release.json':json.dumps({'commit':SHA,'node':'24.19.0','arch':'x64','platform':'linux','glibc':'2.36'}).encode(),'.next/BUILD_ID':b'build','public'+m.MARKER:b'{}'}
    with tarfile.open(fileobj=raw,mode='w:',format=tarfile.USTAR_FORMAT) as t:
        for name,value in required.items():
            if name in remove: continue
            info=tarfile.TarInfo('./'+name);info.size=len(value);t.addfile(info,io.BytesIO(value))
        for name,kind in extra:
            info=tarfile.TarInfo(name);info.type=kind;info.linkname='/etc/passwd'
            t.addfile(info,io.BytesIO(b''))
    return raw.getvalue()


class ReviewDeployTests(unittest.TestCase):
    def test_valid_vhost_and_exact_rewrite(self):
        port,node=m.vhost(SITE);self.assertEqual(port,3003)
        result=m.rewrite(SITE,4300)
        self.assertEqual(result,SITE.replace('127.0.0.1:3003','127.0.0.1:4300'))
        self.assertEqual(m.vhost(result)[0],4300)

    def test_api_bypass_rejected(self):
        for old,new in [('return 403','return 200'),('location ^~ /api/','location /api/'),('location = /api { return 403; }',''),('proxy_pass http://127.0.0.1:3003','proxy_pass http://other:3003')]:
            with self.subTest(new=new),self.assertRaises(m.Stop): m.vhost(SITE.replace(old,new))

    def test_wrong_or_multiple_domains_and_servers(self):
        for text in [SITE.replace('review.monetcore.dev','monetcore.dev'),SITE+SITE,SITE.replace('listen 443 ssl','listen 80')]:
            with self.assertRaises(m.Stop): m.vhost(text)

    def test_auth_and_headers_fail_closed(self):
        for text in [SITE.replace('auth_basic "Private review"','auth_basic off'),SITE.replace('auth_basic_user_file /etc/nginx/review.htpasswd;',''),SITE.replace('X-Forwarded-For $remote_addr','X-Forwarded-For $proxy_add_x_forwarded_for'),SITE.replace('location / {','location / { rewrite ^ /unsafe;')]:
            with self.assertRaises(m.Stop): m.vhost(text)

    def test_extra_location_and_unsafe_include(self):
        for text in [SITE.replace(' location / {',' location /other { return 200; }\n location / {'),SITE.replace(' listen 443 ssl;',' include /tmp/untrusted;\n listen 443 ssl;')]:
            with patch.object(m,'trusted',side_effect=m.Stop('untrusted')):
                with self.assertRaises(m.Stop): m.vhost(text)

    def test_candidate_ports_fixed(self):
        for port in [3000,3003,80,4311,65535]:
            with self.assertRaises(m.Stop): m.rewrite(SITE,port)

    def test_archive_accepts_standalone(self):
        with tarfile.open(fileobj=io.BytesIO(artifact())) as t:
            self.assertEqual(len(m.archive_members(t)),5)

    def test_archive_traversal_links_devices_and_env_rejected(self):
        for name,kind in [('../bad',tarfile.REGTYPE),('/tmp/bad',tarfile.REGTYPE),('a//b',tarfile.REGTYPE),('symlink',tarfile.SYMTYPE),('hardlink',tarfile.LNKTYPE),('device',tarfile.CHRTYPE),('.env.local',tarfile.REGTYPE),('node_modules/secret.key',tarfile.REGTYPE),('.git/config',tarfile.REGTYPE)]:
            with self.subTest(name=name),tarfile.open(fileobj=io.BytesIO(artifact([(name,kind)]))) as t:
                with self.assertRaises(m.Stop): m.archive_members(t)

    def test_archive_duplicates_and_missing_files(self):
        for raw in [artifact([('./server.js',tarfile.REGTYPE)]),artifact(remove=['review-start.cjs'])]:
            with tarfile.open(fileobj=io.BytesIO(raw)) as t:
                with self.assertRaises(m.Stop): m.archive_members(t)

    def test_archive_size_limit(self):
        with patch.object(m,'MAX_EXPANDED',1),tarfile.open(fileobj=io.BytesIO(artifact())) as t:
            with self.assertRaises(m.Stop): m.archive_members(t)

    def test_unpack_checksum_fail_before_release_creation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'incoming').mkdir();dest=root/'release'
            with patch.object(m,'ROOT',root),self.assertRaises(m.Stop):m.unpack(io.BytesIO(gzip.compress(artifact())),SHA,'0'*64,dest)
            self.assertFalse(dest.exists())

    def test_unpack_success_modes_and_no_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'incoming').mkdir();dest=root/'release';data=gzip.compress(artifact())
            with patch.object(m,'ROOT',root),patch.object(m,'command',return_value='v24.19.0'),patch.object(m.os,'chown'),patch.object(m.pwd,'getpwnam') as user:
                user.return_value.pw_uid=1234;user.return_value.pw_gid=1234
                m.unpack(io.BytesIO(data),SHA,hashlib.sha256(data).hexdigest(),dest)
                self.assertEqual((dest/'server.js').stat().st_mode&0o777,0o644)
                self.assertEqual(dest.stat().st_mode&0o777,0o755)
                with self.assertRaises(FileExistsError):m.unpack(io.BytesIO(data),SHA,hashlib.sha256(data).hexdigest(),dest)

    def test_forced_ssh_rejects_arbitrary_commands(self):
        for value in ['', 'bash','review-deploy '+SHA+' '+('0'*64)+';whoami','review-rollback ../../other','review-deploy '+SHA.upper()+' '+('0'*64)]:
            result=subprocess.run([sys.executable,'-I',str(SOURCE/'scripts/vps/review-deploy-ssh.py')],env={'SSH_ORIGINAL_COMMAND':value},capture_output=True)
            self.assertNotEqual(result.returncode,0)
            self.assertIn(b'unsupported review protocol',result.stderr)

    def test_valid_forced_commands_have_fixed_sudo_target_and_clean_environment(self):
        for text,expected in [('review-deploy '+SHA+' '+('0'*64),['deploy',SHA,'0'*64]),('review-rollback 20261028T120000Z-aaaaaaaa',['rollback','20261028T120000Z-aaaaaaaa'])]:
            with patch.dict(os.environ,{'SSH_ORIGINAL_COMMAND':text,'SYNTHETIC_SECRET':'not-a-secret'},clear=True),patch.object(os,'execve') as execute:
                runpy.run_path(str(SOURCE/'scripts/vps/review-deploy-ssh.py'))
            args=execute.call_args.args
            self.assertEqual(args[0],'/usr/bin/sudo')
            self.assertEqual(args[1],['sudo','-n','/usr/local/libexec/monetcore-review-deploy',*expected])
            self.assertEqual(set(args[2]),{'PATH','LANG'})

    def test_switch_success_retains_backup_and_records_active(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'state').mkdir();site=root/'site';site.write_text(SITE)
            state={'id':'20261027T120000Z-aaaaaaaa','before_hash':m.digest(SITE.encode()),'other_hash':'o','port':4300,'commit':SHA,'previous_port':3003,'previous_process':{'pid':4},'status':'pending'}
            new=m.rewrite(SITE,4300)
            with patch.object(m.os,'chown'),patch.object(m,'ROOT',root),patch.object(m,'nginx_snapshot',return_value='o'),patch.object(m,'process_at',return_value={'pid':4}),patch.object(m,'command'),patch.object(m,'runtime'),patch.object(m,'direct_health'),patch.object(m,'private_health'):
                m.switch(state,site,new)
            self.assertEqual(site.read_text(),new);self.assertEqual(state['status'],'active')
            self.assertEqual(json.loads((root/'state'/f"{state['id']}.json").read_text())['status'],'active')

    def test_postswitch_failure_invokes_verified_recovery(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'state').mkdir();site=root/'site';site.write_text(SITE)
            state={'id':'20261027T120000Z-aaaaaaaa','before_hash':m.digest(SITE.encode()),'other_hash':'o','port':4300,'commit':SHA,'previous_port':3003,'previous_process':{'pid':4},'status':'pending'}
            with patch.object(m.os,'chown'),patch.object(m,'ROOT',root),patch.object(m,'nginx_snapshot',return_value='o'),patch.object(m,'process_at',return_value={'pid':4}),patch.object(m,'command'),patch.object(m,'direct_health',side_effect=lambda port,*args: (_ for _ in ()).throw(m.Stop('health')) if port==4300 else None),patch.object(m,'recover') as recovery:
                with self.assertRaisesRegex(m.Stop,'rollback_verified'):m.switch(state,site,m.rewrite(SITE,4300))
            recovery.assert_called_once();self.assertEqual(state['status'],'rolled-back')

    def test_nginx_test_failure_recovers_before_success(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'state').mkdir();site=root/'site';site.write_text(SITE)
            state={'id':'20261027T120000Z-aaaaaaaa','before_hash':m.digest(SITE.encode()),'other_hash':'o','port':4300,'commit':SHA,'previous_port':3003,'previous_process':{'pid':4},'status':'pending'}
            with patch.object(m.os,'chown'),patch.object(m,'ROOT',root),patch.object(m,'nginx_snapshot',return_value='o'),patch.object(m,'process_at',return_value={'pid':4}),patch.object(m,'command',side_effect=m.Stop('syntax')),patch.object(m,'direct_health'),patch.object(m,'recover') as recovery:
                with self.assertRaisesRegex(m.Stop,'rollback_verified'):m.switch(state,site,m.rewrite(SITE,4300))
            recovery.assert_called_once()

    def test_recovery_failure_is_critical_not_false_success(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'state').mkdir();site=root/'site';site.write_text(SITE)
            state={'id':'20261027T120000Z-aaaaaaaa','before_hash':m.digest(SITE.encode()),'other_hash':'o','port':4300,'commit':SHA,'previous_port':3003,'previous_process':{'pid':4},'status':'pending'}
            with patch.object(m.os,'chown'),patch.object(m,'ROOT',root),patch.object(m,'nginx_snapshot',return_value='o'),patch.object(m,'process_at',return_value={'pid':4}),patch.object(m,'command',side_effect=m.Stop('syntax')),patch.object(m,'direct_health'),patch.object(m,'recover',side_effect=m.Stop('recovery')):
                with self.assertRaisesRegex(m.Stop,'CRITICAL'):m.switch(state,site,m.rewrite(SITE,4300))
            self.assertEqual(state['status'],'CRITICAL-rollback-unconfirmed')

    def test_recover_restores_exact_backup_and_checks_health(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'state').mkdir();site=root/'site';new=m.rewrite(SITE,4300);site.write_text(new)
            ident='20261027T120000Z-aaaaaaaa';(root/'state'/f'{ident}.nginx').write_text(SITE)
            state={'id':ident,'before_hash':m.digest(SITE.encode()),'after_hash':m.digest(new.encode()),'previous_port':3003,'previous_process':{'pid':4},'other_files':{},'other_directories':{}}
            with patch.object(m.os,'chown'),patch.object(m,'ROOT',root),patch.object(m,'process_at',return_value={'pid':4}),patch.object(m,'direct_health') as health,patch.object(m,'private_health'),patch.object(m,'command') as cmd:
                m.recover(state,site)
            self.assertEqual(site.read_text(),SITE);self.assertEqual(health.call_count,2);self.assertEqual(cmd.call_count,2)

    def test_recover_refuses_unrelated_edits_or_changed_previous_process(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);site=root/'site';site.write_text(SITE);other=root/'production';other.write_text('changed')
            state={'after_hash':m.digest(SITE.encode()),'before_hash':m.digest(SITE.encode()),'previous_port':3003,'previous_process':{'pid':4},'other_files':{str(other):m.digest(b'original')},'other_directories':{}}
            with patch.object(m,'process_at',return_value={'pid':5}),patch.object(m,'command') as cmd:
                with self.assertRaises(m.Stop):m.recover(state,site)
                state['other_files']={}
                with self.assertRaises(m.Stop):m.recover(state,site)
            cmd.assert_not_called();self.assertEqual(other.read_text(),'changed')

    def test_raw_header_validation_rejects_extensions_before_tarfile(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'tar'
            p.write_bytes(artifact());m.validate_tar_headers(p)
            with tarfile.open(p,'w:',format=tarfile.PAX_FORMAT) as t:
                info=tarfile.TarInfo('x'*300);t.addfile(info,io.BytesIO(b''))
            with self.assertRaises(m.Stop):m.validate_tar_headers(p)
            p.write_bytes(b'bad')
            with self.assertRaises(m.Stop):m.validate_tar_headers(p)

    def test_runtime_refuses_missing_sandbox_before_pm2(self):
        with patch.object(m,'command',return_value='User=monetcore\n') as cmd:
            with self.assertRaisesRegex(m.Stop,'runtime_sandbox_required'):m.runtime(['ping'])
        self.assertEqual(cmd.call_count,1)

    def test_real_local_lock_rejects_overlap_and_releases(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'state').mkdir()
            with patch.object(m,'ROOT',root):
                with m.deployment_lock():
                    with self.assertRaisesRegex(m.Stop,'deployment_in_progress'):
                        with m.deployment_lock():pass
                with m.deployment_lock():pass

    def test_tar_directory_slashes_are_normalized(self):
        raw=io.BytesIO()
        with tarfile.open(fileobj=raw,mode='w:',format=tarfile.USTAR_FORMAT) as t:
            for name in ['./','./node_modules/']:
                info=tarfile.TarInfo(name);info.type=tarfile.DIRTYPE;t.addfile(info)
            with tarfile.open(fileobj=io.BytesIO(artifact())) as source:
                for member in source:t.addfile(member,source.extractfile(member))
        with tarfile.open(fileobj=io.BytesIO(raw.getvalue())) as t:
            members=m.archive_members(t)
        self.assertEqual(len(members),6)
        self.assertIn('node_modules',[name for _,name in members])

    def test_workflow_gates_and_transport(self):
        workflow=(SOURCE/'.github/workflows/review-deploy.yml').read_text()
        self.assertNotIn('\n  push:',workflow)
        for required in ['workflow_dispatch:','vars.REVIEW_DEPLOY_ENABLED',"github.ref == 'refs/heads/feature/phase2-clean-review'",'cancel-in-progress: false','environment: review-deploy','persist-credentials: false']:
            self.assertIn(required,workflow)
        transport=(SOURCE/'scripts/vps/review-deploy-transport.sh').read_text()
        self.assertIn('StrictHostKeyChecking=yes',transport);self.assertNotIn('StrictHostKeyChecking=no',transport)
        self.assertNotIn('eval ',transport)
        service=(SOURCE/'scripts/vps/monetcore-review-pm2.service').read_text()
        for required in ['User=monetcore_review_runtime','ProtectHome=true','NoNewPrivileges=true','IPAddressDeny=any','ProtectProc=invisible','ExecStart=/usr/bin/env -i','ExecStop=/usr/bin/env -i']:self.assertIn(required,service)
        self.assertFalse(json.loads((SOURCE/'vercel.json').read_text())['git']['deploymentEnabled']['feature/review-deployment-automation'])

if __name__=='__main__':unittest.main()
