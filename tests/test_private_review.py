"""Disposable test files and mocked PM2/nginx only; never touches system services."""
import importlib.util
import json
import os
from pathlib import Path
import socket
import sys
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("private_review", Path(__file__).resolve().parents[1] / "scripts/vps/private_review.py")
m = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = m
spec.loader.exec_module(m)
VHOST = '''# review only; preserve comments and credential paths
server {
 listen 443 ssl;
 server_name review.monetcore.dev;
 ssl_certificate /etc/letsencrypt/live/review/fullchain.pem;
 ssl_certificate_key /etc/letsencrypt/live/review/privkey.pem;
 auth_basic "Private review";
 auth_basic_user_file /etc/nginx/private-review.htpasswd;
 location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $remote_addr;
 }
}
'''
BUILD = {"node": "v24.19.0", "platform": "linux", "arch": "x64", "glibc": "2.39"}

class FakeCommands:
    def __init__(self, case):
        self.case = case
        self.calls = []
        self.apps = [{"name": "old-review", "pid": 10001, "pm2_env": {"status": "online", "pm_cwd": "/old-preserved", "env": {"PASSWORD": "synthetic-not-for-output"}}}]
        self.fail_nginx_test = False
        self.reloads = 0
    def run(self, args, cwd=None, env=None, timeout=60):
        args = [str(x) for x in args]; self.calls.append(args)
        if args[:2] == ["pm2", "jlist"]: return json.dumps(self.apps)
        if args[:3] == ["sudo", "-n", "nginx"]:
            if args[-1] == "-T": return "# configuration file " + str(self.case.site) + ":\n" + self.case.site.read_text()
            if self.fail_nginx_test:
                self.fail_nginx_test = False; raise m.Stop("Simulated nginx test failure")
            return ""
        if args[:3] == ["sudo", "-n", "install"]:
            Path(args[-1]).write_bytes(Path(args[-2]).read_bytes()); return ""
        if args[:3] == ["sudo", "-n", "mv"]:
            Path(args[-2]).replace(args[-1]); return ""
        if args[:3] == ["sudo", "-n", "systemctl"]:
            self.reloads += 1; return ""
        if args[:2] == ["pm2", "start"]:
            self.apps.append({"name": args[args.index("--name")+1], "pid": 10002, "pm2_env": {"status": "online", "pm_cwd": str(self.case.release)}}); return ""
        if args[:2] == ["pm2", "delete"]:
            self.apps = [app for app in self.apps if app["name"] != args[2]]; return ""
        if args[:2] == ["ss", "-ltnpH"]:
            text = 'LISTEN 0 10 127.0.0.1:3000 0.0.0.0:* users:(("node",pid=10001,fd=1))\n'
            if len(self.apps)>1: text += f'LISTEN 0 10 127.0.0.1:{self.case.port} 0.0.0.0:* users:(("node",pid=10002,fd=1))\n'
            return text
        if args[:2] == ["ps", "-eo"]: return "10001 100\n10002 100\n10003 10001\n"
        if args[:3] == ["node", "-p", args[-1]]: return json.dumps(BUILD)
        if args[:2] == ["node", "--version"]: return BUILD["node"]
        if args[:3] == ["git", "rev-parse", "HEAD"]: return m.SOURCE_COMMIT
        if args[:2] == ["git", "status"]: return ""
        raise AssertionError("Unexpected test command: " + args[0])

class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="monetcore-review-test-")
        self.root = Path(self.temp.name); self.root.chmod(0o700)
        self.releases = self.root / "releases"; self.releases.mkdir(mode=0o700)
        self.release = self.releases / "candidate"; self.release.mkdir(mode=0o700)
        self.state = self.root / "state"; self.state.mkdir(mode=0o700)
        self.home = self.root / "pm2"; self.home.mkdir(mode=0o700)
        (self.home / "pm2.pid").write_text(str(os.getpid()))
        self.rpc=socket.socket(socket.AF_UNIX,socket.SOCK_STREAM);self.rpc.bind(str(self.home/"rpc.sock"));self.rpc.listen(128)
        self.site = self.root / "review.conf"; self.site.write_text(VHOST); self.site.chmod(0o600)
        with socket.socket() as probe: probe.bind(("127.0.0.1", 0)); self.port = probe.getsockname()[1]
        self.config = m.Config(self.releases, self.state, self.home, self.site, "old-review", self.port)
        self.commands = FakeCommands(self)
        self.release.joinpath(".next").mkdir(); self.release.joinpath(".next/BUILD_ID").write_text("test-build")
        self.marker={"commit":m.SOURCE_COMMIT,"mode":"private-visual-review","release_id":"1"*32,"build_id":"test-build"}
        self.release.joinpath("public").mkdir();self.release.joinpath("public",m.MARKER.lstrip("/")).write_text(json.dumps(self.marker))
        self.release.joinpath(".private-review-start.cjs").write_text("// fixture launcher")
        self.release.joinpath(".private-review-prepared.json").write_text(json.dumps({"commit": m.SOURCE_COMMIT, "marker": self.marker, "build": BUILD, "checks": ["npm ci", "typecheck", "test", "offline staging", "lint", "build"], "launcher_hash": m.digest(b"// fixture launcher"), "build_id": "test-build"}))
        self.bad_candidate = False; self.auth_lost = False
        self.tool = m.Deployment(self.config, self.commands, self.fetch, prompt=lambda _: f"SWITCH REVIEW {m.SOURCE_COMMIT[:12]} {self.port}")
    def tearDown(self): self.rpc.close();self.temp.cleanup()
    def fetch(self, path, port=None, credential=None, method="GET", body=None):
        current, _ = m.review_vhost(self.site.read_text())
        if port is None and credential is None:
            return (200, {}, b"unprotected") if self.auth_lost and current == self.port else (401, {"www-authenticate": 'Basic realm="Review"'}, b"")
        if path == m.MARKER:
            return 200, {}, json.dumps({**self.marker, "commit": "wrong" if self.bad_candidate and port else m.SOURCE_COMMIT}).encode()
        if path.startswith("/customer"): return 200, {"x-robots-tag": "noindex, nofollow"}, b"Customer access and registration are not enabled."
        if path.startswith("/api/"):
            return (503 if path.startswith(("/api/customer", "/api/assistant")) else 403), {}, b"{}"
        if path == "/robots.txt": return 200, {}, b"User-agent: *\nDisallow: /\n"
        return 200, {}, b"healthy"
    def test_parser_preserves_file_except_literal_upstream(self):
        changed = m.updated_vhost(VHOST,self.port)
        self.assertEqual(changed,VHOST.replace("proxy_pass http://127.0.0.1:3000;",f"proxy_pass http://127.0.0.1:{self.port};"))
        self.assertEqual(m.review_vhost(changed)[0],self.port)
    def test_rejects_production_and_mixed_vhosts(self):
        for text in [VHOST.replace(m.HOST,"monetcore.dev"),VHOST+VHOST,VHOST.replace(m.HOST,m.HOST+" monetcore.dev")]:
            with self.subTest(text=text[:25]),self.assertRaises(m.Stop): m.review_vhost(text)
    def test_auth_off_any_satisfy_rewrites_and_other_locations_refused(self):
        for addition in ['auth_basic off;', 'satisfy any;', 'location /api { auth_basic off; }', 'return 200 "fake";', 'rewrite ^ /other;']:
            with self.subTest(addition=addition),self.assertRaises(m.Stop):m.review_vhost(VHOST.replace(' location / {',addition+'\n location / {'))
    def test_forwarded_header_chain_or_missing_header_refused(self):
        for text in [VHOST.replace('$remote_addr','$proxy_add_x_forwarded_for'),VHOST.replace('  proxy_set_header X-Forwarded-Host $host;\n',''),VHOST.replace('http://127.0.0.1:3000','http://0.0.0.0:3000')]:
            with self.assertRaises(m.Stop):m.review_vhost(text)
    def test_only_tls_includes_allowed(self):
        text=VHOST.replace(' listen',' include /etc/nginx/tls-only.conf;\n listen',1)
        self.assertEqual(m.review_vhost(text,lambda _: 'ssl_session_timeout 1d;')[0],3000)
        with self.assertRaises(m.Stop):m.review_vhost(text,lambda _: 'auth_basic off;')
    def test_loopback_health_and_private_probes(self):
        m.verify_release(self.fetch,port=self.port);m.verify_private(self.fetch)
        self.bad_candidate=True
        with self.assertRaises(m.Stop):m.verify_release(self.fetch,port=self.port)
    def test_malformed_marker_and_enabled_api_fail_health(self):
        def malformed(path,**kwargs):return (200,{},b"[]") if path==m.MARKER else self.fetch(path,**kwargs)
        with self.assertRaises(m.Stop):m.verify_release(malformed,port=self.port)
        def enabled(path,**kwargs):return (200,{},b"{}") if path=="/api/contact" else self.fetch(path,**kwargs)
        with self.assertRaises(m.Stop):m.verify_release(enabled,port=self.port)
    def test_full_switch_keeps_old_process_and_does_not_pm2_save(self):
        result,state=self.tool.switch(self.release,"Basic synthetic-only")
        self.assertEqual(result['status'],'switched');self.assertTrue(state.exists());self.assertEqual(len(self.commands.apps),2)
        self.assertEqual(self.commands.reloads,1);self.assertEqual(m.review_vhost(self.site.read_text())[0],self.port)
        self.assertFalse(any(args[:2]==['pm2','save'] for args in self.commands.calls))
        self.assertEqual((state.parent/'nginx.before.conf').read_text(),VHOST)
    def test_post_switch_auth_failure_automatically_restores_original(self):
        self.auth_lost=True
        with self.assertRaises(m.Stop):self.tool.switch(self.release,"Basic synthetic-only")
        self.assertEqual(self.site.read_text(),VHOST);self.assertEqual(self.commands.reloads,2);self.assertEqual(len(self.commands.apps),2)
        self.assertEqual(json.loads(next(self.state.glob('*/state.json')).read_text())['status'],'rolled_back')
    def test_unconfirmed_rollback_is_reported_critical_and_preserves_both_processes(self):
        self.auth_lost=True
        def unavailable(*args):raise m.Stop("simulated rollback unavailable")
        self.tool.restore=unavailable
        with self.assertRaisesRegex(m.Stop,"CRITICAL: rollback unconfirmed"):self.tool.switch(self.release,"Basic synthetic-only")
        self.assertEqual(len(self.commands.apps),2)
        self.assertEqual(json.loads(next(self.state.glob('*/state.json')).read_text())['status'],'rollback_unconfirmed')
    def test_rotated_rollback_process_is_not_treated_as_original(self):
        result,state=self.tool.switch(self.release,"Basic synthetic-only")
        self.commands.apps[0]['pid']=20000
        with self.assertRaises(m.Stop):self.tool.restore(state.parent,result,"Basic synthetic-only")
        self.assertEqual(m.review_vhost(self.site.read_text())[0],self.port)
    def test_failed_nginx_test_rolls_back_before_success(self):
        self.commands.fail_nginx_test=True
        with self.assertRaises(m.Stop):self.tool.switch(self.release,"Basic synthetic-only")
        self.assertEqual(self.site.read_text(),VHOST);self.assertEqual(len(self.commands.apps),2)
    def test_confirmation_declined_preserves_upstream_and_only_removes_candidate(self):
        self.tool.prompt=lambda _: 'NO'
        with self.assertRaises(m.Stop):self.tool.switch(self.release,"Basic synthetic-only")
        self.assertEqual(self.site.read_text(),VHOST);self.assertEqual(self.commands.apps[0]['name'],'old-review');self.assertEqual(len(self.commands.apps),1)
    def test_low_memory_refuses_to_risk_running_rollback_process(self):
        with patch.object(m,"available_memory_kib",return_value=1),self.assertRaises(m.Stop):self.tool.switch(self.release,"Basic synthetic-only")
        self.assertFalse(any(args[:2]==["pm2","start"] for args in self.commands.calls))
        self.assertEqual(self.site.read_text(),VHOST)
    def test_occupied_port_stops_without_starting_candidate(self):
        with socket.socket() as busy:
            busy.bind(("127.0.0.1",self.port));busy.listen()
            with self.assertRaises(m.Stop):self.tool.switch(self.release,"Basic synthetic-only")
        self.assertFalse(any(args[:2]==['pm2','start'] for args in self.commands.calls))
    def test_unhealthy_candidate_never_switches(self):
        self.bad_candidate=True
        with patch.object(m.time,'sleep'),self.assertRaises(m.Stop):self.tool.switch(self.release,"Basic synthetic-only")
        self.assertEqual(self.site.read_text(),VHOST);self.assertEqual(len(self.commands.apps),1)
    def test_concurrent_nginx_edit_is_not_overwritten(self):
        def edited(_):self.site.write_text(VHOST+'# operator edit\n');return f"SWITCH REVIEW {m.SOURCE_COMMIT[:12]} {self.port}"
        self.tool.prompt=edited
        with self.assertRaises(m.Stop):self.tool.switch(self.release,"Basic synthetic-only")
        self.assertTrue(self.site.read_text().endswith('# operator edit\n'));self.assertEqual(len(self.commands.apps),1)
    def test_unrelated_nginx_change_blocks_later_reload(self):
        result,state=self.tool.switch(self.release,"Basic synthetic-only")
        original=self.commands.run
        def changed(args,**kwargs):
            output=original(args,**kwargs)
            return output+"\n# configuration file /etc/nginx/unrelated.conf:\n# operator change\n" if list(args)==["sudo","-n","nginx","-T"] else output
        self.commands.run=changed
        with self.assertRaises(m.Stop):self.tool.restore(state.parent,result,"Basic synthetic-only")
        self.assertEqual(self.commands.reloads,1)
    def test_later_manual_rollback_refuses_external_config_change(self):
        result,state=self.tool.switch(self.release,"Basic synthetic-only")
        self.site.write_text(self.site.read_text()+'# changed later\n')
        with self.assertRaises(m.Stop):self.tool.restore(state.parent,result,"Basic synthetic-only")
        self.assertTrue(self.site.read_text().endswith('# changed later\n'))
    def test_manual_rollback_restores_bytes_and_preserves_both_processes(self):
        result,state=self.tool.switch(self.release,"Basic synthetic-only")
        self.tool.restore(state.parent,result,"Basic synthetic-only")
        self.assertEqual(self.site.read_text(),VHOST);self.assertEqual(result['status'],'rolled_back');self.assertEqual(len(self.commands.apps),2)
    def test_build_or_launcher_tampering_refused(self):
        self.release.joinpath('.private-review-start.cjs').write_text('altered')
        with self.assertRaises(m.Stop):self.tool.validate_prepared(self.release)
        self.assertEqual(len(self.commands.apps),1)
    def test_older_node_or_glibc_build_runtime_mismatch_fails_closed(self):
        with patch.dict(BUILD,{"node":"v24.0.0"}),self.assertRaises(m.Stop):self.tool.validate_prepared(self.release)
        with patch.dict(BUILD,{"glibc":"2.35"}),self.assertRaises(m.Stop):self.tool.validate_prepared(self.release)
    def test_loopback_port_must_belong_to_named_pm2_ancestor(self):
        self.tool.owned_listener('LISTEN 0 10 127.0.0.1:3000 0.0.0.0:* users:(("node",pid=10003,fd=1))',3000,10001)
        for text in ['LISTEN 0 10 0.0.0.0:3000 0.0.0.0:* users:(("node",pid=10003,fd=1))','LISTEN 0 10 127.0.0.1:3000 0.0.0.0:* users:(("node",pid=99999,fd=1))']:
            with self.assertRaises(m.Stop):self.tool.owned_listener(text,3000,10001)
    def test_sanitized_runtime_does_not_inherit_secrets_or_activation(self):
        with patch.dict(os.environ,{'OPENAI_API_KEY':'synthetic-only','MONETCORE_EMAIL_PASSWORD':'synthetic-only','CUSTOMER_PLATFORM_ENABLED':'true','NODE_OPTIONS':'synthetic-only'}):
            safe=m.safe_environment();runtime=m.runtime_environment()
        self.assertNotIn('OPENAI_API_KEY',safe);self.assertNotIn('MONETCORE_EMAIL_PASSWORD',runtime);self.assertNotIn('NODE_OPTIONS',safe)
        self.assertTrue(all(runtime[key]=='false' for key in m.OFF));self.assertEqual(runtime['AI_ASSISTANT_EMERGENCY_STOP'],'true')
    def test_inspect_redacts_pm2_environment(self):
        result=self.tool.inspect();self.assertNotIn('PASSWORD',json.dumps(result));self.assertNotIn('synthetic-not-for-output',json.dumps(result))
    def test_missing_rpc_socket_does_not_launch_a_new_pm2_daemon(self):
        self.rpc.close();(self.home/"rpc.sock").unlink()
        with self.assertRaises(m.Stop):self.tool.pm2_apps()
        self.assertEqual(self.commands.calls,[])
    def test_missing_pm2_daemon_is_not_started(self):
        (self.home/'pm2.pid').unlink()
        with self.assertRaises(m.Stop):self.tool.pm2_apps()
        self.assertEqual(self.commands.calls,[])

if __name__ == '__main__':unittest.main()
