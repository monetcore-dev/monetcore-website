#!/usr/bin/python3 -I
"""Review-only controller. Install root-owned; no shell, npm, source reset or DB access."""
from __future__ import annotations
from contextlib import contextmanager
import dataclasses
import datetime
import fcntl
import gzip
import grp
import hashlib
import http.client
import json
import os
from pathlib import Path, PurePosixPath
import pwd
import re
import shutil
import signal
import socket
import ssl
import stat
import subprocess
import sys
import tarfile
import tempfile
import time
import uuid

ROOT = Path('/srv/monetcore-review-deploy')
CONFIG = Path('/etc/monetcore-review-deploy.json')
DEPLOY_USER = 'monetcore_review_actions'
DEPLOY_HOME = Path('/var/lib/monetcore-review-automation')
LEGACY_USER = 'monetcore-review-deploy'
LEGACY_HOME = '/var/lib/monetcore-review-deploy'
LEGACY_UID = 999
USER = 'monetcore_review_runtime'
HOME = '/var/lib/monetcore-review-runtime'
UNIT = 'monetcore-review-pm2.service'
HOST = 'review.monetcore.dev'
REVIEW_ENABLED_SITE = Path('/etc/nginx/sites-enabled/monetcore-review')
PM2 = '/usr/bin/pm2'
NODE = '/usr/bin/node'
NGINX = '/usr/sbin/nginx'
PORTS = range(4300, 4311)
MAX_UPLOAD = 128 * 1024 * 1024
MAX_EXPANDED = 768 * 1024 * 1024
PAGES = ('/', '/services', '/products', '/contact', '/book', '/privacy', '/website-packages')
MARKER = '/__monetcore_review_release.json'
ENV = {'PATH':'/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin','LANG':'C.UTF-8'}

class Stop(RuntimeError):
    pass

def require(condition, category):
    if not condition:
        raise Stop(category)

def progress(category):
    print(json.dumps({'phase':category}),flush=True)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def command(args, timeout=30, env=None):
    try:
        r = subprocess.run(args, capture_output=True, timeout=timeout, env=env or ENV, check=False)
    except (OSError, subprocess.TimeoutExpired):
        raise Stop('command_unavailable_or_timeout') from None
    require(r.returncode == 0, 'command_failed_'+Path(args[0]).name)
    return r.stdout.decode('utf-8', errors='strict')

def trusted(path, directory=False):
    path = Path(path)
    # Configuration and privileged tooling must not resolve through writable paths.
    for entry in [path, *path.parents]:
        s = entry.lstat()
        require(not stat.S_ISLNK(s.st_mode) and s.st_uid == 0 and not s.st_mode & 0o022, 'untrusted_privileged_path')
    require(path.is_dir() if directory else path.is_file(), 'invalid_privileged_path')
    return path

def save(path, value):
    raw = (json.dumps(value, sort_keys=True)+'\n').encode()
    atomic(path, raw, 0o600)

def atomic(path, raw, mode, gid=None):
    fd, name = tempfile.mkstemp(prefix='.review-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(raw); f.flush(); os.fsync(f.fileno())
        os.chmod(name, mode)
        if gid is not None: os.chown(name,0,gid)
        os.replace(name, path)
        d = os.open(path.parent, os.O_DIRECTORY)
        try: os.fsync(d)
        finally: os.close(d)
    finally:
        if os.path.exists(name): os.unlink(name)


@dataclasses.dataclass
class Directive:
    words: list[str]
    children: list["Directive"] | None
    start: int
    end: int

# Small rejecting parser, not a permissive nginx rewriter. Preserve source offsets.
def parse_nginx(text):
    token = re.compile(r'\s+|\#[^\n]*|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|[{};]|[^\s{};#"\']+')
    tokens = []
    offset = 0
    for match in token.finditer(text):
        require(match.start() == offset, "Unsupported nginx syntax")
        offset = match.end()
        raw = match.group()
        if raw.isspace() or raw.startswith("#"):
            continue
        value = raw[1:-1] if raw[0] in "\"'" else raw
        require("\\" not in value, "Escaped nginx values need manual review")
        tokens.append((value, match.start(), match.end()))
    require(offset == len(text), "Unsupported nginx syntax")
    position = 0
    def block(nested=False):
        nonlocal position
        output = []
        while position < len(tokens):
            if tokens[position][0] == "}":
                require(nested, "Unexpected nginx brace")
                position += 1
                return output
            start = tokens[position][1]
            words = []
            while position < len(tokens) and tokens[position][0] not in (";", "{", "}"):
                words.append(tokens[position][0]); position += 1
            require(words and position < len(tokens), "Incomplete nginx directive")
            delim = tokens[position][0]; position += 1
            require(delim != "}", "Missing nginx semicolon")
            children = block(True) if delim == "{" else None
            end = tokens[position - 1][2]
            output.append(Directive(words, children, start, end))
        require(not nested, "Unclosed nginx block")
        return output
    return block()

def single(nodes, key):
    values = [node for node in nodes if node.words[0] == key]
    require(len(values) == 1, "Expected one nginx directive: " + key)
    return values[0]

def review_listeners(server):
    listeners=[n.words[1:] for n in server if n.words[0]=='listen']
    require(listeners and all(x for x in listeners),'listeners_required')
    return listeners


def validate_redirect(server):
    """Accept only unchanged standard review-only HTTP/Certbot redirects."""
    listeners=review_listeners(server)
    require(all(x[0] in ('80','[::]:80','127.0.0.1:80') and not x[1:] for x in listeners),'http_redirect_listener_required')
    allowed={'listen','server_name','return','if','access_log','error_log','auth_basic'}
    targets={'https://$host$request_uri','https://review.monetcore.dev$request_uri'}
    def redirect(node):
        return node.children is None and len(node.words)==3 and node.words[:2] in (['return','301'],['return','308']) and node.words[2] in targets
    returns=[n for n in server if n.words[0]=='return']
    conditions=[n for n in server if n.words[0]=='if']
    for n in server:
        require(n.words[0] in allowed,'unsupported_redirect_directive')
        if n.words[0]=='auth_basic':require(n.words==['auth_basic','off'],'public_review_required')
        if n.words[0]!='if':require(n.children is None,'nested_redirect_block_forbidden')
    if conditions:
        require(len(conditions)==1 and len(returns)==1 and returns[0].words==['return','404'],'certbot_fallback_required')
        node=conditions[0]
        require(re.fullmatch(r'\(\s*\$host\s*=\s*review\.monetcore\.dev\s*\)', ' '.join(node.words[1:])) is not None,'review_host_condition_required')
        require(node.children and len(node.children)==1 and redirect(node.children[0]),'certbot_https_redirect_required')
    else:
        require(len(returns)==1 and redirect(returns[0]),'https_redirect_required')


def vhost(text):
    nodes=parse_nginx(text)
    require(1<=len(nodes)<=2 and all(n.words==['server'] and n.children for n in nodes),'dedicated_review_servers_required')
    for node in nodes:
        require(single(node.children,'server_name').words==['server_name',HOST],'wrong_review_domain')
    https=[]
    for node in nodes:
        listeners=review_listeners(node.children)
        if all(x[0] in ('443','[::]:443','127.0.0.1:443') and 'ssl' in x and set(x[1:])<={'ssl','http2'} for x in listeners):
            https.append(node)
        else: validate_redirect(node.children)
    require(len(https)==1,'one_https_review_server_required')
    server=https[0].children
    locations=[n for n in server if n.words[0]=='location']
    require(len(locations)==3,'exact_review_locations_required')
    proxy=next((n for n in locations if n.words==['location','/']),None)
    require(proxy is not None and proxy.children,'proxy_location_required')
    exact=[n for n in locations if n.words==['location','=','/api']]
    prefix=[n for n in locations if n.words in (['location','^~','/api/'],['location','/api/'])]
    # Plain /api/ is equivalent here: extra/regex locations are rejected.
    require(len(exact)==1 and len(prefix)==1,'api_exact_and_prefix_required')
    for api in exact+prefix:
        require(api.children and len(api.children)==1 and api.children[0].words==['return','403'] and api.children[0].children is None,'api_403_required')
    server_allow={'server_name','listen','location','ssl_certificate','ssl_certificate_key','ssl_protocols','ssl_ciphers','ssl_prefer_server_ciphers','ssl_session_cache','ssl_session_timeout','ssl_session_tickets','ssl_dhparam','auth_basic','auth_basic_user_file','access_log','error_log','add_header','client_max_body_size','include','http2'}
    proxy_allow={'proxy_pass','proxy_set_header','proxy_http_version','proxy_buffering','proxy_read_timeout','proxy_connect_timeout','proxy_send_timeout','auth_basic','auth_basic_user_file','add_header'}
    for n in server:
        require(n.words[0] in server_allow and (n.children is None or n in locations),'unsupported_server_directive')
        if n.words[0]=='include':
            require(len(n.words)==2 and '*' not in n.words[1] and Path(n.words[1]).is_absolute(),'explicit_tls_include_required')
            included=parse_nginx(trusted(n.words[1]).read_text())
            require(included and all(x.children is None and x.words[0].startswith('ssl_') for x in included),'tls_only_include_required')
    for n in proxy.children:
        require(n.words[0] in proxy_allow and n.children is None,'unsupported_proxy_directive')
    for context in (server,proxy.children):
        auth=[n for n in context if n.words[0]=='auth_basic']
        require(len(auth)<=1 and all(n.words==['auth_basic','off'] for n in auth),'public_review_required')
    single(server,'ssl_certificate');single(server,'ssl_certificate_key')
    headers=[n.words[1:] for n in proxy.children if n.words[0]=='proxy_set_header']
    for key,val in [('Host','$host'),('X-Forwarded-Host','$host'),('X-Forwarded-Proto','$scheme'),('X-Forwarded-For','$remote_addr')]:
        require([x for x in headers if x and x[0].lower()==key.lower()]==[[key,val]],'overwritten_proxy_headers_required')
    upstream=single(proxy.children,'proxy_pass')
    m=re.fullmatch(r'http://127\.0\.0\.1:([0-9]{4,5})',upstream.words[1] if len(upstream.words)==2 else '')
    require(m and 1024<=int(m[1])<=65535,'literal_loopback_required')
    return int(m[1]),upstream


def rewrite(text, port):
    require(port in PORTS, 'invalid_candidate_port')
    _, node = vhost(text)
    return text[:node.start]+f'proxy_pass http://127.0.0.1:{port};'+text[node.end:]

def nginx_snapshot(site, inventory=False):
    output=command([NGINX,'-T'])
    parts=re.split(r'(?m)^# configuration file (.+):\n', output)
    require(len(parts)>2, 'nginx_effective_config_missing')
    other=parts[0]; seen=0; files={}; directories={}
    for i in range(1,len(parts),2):
        name,body=parts[i:i+2]
        if Path(name).resolve()==site:
            require(site!=REVIEW_ENABLED_SITE or Path(name)==site,'enabled_review_must_be_loaded_directly')
            seen+=1
            require(body.strip()==site.read_text().strip(), 'effective_review_config_mismatch')
        else:
            other+=f'# configuration file {name}:\n'+body
            files[name]=digest(Path(name).read_bytes())
        directories[str(Path(name).parent)]=sorted(p.name for p in Path(name).parent.iterdir())
    if Path('/etc/nginx/sites-enabled').is_dir():
        directories['/etc/nginx/sites-enabled']=sorted(p.name for p in Path('/etc/nginx/sites-enabled').iterdir())
    require(seen==1,'review_site_not_uniquely_loaded')
    result={'sha256':digest(other.encode()),'files':files,'directories':directories}
    return result if inventory else result['sha256']

def process_at(port):
    rows=command(['/usr/bin/ss','-ltnpH']).splitlines()
    rows=[r for r in rows if len(r.split())>3 and r.split()[3]==f'127.0.0.1:{port}']
    require(len(rows)==1,'review_listener_missing_or_ambiguous')
    pids=set(re.findall(r'pid=([0-9]+)',rows[0]));require(len(pids)==1,'listener_pid_unavailable')
    pid=int(pids.pop()); p=Path('/proc')/str(pid)
    return {'pid':pid,'start':p.joinpath('stat').read_text().split(') ',1)[1].split()[19], 'cwd':str(p.joinpath('cwd').resolve()), 'uid':p.stat().st_uid}

def request(port, path, method='GET', tls=False):
    try:
        if tls:
            class LocalTLS(http.client.HTTPSConnection):
                def connect(self):
                    raw=socket.create_connection(('127.0.0.1',443),timeout=self.timeout)
                    self.sock=self._context.wrap_socket(raw,server_hostname=HOST)
            c=LocalTLS(HOST,timeout=5,context=ssl.create_default_context())
        else: c=http.client.HTTPConnection('127.0.0.1',port,timeout=5)
        try:
            c.request(method,path,body=b'{}' if method=='POST' else None,headers={'Host':HOST,'Content-Type':'application/json'})
            r=c.getresponse(); body=r.read(65537);require(len(body)<=65536 or path in PAGES,'health_body_too_large')
            return r.status,body
        finally: c.close()
    except (OSError,http.client.HTTPException):
        raise Stop('health_connection_failed') from None

def direct_health(port, sha=None):
    if sha:
        status,body=request(port,MARKER)
        require(status==200 and json.loads(body)=={'commit':sha,'integrations':'disabled'},'release_marker_mismatch')
    for page in PAGES:
        require(request(port,page)[0]==200,'page_health_failed')
    if sha:
        for path in ('/api/book','/api/contact'):
            require(request(port,path,'POST')[0]==403,'application_guard_failed')
        require(request(port,'/api/book/availability?date=2030-01-07')[0]==403,'availability_guard_failed')
        require(request(port,'/api/assistant','POST')[0]==503,'assistant_guard_failed')

def public_health(sha=None):
    for page in PAGES:
        require(request(443,page,tls=True)[0]==200,'public_page_health_failed')
    if sha:
        status,body=request(443,MARKER,tls=True)
        require(status==200 and json.loads(body)=={'commit':sha,'integrations':'disabled'},'public_release_marker_mismatch')
    for path in ('/api','/api/','/api/contact','/api/book/availability?date=2030-01-07','/api/assistant'):
        for method in ('GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'):
            require(request(443,path,method,tls=True)[0]==403,'nginx_api_guard_failed')


def deployment_identity(context):
    """Read NSS and selected new-home metadata only; never inspect legacy files."""
    require(context.get('SUDO_USER')==DEPLOY_USER,'dedicated_deployment_identity_required')
    try:
        deploy=pwd.getpwnam(DEPLOY_USER);runtime_user=pwd.getpwnam(USER)
        deploy_group=grp.getgrnam(DEPLOY_USER);runtime_group=grp.getgrnam(USER)
        legacy_group=grp.getgrnam(LEGACY_USER)
    except KeyError:raise Stop('deployment_identity_not_commissioned') from None
    require(str(deploy.pw_uid)==context.get('SUDO_UID') and str(deploy.pw_gid)==context.get('SUDO_GID'),'sudo_identity_mismatch')
    require(deploy.pw_name==DEPLOY_USER and deploy.pw_dir==str(DEPLOY_HOME),'deployment_home_mismatch')
    require(runtime_user.pw_name==USER and runtime_user.pw_dir==HOME,'runtime_home_mismatch')
    require(deploy.pw_uid not in (0,LEGACY_UID,runtime_user.pw_uid) and runtime_user.pw_uid not in (0,LEGACY_UID),'shared_or_reserved_identity')
    require(deploy.pw_gid==deploy_group.gr_gid and runtime_user.pw_gid==runtime_group.gr_gid and deploy.pw_gid not in (0,legacy_group.gr_gid,runtime_user.pw_gid) and runtime_user.pw_gid not in (0,legacy_group.gr_gid),'shared_or_reserved_group')
    users={deploy.pw_uid:DEPLOY_USER,runtime_user.pw_uid:USER}
    homes={str(DEPLOY_HOME):DEPLOY_USER,HOME:USER}
    for record in pwd.getpwall():
        require(record.pw_uid not in users or record.pw_name==users[record.pw_uid],'uid_alias_collision')
        require(record.pw_dir not in homes or record.pw_name==homes[record.pw_dir],'home_alias_collision')
    groups={deploy.pw_gid:DEPLOY_USER,runtime_user.pw_gid:USER}
    for record in grp.getgrall():
        require(record.gr_gid not in groups or record.gr_name==groups[record.gr_gid],'gid_alias_collision')
        require(not any(name in record.gr_mem and record.gr_name!=name for name in (DEPLOY_USER,USER)),'unexpected_supplementary_group')
    trusted(DEPLOY_HOME,directory=True)
    trusted(DEPLOY_HOME/'.ssh',directory=True)
    trusted(DEPLOY_HOME/'.ssh/authorized_keys')
    info=Path(HOME).lstat()
    require(stat.S_ISDIR(info.st_mode) and info.st_uid==runtime_user.pw_uid and info.st_gid==runtime_user.pw_gid and not info.st_mode&0o077,'runtime_home_not_private')


def runtime(args):
    expected={'User':USER,'NoNewPrivileges':'yes','ProtectHome':'yes','ProtectSystem':'strict','ProtectProc':'invisible'}
    properties=command(['/usr/bin/systemctl','show',UNIT,'--no-pager',*[f'--property={key}' for key in [*expected,'IPAddressDeny','IPAddressAllow','InaccessiblePaths']]])
    values=dict(line.split('=',1) for line in properties.splitlines() if '=' in line)
    require(all(values.get(key)==value for key,value in expected.items()),'runtime_sandbox_required')
    require(set(values.get('IPAddressDeny','').split()) in ({'any'},{'0.0.0.0/0','::/0'}),'outbound_deny_required')
    require(set(values.get('IPAddressAllow','').split()) in ({'localhost'},{'127.0.0.0/8','::1/128'}),'loopback_only_allow_required')
    require(LEGACY_HOME in {p.lstrip('-') for p in values.get('InaccessiblePaths','').split()},'legacy_home_mask_required')
    user=pwd.getpwnam(USER)
    pidfile=Path(HOME)/'.pm2/pm2.pid'
    pid=int(pidfile.read_text().strip()); proc=Path('/proc')/str(pid)
    require(proc.stat().st_uid==user.pw_uid and '/'+UNIT in proc.joinpath('cgroup').read_text(),'isolated_pm2_unit_required')
    rpc=Path(HOME)/'.pm2/rpc.sock'
    require(stat.S_ISSOCK(rpc.lstat().st_mode) and rpc.stat().st_uid==user.pw_uid,'existing_review_daemon_required')
    return command(['/usr/sbin/runuser','-u',USER,'--','/usr/bin/env','-i',f'HOME={HOME}',f'PM2_HOME={HOME}/.pm2','PATH=/usr/local/bin:/usr/bin:/bin',PM2,*args])


def archive_members(archive):
    seen=set(); members=[]; total=0
    for m in archive:
        name=m.name
        if name in ('.','./') and m.isdir(): continue
        if m.isdir(): name=name.rstrip('/')
        if name.startswith('./'): name=name[2:]
        path=PurePosixPath(name)
        require(name and not path.is_absolute() and '\\' not in name and all(x not in ('','.','..') for x in name.split('/')) and not any(ord(c)<32 for c in name),'unsafe_archive_path')
        require(name not in seen and len(seen)<30000,'duplicate_or_excessive_entries')
        require(m.isdir() or m.isreg(),'links_or_special_entries_forbidden')
        require(not m.issparse(),'sparse_entries_forbidden')
        require(not any(x.startswith('.env') or x in ('.git','.ssh','.aws','.vercel') or x.lower().endswith(('.pem','.key','.dump')) for x in path.parts),'secret_or_metadata_entry_forbidden')
        total+=m.size;require(0<=m.size and total<=MAX_EXPANDED,'expanded_archive_too_large')
        seen.add(name);members.append((m,name))
    require({'server.js','review-start.cjs','release.json','.next/BUILD_ID','public'+MARKER}<=seen,'artifact_incomplete')
    return members


def validate_tar_headers(path):
    # USTAR only: bound/check each raw header before tarfile can allocate PAX or
    # GNU extension payloads. The runner deliberately emits this simple format.
    entries=0
    with path.open('rb') as f:
        while True:
            block=f.read(512)
            require(len(block)==512,'truncated_tar_header')
            if block==bytes(512):
                require(f.read(512)==bytes(512),'missing_tar_terminator')
                return
            header=tarfile.TarInfo.frombuf(block,'utf-8','strict')
            entries+=1
            require(entries<=30001 and header.type in (tarfile.REGTYPE,tarfile.AREGTYPE,tarfile.DIRTYPE),'extended_or_special_tar_header')
            require(0<=header.size<=128*1024*1024,'individual_file_too_large')
            f.seek(((header.size+511)//512)*512,1)


def unpack(stream, sha, checksum, dest):
    # Decompress before parsing any potentially huge tar extended headers.
    with tempfile.TemporaryDirectory(dir=ROOT/'incoming') as tmp:
        packed=Path(tmp)/'artifact.gz'; raw=Path(tmp)/'artifact.tar'; h=hashlib.sha256(); size=0
        with packed.open('xb') as out:
            while block:=stream.read(1024*1024):
                size+=len(block);require(size<=MAX_UPLOAD,'upload_too_large');h.update(block);out.write(block)
        require(h.hexdigest()==checksum,'checksum_mismatch')
        size=0
        with gzip.open(packed,'rb') as source, raw.open('xb') as out:
            while block:=source.read(1024*1024):
                size+=len(block);require(size<=MAX_EXPANDED+32*1024*1024,'decompressed_archive_too_large');out.write(block)
        validate_tar_headers(raw)
        dest.mkdir(mode=0o755)  # Never reuse or overwrite an existing release.
        dest.chmod(0o755)
        with tarfile.open(raw,'r:') as archive:
            for m,name in archive_members(archive):
                target=dest/name
                if m.isdir(): target.mkdir(mode=0o755,parents=True,exist_ok=True)
                else:
                    target.parent.mkdir(mode=0o755,parents=True,exist_ok=True)
                    with archive.extractfile(m) as source,target.open('xb') as out: shutil.copyfileobj(source,out)
                    target.chmod(0o755 if m.mode&0o111 else 0o644)
        for directory in dest.rglob('*'):
            if directory.is_dir(): directory.chmod(0o755)
        manifest=json.loads((dest/'release.json').read_text())
        require(manifest['commit']==sha and manifest['platform']=='linux' and manifest['arch']=='x64','artifact_platform_or_commit_mismatch')
        build=tuple(map(int,manifest['node'].split('.')))
        current=tuple(map(int,command([NODE,'--version']).strip().lstrip('v').split('.')))
        require(build[0]==24 and current[0]==24 and current>=build,'node_runtime_incompatible')
        libc=tuple(map(int,os.confstr('CS_GNU_LIBC_VERSION').split()[1].split('.')))
        require(tuple(map(int,manifest['glibc'].split('.'))) <= libc,'libc_incompatible')
        # Cache is the only writable release subtree; source/runtime files stay root-owned.
        cache=dest/'.next/cache';cache.mkdir(mode=0o700,exist_ok=True)
        user=pwd.getpwnam(USER);os.chown(cache,user.pw_uid,user.pw_gid);cache.chmod(0o700)


def validate_site_path(site):
    # Add only the owner-verified enabled regular file, not arbitrary enabled sites.
    legacy=site.parent in (Path('/etc/nginx/sites-available'),Path('/etc/nginx/conf.d')) and site.name!='nginx.conf'
    require(site==REVIEW_ENABLED_SITE or legacy,'dedicated_site_path_required')
    return trusted(site)  # lstat: root-owned regular file, no symlink/writable ancestors.


def load_config():
    trusted(CONFIG)
    cfg=json.loads(CONFIG.read_text())
    require(set(cfg)=={'nginx_site','other_nginx_sha256'},'invalid_config_keys')
    site=Path(cfg['nginx_site'])
    validate_site_path(site);vhost(site.read_text())
    return cfg,site


def write_site(site, text):
    info=site.stat()
    atomic(site,text.encode(),stat.S_IMODE(info.st_mode),info.st_gid)


def recover(state, site):
    require(digest(site.read_bytes()) in (state['after_hash'],state['before_hash']),'review_config_changed_stop')
    # Nginx -T can fail because the candidate review config failed syntax checks.
    # Independently hash the previously loaded other files and directory entries
    # before restoring; do not reload unrelated pending edits.
    require(all(digest(Path(p).read_bytes())==h for p,h in state['other_files'].items()),'unrelated_nginx_change_stop')
    require(all(sorted(x.name for x in Path(p).iterdir())==names for p,names in state['other_directories'].items()),'unrelated_nginx_change_stop')
    require(process_at(state['previous_port'])==state['previous_process'],'previous_process_changed_stop')
    direct_health(state['previous_port'])
    backup=ROOT/'state'/f"{state['id']}.nginx"
    require(digest(backup.read_bytes())==state['before_hash'],'backup_integrity_failed')
    write_site(site,backup.read_text())
    command([NGINX,'-t']);command(['/usr/bin/systemctl','reload','nginx'])
    direct_health(state['previous_port']);public_health()


def switch(state, site, new_text):
    # Persist recoverable state before the first live routing mutation.
    save(ROOT/'state'/f"{state['id']}.json",state)
    try:
        require(digest(site.read_bytes())==state['before_hash'],'review_config_changed_stop')
        require(nginx_snapshot(site)==state['other_hash'],'unrelated_nginx_change_stop')
        require(process_at(state['previous_port'])==state['previous_process'],'previous_process_changed_stop')
        direct_health(state['previous_port'])
        progress('switching_review_upstream')
        write_site(site,new_text)
        command([NGINX,'-t']);command(['/usr/bin/systemctl','reload','nginx'])
        direct_health(state['port'],state['commit']);public_health(state['commit'])
        progress('post_switch_health_passed')
        runtime(['save','--force'])  # Isolated review daemon only, never production PM2.
        state['status']='active';save(ROOT/'state'/f"{state['id']}.json",state)
    except BaseException:
        try:
            recover(state,site)
            progress('automatic_rollback_verified')
            state['status']='rolled-back';save(ROOT/'state'/f"{state['id']}.json",state)
        except BaseException:
            state['status']='CRITICAL-rollback-unconfirmed';save(ROOT/'state'/f"{state['id']}.json",state)
            raise Stop('CRITICAL_rollback_unconfirmed') from None
        raise Stop('deployment_failed_rollback_verified') from None


def deploy(stream, sha, checksum, cfg, site):
    before=site.read_text();oldport,_=vhost(before)
    snapshot=nginx_snapshot(site,inventory=True);other=snapshot['sha256'];require(other==cfg['other_nginx_sha256'],'unrelated_nginx_change_stop')
    previous=process_at(oldport);direct_health(oldport);public_health()
    available=next((int(x.split()[1]) for x in Path('/proc/meminfo').read_text().splitlines() if x.startswith('MemAvailable:')),0)
    require(available>=768*1024,'insufficient_memory_headroom')
    require(shutil.disk_usage(ROOT).free>=2*MAX_EXPANDED+MAX_UPLOAD,'insufficient_disk_headroom')
    require(len(list((ROOT/'releases').iterdir()))<12,'release_retention_limit')
    # Validate Node/PM2 tools before executing them as the isolated runtime user.
    trusted(Path(NODE).resolve());trusted(Path(PM2).resolve())
    runtime(['ping'])
    progress('preflight_passed')
    port=None
    for candidate in PORTS:
        try:
            with socket.socket() as probe: probe.bind(('127.0.0.1',candidate))
            port=candidate;break
        except OSError: pass
    require(port is not None,'no_free_review_port')
    release_id=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ-')+uuid.uuid4().hex[:8]
    release=ROOT/'releases'/release_id
    unpack(stream,sha,checksum,release)
    progress('artifact_verified')
    name='monetcore-review-'+release_id
    started=False
    state=None
    try:
        ecosystem={'apps':[{'name':name,'script':str(release/'review-start.cjs'),'cwd':str(release),'interpreter':NODE,'instances':1,'exec_mode':'fork','max_memory_restart':'512M','restart_delay':3000,'env':{'PORT':str(port)}}]}
        ecosystem_path=release/'review-ecosystem.json'
        with ecosystem_path.open('x') as f: json.dump(ecosystem,f)
        ecosystem_path.chmod(0o644)
        runtime(['start',str(ecosystem_path),'--only',name])
        started=True
        progress('candidate_started')
        for attempt in range(30):
            try: direct_health(port,sha);break
            except (Stop,ValueError):
                require(attempt<29,'candidate_health_failed');time.sleep(1)
        progress('candidate_health_passed')
        candidate=process_at(port)
        require(candidate['uid']==pwd.getpwnam(USER).pw_uid and Path(candidate['cwd'])==release,'candidate_process_mismatch')
        require(digest(site.read_bytes())==digest(before.encode()),'review_config_changed_stop')
        new_text=rewrite(before,port)
        state={'id':release_id,'commit':sha,'port':port,'previous_port':oldport,'previous_process':previous,'before_hash':digest(before.encode()),'after_hash':digest(new_text.encode()),'other_hash':other,'other_files':snapshot['files'],'other_directories':snapshot['directories'],'status':'pending'}
        backup=ROOT/'state'/f'{release_id}.nginx'
        with backup.open('xb') as f: f.write(before.encode());f.flush();os.fsync(f.fileno())
        backup.chmod(0o600)
        switch(state,site,new_text)
        return {'status':'active','release':release_id,'commit':sha,'previous_port':oldport,'port':port}
    except BaseException:
        # Never remove the previous process. Keep candidate on unconfirmed recovery.
        if started and (state is None or state.get('status')!='CRITICAL-rollback-unconfirmed'):
            try:
                runtime(['delete',name]);runtime(['save','--force'])
            except Stop: pass
        raise


@contextmanager
def deployment_lock():
    fd=os.open(ROOT/'state/.deploy.lock',os.O_CREAT|os.O_RDWR|os.O_NOFOLLOW,0o600)
    with os.fdopen(fd,'w') as lock:
        try: fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError: raise Stop('deployment_in_progress') from None
        yield


def main():
    os.umask(0o077)
    require(os.geteuid()==0,'root_owned_controller_required')
    trusted(Path(__file__).resolve())
    for p in (ROOT, ROOT/'state', ROOT/'incoming', ROOT/'releases'): trusted(p,directory=True)
    cfg,site=load_config()
    args=sys.argv[1:]
    if args==['inspect']:
        print(json.dumps({'domain':HOST,'review_port':vhost(site.read_text())[0],'other_nginx_sha256':nginx_snapshot(site)}));return
    require((len(args)==3 and args[0]=='deploy' and re.fullmatch('[a-f0-9]{40}',args[1]) and re.fullmatch('[a-f0-9]{64}',args[2])) or (len(args)==2 and args[0]=='rollback' and re.fullmatch('[0-9]{8}T[0-9]{6}Z-[a-f0-9]{8}',args[1])),'invalid_protocol')
    for sig in (signal.SIGTERM,signal.SIGINT,signal.SIGHUP,signal.SIGALRM): signal.signal(sig,lambda *_: (_ for _ in ()).throw(Stop('interrupted')))
    signal.alarm(600)
    deployment_identity(os.environ)
    with deployment_lock():
        if args[0]=='deploy': result=deploy(sys.stdin.buffer,args[1],args[2],cfg,site)
        else:
            statepath=ROOT/'state'/f'{args[1]}.json';trusted(statepath)
            state=json.loads(statepath.read_text());require(state['status']=='active','release_not_active')
            require(digest(site.read_bytes())==state['after_hash'],'not_current_release')
            recover(state,site);state['status']='rolled-back';save(statepath,state)
            result={'status':'rolled-back','release':args[1],'previous_port':state['previous_port']}
        print(json.dumps(result))

if __name__=='__main__':
    try: main()
    except BaseException as error:
        print(json.dumps({'status':'failed','category':str(error) if isinstance(error,Stop) else 'controller_error'}),file=sys.stderr)
        sys.exit(1)
