"""No SSH, sudo, PM2, Nginx reload or provider calls: disposable files + mocks only."""
from contextlib import contextmanager, ExitStack
import gzip
import hashlib
import importlib.util
import io
import json
import os
import runpy
import socket
import stat
import shlex
from types import SimpleNamespace
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
identity_spec=importlib.util.spec_from_file_location('identity_preflight',SOURCE/'scripts/vps/review-identity-preflight.py')
identities=importlib.util.module_from_spec(identity_spec);identity_spec.loader.exec_module(identities)

@contextmanager
def collision_context(users=None,groups=None,entries=None):
    users=users if users is not None else [SimpleNamespace(pw_name=identities.LEGACY_USER,pw_uid=999,pw_gid=999,pw_dir=str(identities.LEGACY_HOME))]
    groups=groups if groups is not None else [SimpleNamespace(gr_name=identities.LEGACY_USER,gr_gid=999,gr_mem=[])]
    entries=entries or {}
    parents={str(p) for target in identities.NEW_PATHS for p in target.parents}
    touched=[]
    def lookup(records,key,name):
        for record in records:
            if getattr(record,key)==name:return record
        raise KeyError(name)
    def metadata(p):
        name=str(p);touched.append(name)
        if name in entries:
            value=entries[name]
            if isinstance(value,Exception):raise value
            return value
        if name in parents:return SimpleNamespace(st_uid=0,st_mode=stat.S_IFDIR|0o755)
        raise FileNotFoundError(name)
    with ExitStack() as stack:
        stack.enter_context(patch.object(identities.pwd,'getpwnam',side_effect=lambda n:lookup(users,'pw_name',n)))
        stack.enter_context(patch.object(identities.pwd,'getpwall',return_value=users))
        stack.enter_context(patch.object(identities.grp,'getgrnam',side_effect=lambda n:lookup(groups,'gr_name',n)))
        stack.enter_context(patch.object(identities.grp,'getgrall',return_value=groups))
        stack.enter_context(patch.object(identities.os,'lstat',side_effect=metadata))
        for method in ['mkdir','chown','unlink','rename']:
            stack.enter_context(patch.object(identities.os,method,side_effect=AssertionError('Read-only check attempted write')))
        yield touched


def commissioned_records():
    users=[SimpleNamespace(pw_name=m.DEPLOY_USER,pw_uid=1003,pw_gid=1003,pw_dir=str(m.DEPLOY_HOME)),SimpleNamespace(pw_name=m.USER,pw_uid=1004,pw_gid=1004,pw_dir=m.HOME),SimpleNamespace(pw_name=m.LEGACY_USER,pw_uid=999,pw_gid=999,pw_dir=m.LEGACY_HOME)]
    groups=[SimpleNamespace(gr_name=u.pw_name,gr_gid=u.pw_gid,gr_mem=[]) for u in users]
    return users,groups

@contextmanager
def commissioned_context(users=None,groups=None,runtime_mode=None):
    defaults=commissioned_records();users=users or defaults[0];groups=groups or defaults[1]
    def lookup(records,key,name):return next(r for r in records if getattr(r,key)==name)
    def metadata(p):
        if p!=Path(m.HOME):raise AssertionError('Unexpected home inspection')
        return SimpleNamespace(st_uid=users[1].pw_uid,st_gid=users[1].pw_gid,st_mode=runtime_mode if runtime_mode is not None else stat.S_IFDIR|0o700)
    with patch.object(m.pwd,'getpwnam',side_effect=lambda n:lookup(users,'pw_name',n)),patch.object(m.pwd,'getpwall',return_value=users),patch.object(m.grp,'getgrnam',side_effect=lambda n:lookup(groups,'gr_name',n)),patch.object(m.grp,'getgrall',return_value=groups),patch.object(m,'trusted',side_effect=lambda p,**kwargs:p) as trust,patch.object(Path,'lstat',autospec=True,side_effect=metadata):
        yield trust

SHA='a'*40
SITE='''server {
 listen 443 ssl;
 server_name review.monetcore.dev;
 ssl_certificate /etc/letsencrypt/live/review/fullchain.pem;
 ssl_certificate_key /etc/letsencrypt/live/review/privkey.pem;
 auth_basic off;
 location ^~ /api/ { return 403; }
 location = /api { return 403; }
 location / {
   proxy_set_header Host $host;
   proxy_set_header X-Forwarded-Host $host;
   proxy_set_header X-Forwarded-Proto $scheme;
   proxy_set_header X-Forwarded-For $remote_addr;
   proxy_pass http://127.0.0.1:3004;
 }
}
'''


CERTBOT_HTTP='server {\n if ($host = review.monetcore.dev) {\n   return 301 https://$host$request_uri;\n } # managed by Certbot\n listen 80;\n listen [::]:80;\n server_name review.monetcore.dev;\n return 404; # managed by Certbot\n}\n'


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
        port,node=m.vhost(SITE);self.assertEqual(port,3004)
        result=m.rewrite(SITE,4300)
        self.assertEqual(result,SITE.replace('127.0.0.1:3004','127.0.0.1:4300'))
        self.assertEqual(m.vhost(result)[0],4300)

    def test_api_bypass_rejected(self):
        for old,new in [('return 403','return 200'),('location = /api { return 403; }',''),('proxy_pass http://127.0.0.1:3004','proxy_pass http://other:3004')]:
            with self.subTest(new=new),self.assertRaises(m.Stop): m.vhost(SITE.replace(old,new))

    def test_wrong_or_multiple_domains_and_servers(self):
        for text in [SITE.replace('review.monetcore.dev','monetcore.dev'),SITE+SITE,SITE.replace('listen 443 ssl','listen 80')]:
            with self.assertRaises(m.Stop): m.vhost(text)

    def test_auth_and_headers_fail_closed(self):
        for text in [SITE.replace('auth_basic off','auth_basic "Private review"'),SITE.replace('auth_basic off;','auth_basic off; auth_basic off;'),SITE.replace('X-Forwarded-For $remote_addr','X-Forwarded-For $proxy_add_x_forwarded_for'),SITE.replace('location / {','location / { rewrite ^ /unsafe;')]:
            with self.assertRaises(m.Stop): m.vhost(text)

    def test_extra_location_and_unsafe_include(self):
        for text in [SITE.replace(' location / {',' location /other { return 200; }\n location / {'),SITE.replace(' listen 443 ssl;',' include /tmp/untrusted;\n listen 443 ssl;')]:
            with patch.object(m,'trusted',side_effect=m.Stop('untrusted')):
                with self.assertRaises(m.Stop): m.vhost(text)

    def test_public_auth_off_or_absent_and_plain_api_prefix(self):
        for text in [SITE,SITE.replace(' auth_basic off;',''),SITE.replace('location ^~ /api/','location /api/')]:
            self.assertEqual(m.vhost(text)[0],3004)
            self.assertEqual(m.rewrite(text,4301),text.replace('127.0.0.1:3004','127.0.0.1:4301'))

    def test_certbot_redirect_order_comments_and_tls_config_preserved(self):
        for text in [SITE+CERTBOT_HTTP,CERTBOT_HTTP+SITE]:
            self.assertEqual(m.vhost(text)[0],3004)
            self.assertEqual(m.rewrite(text,4301),text.replace('127.0.0.1:3004','127.0.0.1:4301'))
            self.assertIn(CERTBOT_HTTP,m.rewrite(text,4301))

    def test_simple_review_redirect_is_preserved(self):
        http='server { listen 80; server_name review.monetcore.dev; return 308 https://review.monetcore.dev$request_uri; }'
        self.assertEqual(m.rewrite(SITE+http,4302),(SITE+http).replace('127.0.0.1:3004','127.0.0.1:4302'))

    def test_unsafe_http_certbot_shapes_and_production_domains_rejected(self):
        for http in [CERTBOT_HTTP.replace('review.monetcore.dev','monetcore.dev'),CERTBOT_HTTP.replace('https://$host$request_uri','https://evil.example$request_uri'),CERTBOT_HTTP.replace('$host = review.monetcore.dev','$host != review.monetcore.dev'),CERTBOT_HTTP.replace('return 404','return 200'),CERTBOT_HTTP+CERTBOT_HTTP]:
            with self.subTest(http=http),self.assertRaises(m.Stop):m.vhost(SITE+http)

    def test_https_auth_cannot_silently_be_enabled(self):
        for text in [SITE.replace('auth_basic off','auth_basic "Password"'),SITE.replace('location / {','location / { auth_basic "Password";')]:
            with self.assertRaisesRegex(m.Stop,'public_review_required'):m.vhost(text)

    def test_public_health_requires_200_and_api_403_all_methods(self):
        def respond(port,path,method='GET',tls=False):
            self.assertTrue(tls)
            if path.startswith('/api'):return 403,b''
            if path==m.MARKER:return 200,json.dumps({'commit':SHA,'integrations':'disabled'}).encode()
            return 200,b'public page'
        with patch.object(m,'request',side_effect=respond) as req:
            m.public_health(SHA)
        calls=req.call_args_list
        self.assertEqual({c.args[2] for c in calls if c.args[1].startswith('/api')},{'GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'})
        self.assertIn('/api',{c.args[1] for c in calls})
        self.assertIn('/api/',{c.args[1] for c in calls})

    def test_public_health_rejects_login_redirect_api_bypass_or_stale_marker(self):
        for failure in ['login','redirect','api','marker']:
            def respond(port,path,method='GET',tls=False):
                if path.startswith('/api'):return (200 if failure=='api' else 403),b''
                if path==m.MARKER:return 200,json.dumps({'commit':'b'*40 if failure=='marker' else SHA,'integrations':'disabled'}).encode()
                return (401 if failure=='login' else 302 if failure=='redirect' else 200),b''
            with patch.object(m,'request',side_effect=respond),self.assertRaises(m.Stop):m.public_health(SHA)

    def test_inert_default_branch_template_has_identical_dispatch_schema(self):
        source=(SOURCE/'.github/workflows/review-deploy.yml').read_text()
        stub=(SOURCE/'docs/examples/review-deploy-default-branch.stub.yml').read_text()
        def schema(text):return text.split('  workflow_dispatch:\n',1)[1].split('\npermissions:',1)[0]
        self.assertEqual(schema(source),schema(stub))
        for forbidden in ['secrets.','environment:','uses:','\n  push:','\n  pull_request:']:
            self.assertNotIn(forbidden,stub)
        self.assertIn('permissions: {}',stub)
        self.assertIn('exit 1',stub)

    def test_load_config_accepts_verified_regular_enabled_file(self):
        site=m.REVIEW_ENABLED_SITE
        cfg={'nginx_site':str(site),'other_nginx_sha256':'0'*64}
        def read(p):
            if p==m.CONFIG:return json.dumps(cfg)
            if p==site:return SITE
            raise AssertionError('Unexpected path')
        with patch.object(m,'trusted',side_effect=lambda p:p) as trust,patch.object(Path,'read_text',autospec=True,side_effect=read):
            result,actual=m.load_config()
        self.assertEqual(actual,site);self.assertEqual(result,cfg)
        self.assertEqual(trust.call_args_list,[unittest.mock.call(m.CONFIG),unittest.mock.call(site)])
        self.assertEqual(json.loads((SOURCE/'scripts/vps/review-deploy.config.example.json').read_text())['nginx_site'],str(site))

    def test_enabled_path_allowlist_is_exact_and_legacy_paths_remain(self):
        with patch.object(m,'trusted',side_effect=lambda p:p) as trust:
            for site in [m.REVIEW_ENABLED_SITE,Path('/etc/nginx/sites-available/review.monetcore.dev'),Path('/etc/nginx/conf.d/review.conf')]:
                self.assertEqual(m.validate_site_path(site),site)
            trust.reset_mock()
            for name in ['/etc/nginx/sites-enabled/production','/etc/nginx/sites-enabled/monetcore-review-copy','/etc/nginx/nginx.conf','/tmp/monetcore-review']:
                with self.assertRaisesRegex(m.Stop,'dedicated_site_path_required'):m.validate_site_path(Path(name))
            trust.assert_not_called()

    def test_enabled_file_and_all_ancestors_require_root_nonwritable_regular_layout(self):
        site=m.REVIEW_ENABLED_SITE
        def check(overrides):
            def metadata(p):
                mode,uid=overrides.get(p,(stat.S_IFREG|0o644,0) if p==site else (stat.S_IFDIR|0o755,0))
                return SimpleNamespace(st_mode=mode,st_uid=uid)
            with patch.object(Path,'lstat',autospec=True,side_effect=metadata),patch.object(Path,'is_file',autospec=True,side_effect=lambda p:stat.S_ISREG(metadata(p).st_mode)):
                return m.validate_site_path(site)
        self.assertEqual(check({}),site)
        for entry,mode,uid in [(site,stat.S_IFLNK|0o777,0),(site,stat.S_IFREG|0o644,1000),(site,stat.S_IFREG|0o664,0),(site,stat.S_IFREG|0o646,0),(site,stat.S_IFDIR|0o755,0),(site.parent,stat.S_IFLNK|0o777,0),(site.parent,stat.S_IFDIR|0o775,0),(site.parent,stat.S_IFDIR|0o755,1000)]:
            with self.subTest(entry=entry,mode=mode,uid=uid),self.assertRaises(m.Stop):check({entry:(mode,uid)})

    def test_enabled_directory_fingerprint_excludes_only_review_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);enabled=root/'sites-enabled';enabled.mkdir()
            site=enabled/'monetcore-review';site.write_text(SITE)
            other=enabled/'production';other.write_text('production unchanged')
            main=root/'nginx.conf';main.write_text('include sites-enabled/*;')
            def dump(*args):return ''.join('# configuration file '+str(p)+':\n'+p.read_text()+'\n' for p in [main,site,other])
            with patch.object(m,'REVIEW_ENABLED_SITE',site),patch.object(m,'command',side_effect=dump):
                before=m.nginx_snapshot(site,inventory=True)
                self.assertIn(str(other),before['files']);self.assertNotIn(str(site),before['files'])
                site.write_text(m.rewrite(SITE,4300))
                after=m.nginx_snapshot(site,inventory=True)
                self.assertEqual(before['sha256'],after['sha256'])
                self.assertEqual(before['directories'],after['directories'])
                other.write_text('changed production')
                self.assertNotEqual(m.nginx_snapshot(site),before['sha256'])

    def test_enabled_file_must_be_loaded_directly_once_with_matching_contents(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);site=root/'monetcore-review';site.write_text(SITE)
            other=root/'other';other.write_text('other')
            alias=root/'alias';alias.symlink_to(site)
            def dump(paths):return ''.join('# configuration file '+str(p)+':\n'+p.read_text()+'\n' for p in paths)
            for output in [dump([other]),dump([site,site]),dump([alias]),dump([site]).replace('127.0.0.1:3004','127.0.0.1:3005')]:
                with patch.object(m,'REVIEW_ENABLED_SITE',site),patch.object(m,'command',return_value=output),self.assertRaises(m.Stop):m.nginx_snapshot(site)

    def test_rollback_restores_enabled_regular_file_in_place_without_touching_other_site(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'state').mkdir();enabled=root/'sites-enabled';enabled.mkdir()
            site=enabled/'monetcore-review';new=m.rewrite(SITE,4300);site.write_text(new);site.chmod(0o640)
            other=enabled/'production';other.write_text('never change')
            ident='20261028T120000Z-aaaaaaaa';(root/'state'/f'{ident}.nginx').write_text(SITE)
            state={'id':ident,'before_hash':m.digest(SITE.encode()),'after_hash':m.digest(new.encode()),'previous_port':3004,'previous_process':{'pid':4},'other_files':{str(other):m.digest(other.read_bytes())},'other_directories':{str(enabled):sorted(p.name for p in enabled.iterdir())}}
            with patch.object(m.os,'chown'),patch.object(m,'ROOT',root),patch.object(m,'process_at',return_value={'pid':4}),patch.object(m,'command'),patch.object(m,'direct_health'),patch.object(m,'public_health'):
                m.recover(state,site)
            self.assertFalse(site.is_symlink());self.assertEqual(site.read_text(),SITE)
            self.assertEqual(site.stat().st_mode&0o777,0o640)
            self.assertEqual(other.read_text(),'never change')
            self.assertEqual(sorted(p.name for p in enabled.iterdir()),['monetcore-review','production'])
            self.assertFalse((root/'sites-available').exists())

    def test_candidate_ports_fixed(self):
        for port in [3000,3004,80,4311,65535]:
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
            state={'id':'20261027T120000Z-aaaaaaaa','before_hash':m.digest(SITE.encode()),'other_hash':'o','port':4300,'commit':SHA,'previous_port':3004,'previous_process':{'pid':4},'status':'pending'}
            new=m.rewrite(SITE,4300)
            with patch.object(m.os,'chown'),patch.object(m,'ROOT',root),patch.object(m,'nginx_snapshot',return_value='o'),patch.object(m,'process_at',return_value={'pid':4}),patch.object(m,'command'),patch.object(m,'runtime'),patch.object(m,'direct_health'),patch.object(m,'public_health'):
                m.switch(state,site,new)
            self.assertEqual(site.read_text(),new);self.assertEqual(state['status'],'active')
            self.assertEqual(json.loads((root/'state'/f"{state['id']}.json").read_text())['status'],'active')

    def test_postswitch_failure_invokes_verified_recovery(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'state').mkdir();site=root/'site';site.write_text(SITE)
            state={'id':'20261027T120000Z-aaaaaaaa','before_hash':m.digest(SITE.encode()),'other_hash':'o','port':4300,'commit':SHA,'previous_port':3004,'previous_process':{'pid':4},'status':'pending'}
            with patch.object(m.os,'chown'),patch.object(m,'ROOT',root),patch.object(m,'nginx_snapshot',return_value='o'),patch.object(m,'process_at',return_value={'pid':4}),patch.object(m,'command'),patch.object(m,'direct_health',side_effect=lambda port,*args: (_ for _ in ()).throw(m.Stop('health')) if port==4300 else None),patch.object(m,'recover') as recovery:
                with self.assertRaisesRegex(m.Stop,'rollback_verified'):m.switch(state,site,m.rewrite(SITE,4300))
            recovery.assert_called_once();self.assertEqual(state['status'],'rolled-back')

    def test_nginx_test_failure_recovers_before_success(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'state').mkdir();site=root/'site';site.write_text(SITE)
            state={'id':'20261027T120000Z-aaaaaaaa','before_hash':m.digest(SITE.encode()),'other_hash':'o','port':4300,'commit':SHA,'previous_port':3004,'previous_process':{'pid':4},'status':'pending'}
            with patch.object(m.os,'chown'),patch.object(m,'ROOT',root),patch.object(m,'nginx_snapshot',return_value='o'),patch.object(m,'process_at',return_value={'pid':4}),patch.object(m,'command',side_effect=m.Stop('syntax')),patch.object(m,'direct_health'),patch.object(m,'recover') as recovery:
                with self.assertRaisesRegex(m.Stop,'rollback_verified'):m.switch(state,site,m.rewrite(SITE,4300))
            recovery.assert_called_once()

    def test_recovery_failure_is_critical_not_false_success(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'state').mkdir();site=root/'site';site.write_text(SITE)
            state={'id':'20261027T120000Z-aaaaaaaa','before_hash':m.digest(SITE.encode()),'other_hash':'o','port':4300,'commit':SHA,'previous_port':3004,'previous_process':{'pid':4},'status':'pending'}
            with patch.object(m.os,'chown'),patch.object(m,'ROOT',root),patch.object(m,'nginx_snapshot',return_value='o'),patch.object(m,'process_at',return_value={'pid':4}),patch.object(m,'command',side_effect=m.Stop('syntax')),patch.object(m,'direct_health'),patch.object(m,'recover',side_effect=m.Stop('recovery')):
                with self.assertRaisesRegex(m.Stop,'CRITICAL'):m.switch(state,site,m.rewrite(SITE,4300))
            self.assertEqual(state['status'],'CRITICAL-rollback-unconfirmed')

    def test_recover_restores_exact_backup_and_checks_health(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'state').mkdir();site=root/'site';new=m.rewrite(SITE,4300);site.write_text(new)
            ident='20261027T120000Z-aaaaaaaa';(root/'state'/f'{ident}.nginx').write_text(SITE)
            state={'id':ident,'before_hash':m.digest(SITE.encode()),'after_hash':m.digest(new.encode()),'previous_port':3004,'previous_process':{'pid':4},'other_files':{},'other_directories':{}}
            with patch.object(m.os,'chown'),patch.object(m,'ROOT',root),patch.object(m,'process_at',return_value={'pid':4}),patch.object(m,'direct_health') as health,patch.object(m,'public_health'),patch.object(m,'command') as cmd:
                m.recover(state,site)
            self.assertEqual(site.read_text(),SITE);self.assertEqual(health.call_count,2);self.assertEqual(cmd.call_count,2)

    def test_recover_refuses_unrelated_edits_or_changed_previous_process(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);site=root/'site';site.write_text(SITE);other=root/'production';other.write_text('changed')
            state={'after_hash':m.digest(SITE.encode()),'before_hash':m.digest(SITE.encode()),'previous_port':3004,'previous_process':{'pid':4},'other_files':{str(other):m.digest(b'original')},'other_directories':{}}
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

    def test_verified_pm2_path_is_consistent_and_root_guard_remains(self):
        self.assertEqual(m.PM2,'/usr/bin/pm2')
        service=(SOURCE/'scripts/vps/monetcore-review-pm2.service').read_text()
        launcher=(SOURCE/'scripts/vps/review-pm2-start.sh').read_text()
        guide=(SOURCE/'docs/review-deployment-automation.md').read_text()
        self.assertIn('/usr/bin/pm2 kill',service)
        self.assertIn('exec /usr/bin/pm2 resurrect',launcher)
        self.assertIn('exec /usr/bin/pm2 ping',launcher)
        for text in [service,launcher,guide]:self.assertNotIn('/usr/local/bin/pm2',text)
        self.assertIn('trusted(Path(PM2).resolve())',(SOURCE/'scripts/vps/review-deploy.py').read_text())

    def test_runtime_uses_verified_pm2_only_after_isolation_checks(self):
        with tempfile.TemporaryDirectory() as tmp:
            home=Path(tmp)/'home';pm2=home/'.pm2';pm2.mkdir(parents=True)
            (pm2/'pm2.pid').write_text('123')
            proc=Path(tmp)/'proc';(proc/'123').mkdir(parents=True)
            (proc/'123/cgroup').write_text('0::/system.slice/'+m.UNIT+'\n')
            props='\n'.join(['User='+m.USER,'NoNewPrivileges=yes','ProtectHome=yes','ProtectSystem=strict','ProtectProc=invisible','IPAddressDeny=0.0.0.0/0 ::/0','IPAddressAllow=127.0.0.0/8 ::1/128','InaccessiblePaths='+m.LEGACY_HOME])
            with socket.socket(socket.AF_UNIX) as rpc:
                rpc.bind(str(pm2/'rpc.sock'))
                def local_path(value):return proc if str(value)=='/proc' else Path(value)
                with patch.object(m,'HOME',str(home)),patch.object(m,'Path',side_effect=local_path),patch.object(m.pwd,'getpwnam',return_value=SimpleNamespace(pw_uid=os.getuid())),patch.object(m,'command',side_effect=[props,'ok']) as cmd:
                    self.assertEqual(m.runtime(['ping']),'ok')
            args=cmd.call_args.args[0]
            self.assertEqual(args[:5],['/usr/sbin/runuser','-u',m.USER,'--','/usr/bin/env'])
            self.assertIn('-i',args)
            self.assertIn('PM2_HOME='+str(pm2),args)
            self.assertEqual(args[-2:],['/usr/bin/pm2','ping'])

    def test_pm2_launcher_branches_using_disposable_fake_binary(self):
        # Test the real shell flow with substituted test paths, never real PM2.
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);home=root/'runtime';(home/'.pm2').mkdir(parents=True)
            capture=root/'args';fake=root/'fake-pm2'
            fake.write_text('#!/bin/sh\nprintf \'%s\\n\' "$@" > '+shlex.quote(str(capture))+'\n');fake.chmod(0o700)
            source=(SOURCE/'scripts/vps/review-pm2-start.sh').read_text().replace('/usr/bin/pm2',shlex.quote(str(fake))).replace('/var/lib/monetcore-review-runtime',str(home))
            launcher=root/'start.sh';launcher.write_text(source)
            for saved,expected in [(False,'ping'),(True,'resurrect')]:
                if saved:(home/'.pm2/dump.pm2').write_text('{}')
                subprocess.run(['/bin/sh',str(launcher)],env={'PATH':'/usr/bin:/bin','HOME':str(home),'PM2_HOME':str(home/'.pm2')},check=True,capture_output=True)
                self.assertEqual(capture.read_text().strip(),expected)

    def test_new_identity_plan_preserves_existing_legacy_home_without_reading_contents(self):
        with collision_context() as touched:result=identities.audit()
        self.assertEqual(result['deployment_user'],'monetcore_review_actions')
        self.assertEqual(result['deployment_home'],'/var/lib/monetcore-review-actions')
        self.assertFalse(result['writes_performed']);self.assertFalse(result['activation_authorized'])
        self.assertTrue(all(not p.startswith(str(identities.LEGACY_HOME)) for p in touched))
        self.assertEqual(identities.DEPLOY_USER,m.DEPLOY_USER);self.assertEqual(identities.DEPLOY_HOME,m.DEPLOY_HOME)
        self.assertEqual(identities.RUNTIME_USER,m.USER);self.assertEqual(str(identities.RUNTIME_HOME),m.HOME)

    def test_preflight_rejects_existing_planned_user_or_group(self):
        for name,home in identities.IDENTITIES:
            user=SimpleNamespace(pw_name=name,pw_uid=1003,pw_gid=1003,pw_dir=str(home))
            group=SimpleNamespace(gr_name=name,gr_gid=1003,gr_mem=[])
            with collision_context(users=[user]),self.assertRaisesRegex(identities.Collision,'planned_user_exists'):identities.audit()
            with collision_context(groups=[group]),self.assertRaisesRegex(identities.Collision,'planned_group_exists'):identities.audit()

    def test_preflight_rejects_alias_homes_and_dangling_group_memberships(self):
        for name,home in identities.IDENTITIES:
            user=SimpleNamespace(pw_name='different',pw_uid=1003,pw_dir=str(home))
            group=SimpleNamespace(gr_name='sudo',gr_gid=27,gr_mem=[name])
            with collision_context(users=[user]),self.assertRaisesRegex(identities.Collision,'planned_home_assigned'):identities.audit()
            with collision_context(groups=[group]),self.assertRaisesRegex(identities.Collision,'existing_group_membership'):identities.audit()

    def test_preflight_rejects_all_existing_targets_including_broken_links(self):
        for target in identities.NEW_PATHS:
            for mode in [stat.S_IFREG|0o600,stat.S_IFDIR|0o700,stat.S_IFLNK|0o777]:
                with collision_context(entries={str(target):SimpleNamespace(st_uid=999,st_mode=mode)}),self.assertRaisesRegex(identities.Collision,'planned_path_already_exists'):identities.audit()

    def test_preflight_rejects_untrusted_parents_and_permission_uncertainty(self):
        for uid,mode in [(1000,stat.S_IFDIR|0o755),(0,stat.S_IFDIR|0o775),(0,stat.S_IFLNK|0o777)]:
            with collision_context(entries={'/var/lib':SimpleNamespace(st_uid=uid,st_mode=mode)}),self.assertRaisesRegex(identities.Collision,'untrusted_install_parent'):identities.audit()
        with collision_context(entries={str(identities.DEPLOY_HOME):PermissionError('synthetic')}),self.assertRaises(PermissionError):identities.audit()

    def test_commissioned_new_identity_is_required_and_legacy_uid_not_reused(self):
        context={'SUDO_USER':m.DEPLOY_USER,'SUDO_UID':'1003','SUDO_GID':'1003'}
        with commissioned_context() as trust:m.deployment_identity(context)
        self.assertEqual([c.args[0] for c in trust.call_args_list],[m.DEPLOY_HOME,m.DEPLOY_HOME/'.ssh',m.DEPLOY_HOME/'.ssh/authorized_keys'])
        for caller in [m.LEGACY_USER,'monetcore',m.USER]:
            with commissioned_context(),self.assertRaisesRegex(m.Stop,'dedicated_deployment_identity'):m.deployment_identity({**context,'SUDO_USER':caller})
        users,groups=commissioned_records();users[0].pw_uid=999
        with commissioned_context(users,groups),self.assertRaisesRegex(m.Stop,'shared_or_reserved_identity'):m.deployment_identity({**context,'SUDO_UID':'999'})

    def test_commissioned_identity_rejects_wrong_home_sudo_metadata_and_shared_groups(self):
        context={'SUDO_USER':m.DEPLOY_USER,'SUDO_UID':'1003','SUDO_GID':'1003'}
        users,groups=commissioned_records();users[0].pw_dir=m.LEGACY_HOME
        with commissioned_context(users,groups),self.assertRaisesRegex(m.Stop,'deployment_home_mismatch'):m.deployment_identity(context)
        with commissioned_context(),self.assertRaisesRegex(m.Stop,'sudo_identity_mismatch'):m.deployment_identity({**context,'SUDO_UID':'999'})
        users,groups=commissioned_records();users[0].pw_gid=999;groups[0].gr_gid=999
        with commissioned_context(users,groups),self.assertRaisesRegex(m.Stop,'shared_or_reserved_group'):m.deployment_identity({**context,'SUDO_GID':'999'})

    def test_commissioned_identity_rejects_uid_gid_and_home_aliases_or_supplemental_access(self):
        context={'SUDO_USER':m.DEPLOY_USER,'SUDO_UID':'1003','SUDO_GID':'1003'}
        for collision in ['uid','gid','home','supplemental']:
            users,groups=commissioned_records()
            if collision=='uid':users.append(SimpleNamespace(pw_name='alias',pw_uid=1003,pw_dir='/nonexistent'))
            elif collision=='home':users.append(SimpleNamespace(pw_name='alias',pw_uid=1005,pw_dir=str(m.DEPLOY_HOME)))
            elif collision=='gid':groups.append(SimpleNamespace(gr_name='alias',gr_gid=1003,gr_mem=[]))
            else:groups.append(SimpleNamespace(gr_name='sudo',gr_gid=27,gr_mem=[m.DEPLOY_USER]))
            with commissioned_context(users,groups),self.assertRaises(m.Stop):m.deployment_identity(context)
        with commissioned_context(runtime_mode=stat.S_IFLNK|0o700),self.assertRaisesRegex(m.Stop,'runtime_home_not_private'):m.deployment_identity(context)

    def test_runtime_requires_legacy_home_mask_before_daemon_access(self):
        props='\n'.join(['User='+m.USER,'NoNewPrivileges=yes','ProtectHome=yes','ProtectSystem=strict','ProtectProc=invisible','IPAddressDeny=0.0.0.0/0 ::/0','IPAddressAllow=127.0.0.0/8 ::1/128'])
        with patch.object(m,'command',return_value=props) as cmd,self.assertRaisesRegex(m.Stop,'legacy_home_mask_required'):m.runtime(['ping'])
        self.assertEqual(cmd.call_count,1)
        self.assertIn('InaccessiblePaths=-'+m.LEGACY_HOME,(SOURCE/'scripts/vps/monetcore-review-pm2.service').read_text())
        transport=(SOURCE/'scripts/vps/review-deploy-transport.sh').read_text()
        self.assertIn('monetcore_review_actions@',transport)
        self.assertNotIn('monetcore_review_deploy@',transport)
        self.assertNotIn('monetcore-review-deploy@',transport)

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
