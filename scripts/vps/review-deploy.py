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
    return {'pid':pid,'start':p.joinpath('stat').read_text().rsplit(') ',1)[1].split()[19], 'cwd':str(p.joinpath('cwd').resolve()), 'uid':p.stat().st_uid}

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
    metadata=pidfile.lstat()
    require(stat.S_ISREG(metadata.st_mode) and metadata.st_uid==user.pw_uid and not metadata.st_mode & 0o022,'invalid_pm2_pidfile')
    pid=int(pidfile.read_text().strip()); proc=Path('/proc')/str(pid)
    require(proc.stat().st_uid==user.pw_uid and any(UNIT in line.split(':',2)[-1].split('/') for line in proc.joinpath('cgroup').read_text().splitlines()),'isolated_pm2_unit_required')
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


# Lifecycle V2: root-authored intent/index, independent of historical active flags.
ID_PATTERN = r'[0-9]{8}T[0-9]{6}Z-[a-f0-9]{8}'
CGROUP_ROOT = Path('/sys/fs/cgroup')
PROC_ROOT = Path('/proc')
TERMINAL = {'active', 'rolled-back', 'committed', 'aborted'}


def identifier(value):
    require(isinstance(value,str) and re.fullmatch(ID_PATTERN,value),'invalid_release_identity')
    return value


def private_json(path):
    trusted(path)
    require(not path.stat().st_mode & 0o077,'private_state_required')
    return json.loads(path.read_text())


def release_tree(directory):
    """Root-immutable files only. Never follow links or read the writable cache."""
    trusted(directory,directory=True)
    files=[]
    for parent,dirs,names in os.walk(directory,followlinks=False):
        parent=Path(parent)
        for name in list(dirs):
            p=parent/name
            if p.relative_to(directory).as_posix()=='.next/cache':
                dirs.remove(name);continue
            trusted(p,directory=True)
        for name in names:
            p=parent/name;trusted(p)
            if p.relative_to(directory).as_posix()=='review-ecosystem.json':continue
            with p.open('rb') as f: checksum=hashlib.file_digest(f,'sha256').hexdigest()
            files.append((p.relative_to(directory).as_posix(),checksum,bool(p.stat().st_mode & 0o111)))
    return digest(json.dumps(sorted(files),separators=(',',':')).encode())


def seal_record(record,seal=None):
    ident=identifier(record['id'])
    if seal is None:seal=private_json(ROOT/'state'/f'{ident}.seal.json')
    require(set(seal)=={'id','commit','checksum','tree'} and seal['id']==ident and seal['commit']==record['commit'] and seal['checksum']==record.get('checksum'),'release_seal_mismatch')
    require(all(isinstance(seal[k],str) and re.fullmatch('[a-f0-9]{64}',seal[k]) for k in ('checksum','tree')),'invalid_release_seal')
    require(release_tree(ROOT/'releases'/ident)==seal['tree'],'release_tree_changed')
    return seal


def daemon_identity():
    # runtime() independently verifies the unit sandbox, UID, RPC socket and cgroup.
    trusted(Path(NODE).resolve());trusted(Path(PM2).resolve())
    runtime(['ping'])
    pidfile=Path(HOME)/'.pm2/pm2.pid';metadata=pidfile.lstat()
    require(stat.S_ISREG(metadata.st_mode) and metadata.st_uid==pwd.getpwnam(USER).pw_uid and not metadata.st_mode&0o022,'invalid_pm2_pidfile')
    pid=int(pidfile.read_text().strip())
    p=PROC_ROOT/str(pid)
    require(p.stat().st_uid==pwd.getpwnam(USER).pw_uid and any(UNIT in line.split(':',2)[-1].split('/') for line in (p/'cgroup').read_text().splitlines()),'pm2_daemon_identity_mismatch')
    boot=(PROC_ROOT/'sys/kernel/random/boot_id').read_text().strip()
    require(re.fullmatch('[a-f0-9-]{36}',boot),'invalid_boot_identity')
    return {'pid':pid,'start':p.joinpath('stat').read_text().rsplit(') ',1)[1].split()[19],'uid':p.stat().st_uid,'boot_id':boot}


def pm2_inventory():
    rows=json.loads(runtime(['jlist']));require(isinstance(rows,list),'invalid_pm2_inventory')
    result={}
    for row in rows:
        env=row.get('pm2_env',{});name=row.get('name')
        require(isinstance(name,str) and name not in result,'ambiguous_pm2_inventory')
        result[name]={'pm_id':row.get('pm_id'),'pid':row.get('pid'),'cwd':env.get('pm_cwd'),
                      'script':env.get('pm_exec_path'),'interpreter':env.get('exec_interpreter'),
                      'status':env.get('status'),'restarts':env.get('restart_time')}
    return result  # Never print raw PM2 JSON (it can contain environments).


def app_name(record):return 'monetcore-review-'+identifier(record['id'])


def inventory_only(records,inventory):
    expected={app_name(r) for r in records if r is not None}
    require(set(inventory)<=expected,'foreign_or_resurrected_pm2_application')


def verify_record(record,inventory,health=True,capture=False,seal=None):
    ident=identifier(record['id'])
    require(isinstance(record.get('commit'),str) and re.fullmatch('[a-f0-9]{40}',record['commit']),'invalid_record_commit')
    port=record.get('port');require(type(port) is int and port in PORTS,'invalid_record_port')
    seal_record(record,seal)
    entry=inventory.get(app_name(record));require(entry is not None,'registered_application_missing')
    require(entry['cwd']==str(ROOT/'releases'/ident) and entry['script']==str(ROOT/'releases'/ident/'review-start.cjs') and entry['interpreter']==NODE,'pm2_release_binding_mismatch')
    require(type(entry['pm_id']) is int and entry['pm_id']>=0 and type(entry['restarts']) is int and entry['restarts']>=0,'invalid_pm2_identity')
    if entry['status']!='online':
        require(not health and entry['status'] in ('stopped','errored') and entry['pid']==0,'application_not_online')
        require(record.get('process') is None,'inactive_application_identity_requires_reconciliation')
        if capture:
            require(entry['restarts']==0,'candidate_restart_requires_reconciliation')
            record.update(pm_id=entry['pm_id'],restarts=entry['restarts'])
        require(record.get('pm_id')==entry['pm_id'] and record.get('restarts')==entry['restarts'],'inactive_pm2_identity_changed')
        port_unbound(port)
        return None
    if capture:require(entry['restarts']==0,'candidate_restart_requires_reconciliation')
    actual=process_at(port)
    require(actual['pid']==entry['pid'] and actual['uid']==pwd.getpwnam(USER).pw_uid and actual['cwd']==entry['cwd'],'release_process_mismatch')
    group=(PROC_ROOT/str(actual['pid'])/'cgroup').read_text()
    require(any(UNIT in line.split(':',2)[-1].split('/') for line in group.splitlines()),'release_cgroup_mismatch')
    if capture:
        record.update(process=actual,pm_id=entry['pm_id'],restarts=entry['restarts'])
    else:
        require(actual==record.get('process') and entry['pm_id']==record.get('pm_id') and entry['restarts']==record.get('restarts'),'release_process_restarted_or_changed')
    if health:direct_health(port,record['commit'])
    require(process_at(port)==actual,'process_changed_during_health')
    return actual


def history():
    result={}
    for p in (ROOT/'state').glob('*.json'):
        if re.fullmatch(ID_PATTERN+r'\.json',p.name):
            value=private_json(p);result[p.stem]=(value,digest(p.read_bytes()))
    return result


def unresolved(ack):
    for ident,(record,checksum) in history().items():
        if record.get('status') not in TERMINAL:
            require(ack.get(ident)==checksum,'critical_or_incomplete_history_requires_reconciliation')


def load_lifecycle(site):
    path=ROOT/'state/lifecycle.json'
    require(path.exists(),'lifecycle_v2_migration_required')
    index=private_json(path)
    require(index.get('version')==2 and index.get('status')=='ready' and index.get('pending') is None,'lifecycle_blocked_or_incomplete')
    require(index.get('current') and index.get('rollback'),'verified_current_and_rollback_required')
    require(index['current']['id']!=index['rollback']['id'],'duplicate_retained_release')
    unresolved(index.get('acknowledged',{}))
    require(daemon_identity()==index['daemon'],'pm2_daemon_changed_requires_reconciliation')
    require(digest(site.read_bytes())==index['routing_hash'] and vhost(site.read_text())[0]==index['current']['port'],'lifecycle_routing_mismatch')
    inventory=pm2_inventory();inventory_only([index['current'],index['rollback']],inventory)
    verify_record(index['current'],inventory);verify_record(index['rollback'],inventory)
    unit_process_snapshot([index['current'],index['rollback']])
    public_health(index['current']['commit'])
    return index


def memory_snapshot():
    output=command(['/usr/bin/systemctl','show',UNIT,'--property=ControlGroup','--property=ActiveState','--property=SubState'])
    props=dict(line.split('=',1) for line in output.splitlines() if '=' in line)
    require(props.get('ActiveState')=='active' and props.get('SubState')=='running','runtime_service_not_running')
    group=props.get('ControlGroup','')
    require(group.startswith('/') and UNIT in group.split('/') and all(p not in ('.','..') for p in group.split('/')),'invalid_service_cgroup')
    require((CGROUP_ROOT/'cgroup.controllers').is_file(),'cgroup_v2_required')
    leaf=CGROUP_ROOT/group.lstrip('/')
    require(leaf.resolve().is_relative_to(CGROUP_ROOT.resolve()),'cgroup_path_escape')
    rows=[]
    for p in [leaf,*leaf.parents]:
        if not p.is_relative_to(CGROUP_ROOT):break
        if p==CGROUP_ROOT and not (p/'memory.max').exists():break
        current=int((p/'memory.current').read_text().strip());raw=(p/'memory.max').read_text().strip()
        limit=None if raw=='max' else int(raw)
        events=dict((k,int(v)) for k,v in (line.split() for line in (p/'memory.events').read_text().splitlines()))
        high_raw=(p/'memory.high').read_text().strip() if (p/'memory.high').exists() else 'max'
        high=None if high_raw=='max' else int(high_raw)
        require(high is None or high>=0,'invalid_cgroup_high_limit')
        require(current>=0 and (limit is None or limit>0),'invalid_cgroup_memory')
        rows.append({'path':str(p),'inode':p.stat().st_ino,'current':current,'limit':limit,'high':high,'events':events})
        if p==CGROUP_ROOT:break
    require(any(r['limit'] is not None for r in rows),'finite_service_memory_limit_required')
    return rows


def memory_policy(policy):
    require(isinstance(policy,dict) and set(policy)=={'startup_bytes','reserve_bytes','basis'},'invalid_memory_policy')
    require(type(policy['startup_bytes']) is int and 512*1024**2<=policy['startup_bytes']<=64*1024**3,'invalid_candidate_memory_budget')
    require(type(policy['reserve_bytes']) is int and 128*1024**2<=policy['reserve_bytes']<=64*1024**3,'invalid_memory_reserve')
    require(isinstance(policy['basis'],str) and 10<=len(policy['basis'])<=500,'memory_budget_evidence_required')


def admit_memory(policy):
    memory_policy(policy)
    available=next((int(x.split()[1]) for x in Path('/proc/meminfo').read_text().splitlines() if x.startswith('MemAvailable:')),0)
    require(available>=768*1024,'insufficient_memory_headroom')
    rows=memory_snapshot();required=policy['startup_bytes']+policy['reserve_bytes']
    require(all(limit-r['current']>=required for r in rows for limit in (r['limit'],r['high']) if limit is not None),'insufficient_cgroup_memory_headroom')
    return rows


def memory_checkpoint(before,policy):
    after=memory_snapshot()
    require([(r['path'],r['inode'],r['limit'],r['high']) for r in after]==[(r['path'],r['inode'],r['limit'],r['high']) for r in before],'cgroup_changed_during_transaction')
    for a,b in zip(after,before):
        require(all(a['events'].get(k,0)==b['events'].get(k,0) for k in ('high','max','oom','oom_kill','oom_group_kill')),'cgroup_pressure_or_oom_during_transaction')
        require(all(limit-a['current']>=policy['reserve_bytes'] for limit in (a['limit'],a['high']) if limit is not None),'cgroup_reserve_exhausted')
    return after


def journal(index,transaction,phase):
    transaction['status']=phase
    save(ROOT/'state'/f"{transaction['id']}.json",transaction)
    index['status']='transaction';index['pending']=transaction
    save(ROOT/'state/lifecycle.json',index)


def block_lifecycle(index,transaction,category):
    transaction['failure_category']=category
    journal(index,transaction,'blocked')
    index['status']='blocked';save(ROOT/'state/lifecycle.json',index)


def complete_lifecycle(index,transaction,current,rollback,site,phase='committed'):
    expected=transaction.get('before_hash') if phase=='rolled-back' else transaction.get('after_hash',transaction.get('approved_plan',{}).get('nginx_hash'))
    require(digest(site.read_bytes())==expected and vhost(site.read_text())[0]==current['port'],'final_lifecycle_routing_mismatch')
    public_health(current['commit'])
    transaction['status']=phase;save(ROOT/'state'/f"{transaction['id']}.json",transaction)
    index.update(current=current,rollback=rollback,pending=None,status='ready',routing_hash=digest(site.read_bytes()))
    save(ROOT/'state/lifecycle.json',index)


def port_unbound(port):
    rows=command(['/usr/bin/ss','-ltnpH']).splitlines()
    require(not any(len(r.split())>3 and r.split()[3].rsplit(':',1)[-1]==str(port) for r in rows),'retired_or_pending_listener_still_present')


def retirement_guard(site,expected_hash,other_hash,protected):
    def check():
        require(digest(site.read_bytes())==expected_hash and nginx_snapshot(site)==other_hash,'configuration_changed_at_retirement')
        require(vhost(site.read_text())[0]==protected[0]['port'],'retirement_current_routing_mismatch')
    return check


def unit_process_snapshot(records):
    """Inspect only PIDs in the dedicated service; never traverse foreign parents."""
    leaf=Path(memory_snapshot()[0]['path'])
    pids={int(value) for value in (leaf/'cgroup.procs').read_text().split()}
    daemon=daemon_identity();roots={daemon['pid']:'daemon'}
    roots.update({r['process']['pid']:r['id'] for r in records if r.get('process')})
    require(set(roots)<=pids,'registered_process_missing_from_unit')
    graph={}
    for pid in pids:
        proc=PROC_ROOT/str(pid)
        require(proc.stat().st_uid==pwd.getpwnam(USER).pw_uid,'foreign_uid_in_review_unit')
        fields=(proc/'stat').read_text().rsplit(') ',1)[1].split()
        graph[pid]={'start':fields[19],'parent':int(fields[1])}
    for pid in pids:
        cursor=pid;seen=set()
        while cursor not in roots:
            require(cursor in graph and cursor not in seen,'unregistered_or_orphan_review_process')
            seen.add(cursor);cursor=graph[cursor]['parent']
        require(cursor!=daemon['pid'] or pid==daemon['pid'],'unregistered_daemon_child')
        graph[pid]['release']=roots[cursor]
    return graph


def retire_record(record,allowed,guard,protected):
    require(all(record['id']!=r['id'] and record['port']!=r['port'] for r in protected),'retained_release_cannot_be_retired')
    inventory=pm2_inventory();inventory_only(allowed,inventory)
    verify_record(record,inventory,health=False)
    # Recheck at the destructive boundary. Never delete by prefix/age/port.
    require(pm2_inventory().get(app_name(record))==inventory[app_name(record)],'pm2_identity_changed_before_retirement')
    graph=unit_process_snapshot(allowed)
    guard()
    runtime(['delete',str(record['pm_id'])])
    guard()
    require(app_name(record) not in pm2_inventory(),'retirement_unconfirmed')
    for pid,observed in graph.items():
        if observed['release']!=record['id']:continue
        proc=PROC_ROOT/str(pid)
        try:start=(proc/'stat').read_text().rsplit(') ',1)[1].split()[19]
        except FileNotFoundError:start=None
        require(start!=observed['start'],'retired_process_or_worker_still_running')
    port_unbound(record['port'])


def persist_pair(current,rollback):
    inventory=pm2_inventory();inventory_only([current,rollback],inventory)
    verify_record(current,inventory);verify_record(rollback,inventory)
    unit_process_snapshot([current,rollback])
    runtime(['save','--force'])
    require(pm2_inventory()==inventory,'pm2_changed_during_persistence')
    unit_process_snapshot([current,rollback])
    dump=Path(HOME)/'.pm2/dump.pm2';info=dump.lstat()
    require(stat.S_ISREG(info.st_mode) and info.st_uid==pwd.getpwnam(USER).pw_uid and info.st_size<=1024*1024,'invalid_saved_pm2_dump')
    saved=json.loads(dump.read_text());require(isinstance(saved,list) and len(saved)==2,'unbounded_saved_pm2_dump')
    expected={app_name(r):str(ROOT/'releases'/r['id']) for r in (current,rollback)}
    require({row.get('name') for row in saved}==set(expected),'saved_pm2_pair_mismatch')
    for row in saved:
        require(row.get('pm_cwd')==expected[row['name']] and row.get('pm_exec_path')==expected[row['name']]+'/review-start.cjs' and row.get('exec_interpreter')==NODE,'saved_pm2_binding_mismatch')


def prepare_transaction(index,site,candidate,kind):
    text=site.read_text();snap=nginx_snapshot(site,inventory=True)
    transaction={'id':candidate['id'] if kind=='deploy' else datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ-')+uuid.uuid4().hex[:8],
                 'version':2,'kind':kind,'candidate':candidate,'prior_current':index['current'],'prior_rollback':index['rollback'],
                 'before_hash':digest(text.encode()),'after_hash':digest(rewrite(text,candidate['port']).encode()),
                 'previous_port':index['current']['port'],'previous_process':index['current']['process'],
                 'port':candidate['port'],'commit':candidate['commit'],'other_hash':snap['sha256'],
                 'other_files':snap['files'],'other_directories':snap['directories']}
    require(not (ROOT/'state'/f"{transaction['id']}.json").exists() and not (ROOT/'state'/f"{transaction['id']}.nginx").exists(),'transaction_identity_exists')
    if kind=='deploy':require(not (ROOT/'releases'/candidate['id']).exists() and not (ROOT/'state'/f"{candidate['id']}.seal.json").exists(),'release_identity_exists')
    journal(index,transaction,'intent')
    backup=ROOT/'state'/f"{transaction['id']}.nginx"
    require(not backup.exists(),'transaction_backup_exists')
    with backup.open('xb') as f:f.write(text.encode());f.flush();os.fsync(f.fileno())
    backup.chmod(0o600)
    return transaction


def recover_pair(index,transaction,site):
    require(daemon_identity()==index['daemon'],'pm2_daemon_changed_during_recovery')
    # Existing strict PID/start/config/backup checks are preserved, not bypassed.
    recover(transaction,site)
    inventory=pm2_inventory()
    verify_record(transaction['prior_current'],inventory)
    verify_record(transaction['prior_rollback'],inventory)
    public_health(transaction['prior_current']['commit'])


def finish_switch(index,transaction,site,obsolete=None):
    require(daemon_identity()==index['daemon'],'pm2_daemon_changed_during_retirement')
    candidate=transaction['candidate'];current=transaction['prior_current']
    inventory=pm2_inventory();inventory_only([candidate,current,transaction['prior_rollback']],inventory)
    verify_record(candidate,inventory);verify_record(current,inventory)
    require(digest(site.read_bytes())==transaction['after_hash'] and vhost(site.read_text())[0]==candidate['port'],'post_switch_routing_mismatch')
    public_health(candidate['commit'])
    transaction['retirement_started']=obsolete is not None
    journal(index,transaction,'retiring')
    if obsolete is not None:retire_record(obsolete,[candidate,current,obsolete],retirement_guard(site,transaction['after_hash'],transaction['other_hash'],[candidate,current]),[candidate,current])
    require(daemon_identity()==index['daemon'],'pm2_daemon_changed_during_persistence')
    persist_pair(candidate,current)
    complete_lifecycle(index,transaction,candidate,current,site)


def restore_failed_candidate(index,transaction,site,switched):
    if switched:recover_pair(index,transaction,site)
    else:
        require(digest(site.read_bytes())==transaction['before_hash'],'routing_changed_during_start_failure')
        inventory=pm2_inventory();verify_record(transaction['prior_current'],inventory);verify_record(transaction['prior_rollback'],inventory)
        public_health(transaction['prior_current']['commit'])
    candidate=transaction['candidate'];inventory=pm2_inventory()
    inventory_only([candidate,transaction['prior_current'],transaction['prior_rollback']],inventory)
    entry=inventory.get(app_name(candidate))
    if entry and transaction['kind']=='deploy':
        # If start acceptance was uncertain, bind the *new* admitted entry once.
        # A previously captured/restarted identity can only be reconciled by admin.
        verify_record(candidate,inventory,health=False,capture=candidate.get('process') is None)
        journal(index,transaction,'cleaning_failed_candidate')
        pair=[transaction['prior_current'],transaction['prior_rollback']]
        retire_record(candidate,[candidate,*pair],retirement_guard(site,transaction['before_hash'],transaction['other_hash'],pair),pair)
    if transaction['kind']=='deploy':port_unbound(candidate['port'])
    persist_pair(transaction['prior_current'],transaction['prior_rollback'])
    complete_lifecycle(index,transaction,transaction['prior_current'],transaction['prior_rollback'],site,'rolled-back')


def verify_history_for_reconciliation(plan):
    entries=history()
    require(plan['acknowledge']=={k:v[1] for k,v in entries.items()},'all_history_must_be_explicitly_acknowledged')
    pending=[]
    for ident,(record,_) in entries.items():
        if record.get('kind')=='administrator-reconciliation':
            if record.get('status') not in TERMINAL:
                pending.append((ident,{record.get('approved_plan',{}).get('nginx_hash')}))
            continue
        if 'before_hash' in record:
            backup=ROOT/'state'/f'{ident}.nginx'
            require(backup.exists(),'preserved_nginx_backup_missing')
            require(digest(private_read(backup))==record['before_hash'],'preserved_nginx_backup_changed')
        if record.get('status') not in TERMINAL:
            require(all(isinstance(record.get(k),str) and re.fullmatch('[a-f0-9]{64}',record[k]) for k in ('before_hash','after_hash')),'incomplete_history_requires_forensic_review')
            pending.append((ident,{record['before_hash'],record['after_hash']}))
    if pending:
        require(plan['nginx_hash'] in max(pending,key=lambda x:x[0])[1],'critical_routing_not_reconciled_to_preserved_hash')


def migration_seal(record):
    """Require the original approved Actions artifact for legacy adoption."""
    packed=ROOT/'incoming'/f"{identifier(record['id'])}.migration.tar.gz"
    trusted(packed)
    with packed.open('rb') as f:require(hashlib.file_digest(f,'sha256').hexdigest()==record['checksum'],'migration_artifact_checksum_mismatch')
    require(packed.stat().st_size<=MAX_UPLOAD,'migration_artifact_too_large')
    with tempfile.TemporaryDirectory(dir=ROOT/'incoming') as tmp:
        raw=Path(tmp)/'artifact.tar';size=0
        with gzip.open(packed,'rb') as src,raw.open('xb') as dst:
            while block:=src.read(1024*1024):
                size+=len(block);require(size<=MAX_EXPANDED+32*1024*1024,'decompressed_archive_too_large');dst.write(block)
        validate_tar_headers(raw);files=[];manifest=None
        with tarfile.open(raw,'r:') as archive:
            for member,name in archive_members(archive):
                if not member.isreg() or name.startswith('.next/cache/') or name=='review-ecosystem.json':continue
                with archive.extractfile(member) as src:
                    if name=='release.json':
                        require(member.size<=8192,'oversized_release_manifest');value=src.read();manifest=json.loads(value);checksum=digest(value)
                    else:checksum=hashlib.file_digest(src,'sha256').hexdigest()
                files.append((name,checksum,bool(member.mode & 0o111)))
        require(manifest and manifest.get('commit')==record['commit'] and manifest.get('platform')=='linux' and manifest.get('arch')=='x64','migration_manifest_mismatch')
    build=tuple(map(int,manifest['node'].split('.')))
    current=tuple(map(int,command([NODE,'--version']).strip().lstrip('v').split('.')))
    require(build[0]==24 and current[0]==24 and current>=build,'node_runtime_incompatible')
    require(tuple(map(int,manifest['glibc'].split('.')))<=tuple(map(int,os.confstr('CS_GNU_LIBC_VERSION').split()[1].split('.'))),'libc_incompatible')
    return {'id':record['id'],'commit':record['commit'],'checksum':record['checksum'],
            'tree':digest(json.dumps(sorted(files),separators=(',',':')).encode())}


def admin_only():
    require(os.geteuid()==0 and os.environ.get('SUDO_USER')!=DEPLOY_USER,'administrator_console_required')


def reconciliation(checksum,cfg,site,apply=False):
    admin_only();path=ROOT/'state/lifecycle-reconcile.json';raw_plan=private_read(path)
    require(digest(raw_plan)==checksum,'reconciliation_plan_changed')
    plan=json.loads(raw_plan)
    require(set(plan)=={'version','index_hash','nginx_hash','other_nginx_sha256','daemon','current_id','rollback_id','records','acknowledge','memory_policy','reason'},'invalid_reconciliation_plan')
    require(plan['version']==2 and isinstance(plan['reason'],str) and 20<=len(plan['reason'])<=1000,'explicit_reconciliation_reason_required')
    index_path=ROOT/'state/lifecycle.json'
    require((digest(private_read(index_path)) if index_path.exists() else None)==plan['index_hash'],'lifecycle_changed_since_review')
    require(digest(site.read_bytes())==plan['nginx_hash'],'review_config_changed_since_review')
    require(nginx_snapshot(site)==plan['other_nginx_sha256']==cfg['other_nginx_sha256'],'unrelated_nginx_change_stop')
    require(daemon_identity()==plan['daemon'],'pm2_daemon_changed_since_review')
    memory_policy(plan['memory_policy'])
    verify_history_for_reconciliation(plan)
    records=plan['records'];require(isinstance(records,list) and 2<=len(records)<=12,'invalid_reconciliation_records')
    require(len({r['id'] for r in records})==len(records) and len({r['port'] for r in records})==len(records),'duplicate_reconciliation_identity')
    byid={r['id']:r for r in records}
    require(plan['current_id']!=plan['rollback_id'] and plan['current_id'] in byid and plan['rollback_id'] in byid,'invalid_retained_pair')
    current=byid[plan['current_id']];rollback=byid[plan['rollback_id']]
    require(vhost(site.read_text())[0]==current['port'],'reconciliation_current_not_routed')
    inventory=pm2_inventory();inventory_only(records,inventory)
    require(set(inventory)=={app_name(r) for r in records},'reconciliation_inventory_incomplete')
    seals={}
    for record in records:
        seal_path=ROOT/'state'/f"{identifier(record['id'])}.seal.json"
        seals[record['id']]=private_json(seal_path) if seal_path.exists() else migration_seal(record)
        verify_record(record,inventory,health=record['id'] in (current['id'],rollback['id']),seal=seals[record['id']])
    public_health(current['commit'])
    unit_process_snapshot(records)
    if not apply:return {'status':'reconciliation_checks_passed','retire_count':len(records)-2,'changes_made':False}
    # Persist the approved plan and blocked intent before any process retirement.
    ident=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ-')+uuid.uuid4().hex[:8]
    tx={'id':ident,'version':2,'kind':'administrator-reconciliation','status':'reconciling','plan_hash':checksum,'approved_plan':plan}
    require(not (ROOT/'state'/f'{ident}.json').exists(),'transaction_identity_exists')
    save(ROOT/'state'/f'{ident}.json',tx)
    index={'version':2,'status':'blocked','current':current,'rollback':rollback,'pending':tx,'daemon':plan['daemon'],
           'routing_hash':plan['nginx_hash'],'memory_policy':plan['memory_policy'],'acknowledged':plan['acknowledge']}
    for record in records:save(ROOT/'state'/f"{record['id']}.seal.json",seals[record['id']])
    save(index_path,index)
    try:
        remaining=list(records)
        for record in records:
            if record['id'] in (current['id'],rollback['id']):continue
            require(digest(site.read_bytes())==plan['nginx_hash'] and nginx_snapshot(site)==plan['other_nginx_sha256'],'reconciliation_configuration_changed')
            verify_record(current,pm2_inventory());verify_record(rollback,pm2_inventory());public_health(current['commit'])
            pair=[current,rollback]
            retire_record(record,remaining,retirement_guard(site,plan['nginx_hash'],plan['other_nginx_sha256'],pair),pair);remaining.remove(record)
            tx['retired_ids']=[r['id'] for r in records if r not in remaining];save(ROOT/'state'/f'{ident}.json',tx)
        persist_pair(current,rollback)
        complete_lifecycle(index,tx,current,rollback,site)
        return {'status':'reconciled','current':current['id'],'rollback':rollback['id'],'retired_count':len(records)-2}
    except BaseException:
        block_lifecycle(index,tx,'administrator_reconciliation_incomplete');raise Stop('reconciliation_blocked') from None


def private_read(path):
    trusted(path);require(not path.stat().st_mode & 0o077,'private_state_required')
    return path.read_bytes()


def lifecycle_inventory(site):
    admin_only();daemon=daemon_identity();rows=pm2_inventory();records=[]
    for name,row in rows.items():
        ident=name.removeprefix('monetcore-review-')
        require(name=='monetcore-review-'+identifier(ident),'foreign_application_requires_manual_inventory')
        directory=ROOT/'releases'/ident;trusted(directory,directory=True)
        manifest=json.loads((trusted(directory/'release.json')).read_text())
        ecosystem=json.loads((trusted(directory/'review-ecosystem.json')).read_text())
        apps=ecosystem.get('apps',[]);require(len(apps)==1 and apps[0].get('name')==name,'invalid_legacy_ecosystem')
        port=int(apps[0]['env']['PORT']);require(port in PORTS,'unmanaged_legacy_port')
        record={'id':ident,'commit':manifest['commit'],'port':port,'process':process_at(port) if row['status']=='online' else None,
                'pm_id':row['pm_id'],'restarts':row['restarts']}
        # Output only reviewed public metadata, never PM2 environments.
        require(record['process'] is None or (record['process']['uid']==pwd.getpwnam(USER).pw_uid and record['process']['cwd']==str(directory)),'inventory_process_mismatch')
        records.append(record)
    path=ROOT/'state/lifecycle.json'
    return {'daemon':daemon,'nginx_hash':digest(site.read_bytes()),'review_port':vhost(site.read_text())[0],
            'other_nginx_sha256':nginx_snapshot(site),'index_hash':digest(private_read(path)) if path.exists() else None,
            'records':records,'acknowledge':{k:v[1] for k,v in history().items()},'memory':memory_snapshot()}

def deploy(stream, sha, checksum, cfg, site):
    index=load_lifecycle(site)
    require(nginx_snapshot(site)==cfg['other_nginx_sha256'],'unrelated_nginx_change_stop')
    before_memory=admit_memory(index['memory_policy'])
    require(shutil.disk_usage(ROOT).free>=2*MAX_EXPANDED+MAX_UPLOAD,'insufficient_disk_headroom')
    require(len(list((ROOT/'releases').iterdir()))<12,'release_retention_limit')
    trusted(Path(NODE).resolve());trusted(Path(PM2).resolve())
    port=None
    for candidate_port in PORTS:
        if candidate_port in (index['current']['port'],index['rollback']['port']):continue
        try:
            with socket.socket() as probe:probe.bind(('127.0.0.1',candidate_port))
            port=candidate_port;break
        except OSError:pass
    require(port is not None,'no_free_review_port')
    ident=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ-')+uuid.uuid4().hex[:8]
    candidate={'id':ident,'commit':sha,'checksum':checksum,'port':port,'process':None,'pm_id':None,'restarts':None}
    tx=prepare_transaction(index,site,candidate,'deploy')
    tx['memory_admission']=before_memory;tx['memory_policy']=index['memory_policy'];journal(index,tx,'intent')
    progress('preflight_passed')
    switched=False
    try:
        release=ROOT/'releases'/ident
        unpack(stream,sha,checksum,release)
        save(ROOT/'state'/f'{ident}.seal.json',{'id':ident,'commit':sha,'checksum':checksum,'tree':release_tree(release)})
        progress('artifact_verified')
        admit_memory(index['memory_policy']);tx['last_memory']=memory_checkpoint(before_memory,index['memory_policy'])
        ecosystem={'apps':[{'name':app_name(candidate),'script':str(release/'review-start.cjs'),'cwd':str(release),'interpreter':NODE,'instances':1,'exec_mode':'fork','max_memory_restart':'512M','restart_delay':3000,'env':{'PORT':str(port)}}]}
        path=release/'review-ecosystem.json'
        with path.open('x') as f:json.dump(ecosystem,f);f.flush();os.fsync(f.fileno())
        path.chmod(0o644)
        journal(index,tx,'starting')
        runtime(['start',str(path),'--only',app_name(candidate)])
        progress('candidate_started')
        for attempt in range(30):
            try:direct_health(port,sha);break
            except (Stop,ValueError):
                require(attempt<29,'candidate_health_failed');time.sleep(1)
        inventory=pm2_inventory();inventory_only([candidate,index['current'],index['rollback']],inventory)
        verify_record(candidate,inventory,capture=True)
        journal(index,tx,'candidate_verified')
        # A second stable pass catches early restarts; it cannot guarantee future uptime.
        time.sleep(2);verify_record(candidate,pm2_inventory())
        tx['last_memory']=memory_checkpoint(before_memory,index['memory_policy'])
        require(daemon_identity()==index['daemon'],'pm2_daemon_changed_during_transaction')
        verify_record(index['current'],pm2_inventory());verify_record(index['rollback'],pm2_inventory())
        require(digest(site.read_bytes())==tx['before_hash'] and nginx_snapshot(site)==tx['other_hash'],'configuration_changed_before_switch')
        journal(index,tx,'switching');switched=True
        write_site(site,rewrite(site.read_text(),port))
        command([NGINX,'-t']);command(['/usr/bin/systemctl','reload','nginx'])
        tx['last_memory']=memory_checkpoint(before_memory,index['memory_policy'])
        finish_switch(index,tx,site,obsolete=tx['prior_rollback'])
        progress('post_switch_health_passed')
        return {'status':'active','release':ident,'commit':sha,'previous_port':tx['previous_port'],'port':port,'lifecycle_version':2}
    except BaseException as error:
        category=str(error) if isinstance(error,Stop) and re.fullmatch('[a-zA-Z0-9_-]{1,100}',str(error)) else 'controller_error'
        tx['failure_category']=category
        if tx.get('retirement_started') or tx['status']=='retiring':
            block_lifecycle(index,tx,'retirement_or_persistence_unconfirmed')
            raise Stop('lifecycle_retirement_blocked') from None
        try:restore_failed_candidate(index,tx,site,switched)
        except BaseException:
            block_lifecycle(index,tx,'rollback_or_cleanup_unconfirmed')
            raise Stop('CRITICAL_rollback_or_cleanup_unconfirmed') from None
        if category.startswith(('cgroup_','pm2_daemon_')):
            block_lifecycle(index,tx,category)
            raise Stop('resource_or_daemon_reconciliation_required') from None
        raise Stop('deployment_failed_rollback_verified') from None


def rollback_v2(release_id,cfg,site):
    index=load_lifecycle(site)
    require(index['current']['id']==release_id,'release_not_current')
    require(nginx_snapshot(site)==cfg['other_nginx_sha256'],'unrelated_nginx_change_stop')
    tx=prepare_transaction(index,site,index['rollback'],'rollback')
    try:
        journal(index,tx,'switching')
        require(nginx_snapshot(site)==tx['other_hash'] and digest(site.read_bytes())==tx['before_hash'],'configuration_changed_before_switch')
        verify_record(index['current'],pm2_inventory());verify_record(index['rollback'],pm2_inventory())
        write_site(site,rewrite(site.read_text(),index['rollback']['port']))
        command([NGINX,'-t']);command(['/usr/bin/systemctl','reload','nginx'])
        finish_switch(index,tx,site)
        return {'status':'rolled-back','release':release_id,'previous_port':tx['candidate']['port'],'lifecycle_version':2}
    except BaseException:
        try:recover_pair(index,tx,site);persist_pair(tx['prior_current'],tx['prior_rollback']);complete_lifecycle(index,tx,tx['prior_current'],tx['prior_rollback'],site,'rolled-back')
        except BaseException:
            block_lifecycle(index,tx,'manual_rollback_unconfirmed');raise Stop('CRITICAL_rollback_unconfirmed') from None
        raise Stop('rollback_failed_original_pair_restored') from None


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
    if args==['inventory']:
        print(json.dumps(lifecycle_inventory(site)));return
    if len(args)==2 and args[0] in ('reconcile-check','reconcile-apply') and re.fullmatch('[a-f0-9]{64}',args[1]):
        admin_only()
        with deployment_lock():print(json.dumps(reconciliation(args[1],cfg,site,apply=args[0]=='reconcile-apply')))
        return
    require((len(args)==3 and args[0]=='deploy' and re.fullmatch('[a-f0-9]{40}',args[1]) and re.fullmatch('[a-f0-9]{64}',args[2])) or (len(args)==2 and args[0]=='rollback' and re.fullmatch('[0-9]{8}T[0-9]{6}Z-[a-f0-9]{8}',args[1])),'invalid_protocol')
    for sig in (signal.SIGTERM,signal.SIGINT,signal.SIGHUP,signal.SIGALRM): signal.signal(sig,lambda *_: (_ for _ in ()).throw(Stop('interrupted')))
    signal.alarm(600)
    deployment_identity(os.environ)
    with deployment_lock():
        if args[0]=='deploy': result=deploy(sys.stdin.buffer,args[1],args[2],cfg,site)
        else: result=rollback_v2(args[1],cfg,site)
        print(json.dumps(result))

if __name__=='__main__':
    try: main()
    except BaseException as error:
        print(json.dumps({'status':'failed','category':str(error) if isinstance(error,Stop) else 'controller_error'}),file=sys.stderr)
        sys.exit(1)
