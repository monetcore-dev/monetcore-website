#!/usr/bin/env python3
"""Pinned private visual review only. No database, DNS, Vercel or integration activation."""
from __future__ import annotations
import argparse
import base64
import dataclasses
import getpass
import hashlib
import http.client
import json
import os
from pathlib import Path
import re
import shutil
import socket
import ssl
import stat
import subprocess
import sys
import time
import uuid

SOURCE_COMMIT = "a1ca9ad6286e9c05b2271f7365acd3e753b33fb4"
REPOSITORY = "https://github.com/monetcore-dev/monetcore-website.git"
SOURCE_BRANCH = "feature/monetcore-2-customer-foundation"
HOST = "review.monetcore.dev"
MARKER = "/__monetcore_review_release.json"
PAGES = ("/", "/services", "/products", "/about", "/contact", "/book", "/website-packages", "/privacy", "/demo/fintech")
PAGES += tuple("/services/" + slug for slug in ("ai-automation", "software-development", "website-development", "business-integrations", "mobile-app-development", "digital-marketing", "technology-consulting"))
PAGES += tuple("/products/" + slug for slug in ("ai-lead-automation", "smart-booking", "ai-receptionist", "crm", "business-automation", "ai-marketing-manager"))
OFF = ("STAGING_BOOKING_ENABLED", "STAGING_CONTACT_ENABLED", "CUSTOMER_PLATFORM_ENABLED", "CUSTOMER_REGISTRATION_ENABLED", "CUSTOMER_AUTH_EMAIL_ENABLED", "AI_ASSISTANT_ENABLED", "AI_OWNER_TEST_ENABLED", "STAGING_AI_ASSISTANT_ENABLED")

class Stop(RuntimeError):
    pass

def require(condition, category):
    if not condition:
        raise Stop(category)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def private_dir(path):
    path = Path(path)
    require(path.is_absolute() and not path.is_symlink(), "Use an absolute, non-symlink private directory")
    path.mkdir(mode=0o700, parents=True, exist_ok=True)
    info = path.stat()
    require(info.st_uid == os.geteuid() and not info.st_mode & 0o077, "Private directory must be owned by this account and mode 0700")
    return path.resolve()

def safe_environment():
    # Never carry application secrets or NODE_OPTIONS into npm, PM2 or Next.
    names = ("PATH", "HOME", "TMPDIR", "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "no_proxy", "NODE_EXTRA_CA_CERTS", "SSL_CERT_FILE", "SSL_CERT_DIR", "GIT_SSL_CAINFO")
    return {name: os.environ[name] for name in names if name in os.environ}

def available_memory_kib():
    return next((int(line.split()[1]) for line in Path("/proc/meminfo").read_text().splitlines() if line.startswith("MemAvailable:")), 0)

def runtime_environment():
    env = {}
    env.update(NODE_ENV="production", MONETCORE_STAGING="true", MONETCORE_VPS_REVIEW="true", AI_ASSISTANT_EMERGENCY_STOP="true")
    env.update({name: "false" for name in OFF})
    # No proxy attestation, integration credentials or customer database connection.
    return env

@dataclasses.dataclass
class Config:
    release_root: Path
    state_root: Path
    pm2_home: Path
    nginx_site: Path
    previous_process_name: str | None
    candidate_port: int | None

    @classmethod
    def load(cls, filename):
        raw = json.loads(Path(filename).read_text())
        require(set(raw) == {field.name for field in dataclasses.fields(cls)}, "Unexpected/missing configuration keys")
        for name in ("release_root", "state_root", "pm2_home", "nginx_site"):
            require(isinstance(raw[name], str) and Path(raw[name]).is_absolute(), "Configure absolute paths first")
            raw[name] = Path(raw[name])
        site = raw["nginx_site"]
        require(site.parent in (Path("/etc/nginx/sites-available"), Path("/etc/nginx/conf.d")) and site.name != "nginx.conf", "Only a dedicated review vhost file is supported")
        name = raw["previous_process_name"]
        require(name is None or re.fullmatch(r"[A-Za-z0-9_.-]{1,80}", name), "Invalid previous PM2 process name")
        port = raw["candidate_port"]
        require(port is None or type(port) is int and 1024 <= port <= 65535, "Choose an unprivileged candidate port")
        return cls(**raw)

class Commands:
    def run(self, args, cwd=None, env=None, timeout=60):
        try:
            done = subprocess.run([str(x) for x in args], cwd=cwd, env=env or safe_environment(), capture_output=True, text=True, timeout=timeout, check=False)
        except (OSError, subprocess.TimeoutExpired):
            raise Stop("Command unavailable or timed out: " + Path(str(args[0])).name) from None
        # Only sanitized-environment build/test output may be kept privately.
        # Never persist PM2 state, nginx -T output or subprocess environment values.
        build_log = None
        if cwd and (str(args[0]) == "npm" or list(map(str,args))[:2] == ["node", "scripts/vps/check-release.mjs"]):
            build_log = Path(cwd) / ".private-review-build.log"
            fd = os.open(build_log, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
            with os.fdopen(fd,"w") as log:
                log.write("\nBuild step: " + Path(str(args[0])).name + "\n" + done.stdout + done.stderr)
        require(done.returncode == 0, "Command failed: " + Path(str(args[0])).name + ("; inspect private .private-review-build.log" if build_log else ""))
        return done.stdout

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

def review_vhost(text, include_reader=lambda filename: Path(filename).read_text()):
    servers = parse_nginx(text)
    require(len(servers) == 1 and servers[0].words == ["server"] and servers[0].children is not None, "Dedicated file must contain exactly one HTTPS review server; split/complex vhosts need manual review")
    server = servers[0].children
    require(single(server, "server_name").words == ["server_name", HOST], "This is not the exact review-only vhost")
    listeners = [node.words[1:] for node in server if node.words[0] == "listen"]
    require(listeners and all(args[0] in ("443", "127.0.0.1:443", "[::]:443") and "ssl" in args and set(args[1:]) <= {"ssl", "http2"} for args in listeners), "Only the existing HTTPS443 listeners are supported")
    locations = [node for node in server if node.words[0] == "location"]
    require(len(locations) == 1 and locations[0].words == ["location", "/"] and locations[0].children is not None, "Only one protected proxy location is supported")
    location = locations[0].children
    forbidden = {"satisfy", "auth_request", "return", "rewrite", "error_page", "if", "try_files", "alias", "root"}
    for node in server + location:
        require(node.words[0] not in forbidden, "Review routing/auth needs manual inspection")
        require(node.children is None or node is locations[0], "Nested nginx blocks need manual review")
        if node.words[0] == "auth_basic":
            require(len(node.words) == 2 and node.words[1] != "off", "Basic authentication cannot be disabled")
        if node.words[0] == "include":
            require(node in server and len(node.words) == 2 and "*" not in node.words[1] and Path(node.words[1]).is_absolute(), "Only explicit TLS-only includes are supported")
            included = parse_nginx(include_reader(node.words[1]))
            require(included and all(x.children is None and x.words[0].startswith("ssl_") for x in included), "Include is not TLS-only")
    auth = [node for node in location if node.words[0] == "auth_basic"] or [node for node in server if node.words[0] == "auth_basic"]
    auth_file = [node for node in location if node.words[0] == "auth_basic_user_file"] or [node for node in server if node.words[0] == "auth_basic_user_file"]
    require(len(auth) == 1 and len(auth_file) == 1 and len(auth_file[0].words) == 2 and Path(auth_file[0].words[1]).is_absolute(), "Explicit Basic Authentication and password-file path are required")
    # Never open the password file or certificate private key.
    require(single(server, "ssl_certificate").words[1:] and single(server, "ssl_certificate_key").words[1:], "Existing TLS certificate directives are required")
    headers = [node.words[1:] for node in location if node.words[0] == "proxy_set_header"]
    for name, value in (("Host", "$host"), ("X-Forwarded-Host", "$host"), ("X-Forwarded-Proto", "$scheme"), ("X-Forwarded-For", "$remote_addr")):
        require([args for args in headers if args and args[0].lower() == name.lower()] == [[name, value]], "Proxy headers must be explicitly overwritten in the review location")
    upstream = single(location, "proxy_pass")
    require(len(upstream.words) == 2, "Invalid review upstream")
    match = re.fullmatch(r"http://127\.0\.0\.1:([0-9]{4,5})", upstream.words[1])
    require(match and 1024 <= int(match[1]) <= 65535, "Review upstream must use a literal loopback unprivileged port")
    return int(match[1]), upstream

def updated_vhost(text, port):
    require(type(port) is int and 1024 <= port <= 65535, "Invalid candidate port")
    old, directive = review_vhost(text)
    require(old != port, "Candidate and rollback ports must differ")
    return text[:directive.start] + f"proxy_pass http://127.0.0.1:{port};" + text[directive.end:]

def other_nginx_digest(output, target):
    # Hash effective non-review configuration, never store or print its contents.
    sections = re.split(r"(?m)^# configuration file ([^\n]+):\n", output)
    pieces = [sections[0]]
    for index in range(1,len(sections),2):
        filename,content=sections[index],sections[index+1]
        if Path(filename).resolve()!=target: pieces.extend((filename,content))
    return digest("\0".join(pieces).encode())

class LoopbackTLS(http.client.HTTPSConnection):
    def connect(self):
        raw = socket.create_connection(("127.0.0.1", 443), timeout=self.timeout)
        self.sock = ssl.create_default_context().wrap_socket(raw, server_hostname=HOST)

def http_get(path, port=None, credential=None, method="GET", body=None):
    require(path.startswith("/") and not path.startswith("//"), "Invalid health path")
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=8) if port else LoopbackTLS(HOST, timeout=8)
    headers = {"Host": HOST, "Connection": "close"}
    if credential:
        headers["Authorization"] = credential
    if body is not None:
        headers["Content-Type"] = "application/json"
    try:
        connection.request(method, path, body=body, headers=headers)
        response = connection.getresponse()
        data = response.read(2_000_001)
        require(len(data) <= 2_000_000, "Health response is too large")
        return response.status, dict((key.lower(), value) for key, value in response.getheaders()), data
    finally:
        connection.close()

# These probes use empty invalid bodies only, and only after our own no-secret,
# flags-off process has passed its release marker check. They never send an enquiry.
def verify_release(fetch, port=None, credential=None, expected_marker=None):
    status, _, body = fetch(MARKER, port=port, credential=credential)
    marker = json.loads(body)
    require(status == 200 and isinstance(marker,dict) and marker.get("commit") == SOURCE_COMMIT and marker.get("mode") == "private-visual-review" and (expected_marker is None or marker == expected_marker), "Release marker mismatch")
    for page in PAGES:
        require(fetch(page, port=port, credential=credential)[0] == 200, "Public page health failed: " + page)
    for page in ("/customer", "/customer/login", "/customer/account", "/customer/projects/new"):
        status, headers, body = fetch(page, port=port, credential=credential)
        require(status == 200 and b"Customer access and registration are not enabled." in body and "noindex" in headers.get("x-robots-tag", ""), "Customer disabled-state health failed")
    for endpoint, expected in (("/api/contact", 403), ("/api/book", 403), ("/api/assistant", 503), ("/api/customer/auth/sign-in/email", 503), ("/api/customer/account", 503)):
        require(fetch(endpoint, port=port, credential=credential, method="POST", body="{}")[0] == expected, "Integration disabled-state health failed")
    require(fetch("/api/book/availability?date=2030-01-07", port=port, credential=credential)[0] == 403, "Booking availability must remain disabled")
    require(b"Disallow: /" in fetch("/robots.txt", port=port, credential=credential)[2], "Review indexing guard failed")

def verify_private(fetch):
    for path in PAGES + (MARKER, "/customer/login", "/_next/static/private-probe.js", "/api/book/availability", "/api/customer/auth/sign-in/email", "/api/assistant"):
        # OPTIONS cannot execute a GET/POST integration if pre-existing auth is misconfigured.
        status, headers, _ = fetch(path, method="OPTIONS" if path.startswith("/api/") else "GET")
        require(status == 401 and headers.get("www-authenticate", "").lower().startswith("basic "), "Review authentication is not enforced")

class Deployment:
    def __init__(self, config, commands=None, fetch=http_get, prompt=input, password_prompt=getpass.getpass):
        self.config, self.commands, self.fetch, self.prompt, self.password_prompt = config, commands or Commands(), fetch, prompt, password_prompt

    def pm2_env(self):
        return {**safe_environment(), "PM2_HOME": str(self.config.pm2_home)}

    def pm2_apps(self):
        home = self.config.pm2_home
        require(home.is_dir() and home.stat().st_uid == os.geteuid(), "Existing PM2 home must belong to this account")
        try:
            pid = int((home / "pm2.pid").read_text().strip())
            require(pid > 1 and Path(f"/proc/{pid}").stat().st_uid == os.geteuid(), "PM2 daemon identity mismatch")
            os.kill(pid, 0)
            rpc = home / "rpc.sock"
            require(stat.S_ISSOCK(rpc.stat().st_mode) and rpc.stat().st_uid == os.geteuid(), "Existing PM2 RPC socket is not verified")
            probe = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            try:
                probe.settimeout(1); probe.connect(str(rpc))
            finally:
                probe.close()
        except (OSError, ValueError):
            raise Stop("Existing PM2 daemon is not verified; do not start a new daemon") from None
        apps = json.loads(self.commands.run(["pm2", "jlist"], env=self.pm2_env()))
        require(isinstance(apps, list), "Invalid PM2 state")
        return apps

    def nginx_text(self):
        path = self.config.nginx_site
        require(path.is_file() and not path.is_symlink() and path.resolve() == path, "Use the real regular dedicated review vhost path")
        require(not path.stat().st_mode & 0o022, "Nginx vhost must not be group/world writable")
        source = path.read_text()
        output = self.commands.run(["sudo", "-n", "nginx", "-T"])
        files = re.findall(r"^# configuration file ([^\n]+):$", output, re.M)
        require(any(Path(name).resolve() == path for name in files), "Review vhost is not in the effective nginx configuration")
        review_vhost(source)
        self.other_config_hash = other_nginx_digest(output,path)
        return source

    def inspect(self):
        require(os.geteuid() != 0, "Run as the existing non-root PM2 application account")
        version = self.commands.run(["node", "--version"]).strip()
        require(re.fullmatch(r"v24\.[0-9]+\.[0-9]+", version), "Use reviewed Node24.x; do not silently change runtime versions")
        apps = self.pm2_apps()
        source = self.nginx_text()
        old_port, _ = review_vhost(source)
        # ss contains bound addresses/PIDs, not environment values or command arguments.
        listeners = self.commands.run(["ss", "-ltnpH"])
        return {"source_commit": SOURCE_COMMIT, "node": version, "review_upstream_port": old_port,
                "processes": [{"name": app.get("name"), "pid": app.get("pid"), "status": app.get("pm2_env", {}).get("status"), "cwd": app.get("pm2_env", {}).get("pm_cwd")} for app in apps],
                "listeners": listeners.splitlines()}

    def prepare(self):
        require(os.geteuid() != 0, "Do not install/build application code as root")
        root = private_dir(self.config.release_root)
        release = root / ("review-" + SOURCE_COMMIT[:12] + "-" + uuid.uuid4().hex[:8])
        self.commands.run(["git", "clone", "--no-checkout", "--", REPOSITORY, str(release)], timeout=300)
        self.commands.run(["git", "checkout", "-b", SOURCE_BRANCH, SOURCE_COMMIT], cwd=release)
        require(self.commands.run(["git", "rev-parse", "HEAD"], cwd=release).strip() == SOURCE_COMMIT, "Source commit mismatch")
        require(not self.commands.run(["git", "status", "--porcelain"], cwd=release).strip(), "Source tree is not clean")
        tracked = self.commands.run(["git", "ls-files"], cwd=release).splitlines()
        require(not any(Path(name).name.startswith(".env") or Path(name).suffix in (".pem", ".key") for name in tracked), "Do not package environment/credential files")
        available = available_memory_kib()
        require(available >= 1536 * 1024, "Insufficient available RAM for a safe local build; prepare on a compatible Linux build host")
        build_info = json.loads(self.commands.run(["node", "-p", "JSON.stringify({node:process.version,platform:process.platform,arch:process.arch,glibc:process.report.getReport().header.glibcVersionRuntime})"]).strip())
        require(re.fullmatch(r"v24\.[0-9]+\.[0-9]+", build_info["node"]) and build_info["platform"] == "linux" and build_info.get("glibc"), "Prepare on reviewed Node24 Linux/glibc")
        self.commands.run(["npm", "ci", "--cache", str(root / ".npm-cache")], cwd=release, timeout=900)
        self.commands.run(["node", "scripts/vps/check-release.mjs"], cwd=release, timeout=1800)
        marker = {"commit": SOURCE_COMMIT, "mode": "private-visual-review", "release_id": uuid.uuid4().hex, "build_id": (release / ".next" / "BUILD_ID").read_text().strip()}
        (release / "public" / MARKER.lstrip("/")).write_text(json.dumps(marker) + "\n")
        launcher = release / ".private-review-start.cjs"
        launcher.write_text("// Generated flags-off launcher; contains no credentials.\n" +
            "const safe = {}; for (const key of ['PATH','HOME','TMPDIR']) if (process.env[key]) safe[key] = process.env[key]; Object.assign(safe, " + json.dumps(runtime_environment()) + ");\n" +
            "for (const key of Object.keys(process.env)) delete process.env[key];\nObject.assign(process.env, safe);\n" +
            "process.chdir(__dirname);\nconst cli = require('node:path').join(__dirname, 'node_modules/next/dist/bin/next');\n" +
            "process.argv = [process.execPath, cli, 'start', '--hostname', '127.0.0.1', '--port', process.argv[2]];\nrequire(cli);\n")
        launcher.chmod(0o600)
        prepared = {"commit": SOURCE_COMMIT, "marker": marker, "build": build_info, "checks": ["npm ci", "typecheck", "test", "offline staging", "lint", "build"], "launcher_hash": digest(launcher.read_bytes()), "build_id": (release / ".next" / "BUILD_ID").read_text().strip()}
        (release / ".private-review-prepared.json").write_text(json.dumps(prepared, indent=2)+"\n")
        return release

    def validate_prepared(self, release):
        private_dir(self.config.release_root)
        require(release.is_dir() and not release.is_symlink() and release.resolve().parent == self.config.release_root.resolve(), "Release path mismatch")
        require(release.stat().st_uid == os.geteuid() and not release.stat().st_mode & 0o022, "Release must be private to the application account")
        require(self.commands.run(["git", "rev-parse", "HEAD"], cwd=release).strip() == SOURCE_COMMIT, "Prepared release commit changed")
        require(not self.commands.run(["git", "status", "--porcelain", "--untracked-files=no"], cwd=release).strip(), "Tracked release source changed")
        require(not any(path.name.startswith(".env") for path in release.iterdir()), "Do not load runtime env files into this visual release")
        manifest = json.loads((release / ".private-review-prepared.json").read_text())
        require(manifest["commit"] == SOURCE_COMMIT and manifest["checks"] == ["npm ci", "typecheck", "test", "offline staging", "lint", "build"], "Prepared manifest mismatch")
        require(digest((release / ".private-review-start.cjs").read_bytes()) == manifest["launcher_hash"], "Prepared launcher changed")
        require((release / ".next" / "BUILD_ID").read_text().strip() == manifest["build_id"], "Prepared build changed")
        marker = manifest["marker"]
        require(marker.get("commit") == SOURCE_COMMIT and marker.get("mode") == "private-visual-review" and marker.get("build_id") == manifest["build_id"] and re.fullmatch(r"[0-9a-f]{32}",marker.get("release_id", "")), "Prepared release marker invalid")
        require(json.loads((release / "public" / MARKER.lstrip("/")).read_text()) == marker, "Prepared release marker changed")
        current = json.loads(self.commands.run(["node", "-p", "JSON.stringify({node:process.version,platform:process.platform,arch:process.arch,glibc:process.report.getReport().header.glibcVersionRuntime})"]).strip())
        require(current["node"].startswith("v24.") and current["platform"] == manifest["build"]["platform"] == "linux" and current["arch"] == manifest["build"]["arch"], "Build/runtime Node or platform mismatch")
        require(tuple(map(int,current["node"].lstrip("v").split("."))) >= tuple(map(int,manifest["build"]["node"].lstrip("v").split("."))), "Runtime Node is older than the tested build version")
        require(tuple(map(int,current.get("glibc", "0").split("."))) >= tuple(map(int,manifest["build"]["glibc"].split("."))), "Runtime glibc is older than build host")
        return manifest

    def owned_listener(self, listeners, port, ancestor):
        lines = [line for line in listeners.splitlines() if re.search(rf"(?:\]:|:){port}\s", line)]
        require(len(lines) == 1 and re.search(rf"\s127\.0\.0\.1:{port}\s", lines[0]), "Upstream is not a single loopback-only listener")
        pids = re.findall(r"pid=([0-9]+)", lines[0])
        require(pids, "Port ownership cannot be established")
        process_rows = self.commands.run(["ps", "-eo", "pid=,ppid="])
        parents = {int(pid): int(parent) for pid, parent in (row.split() for row in process_rows.splitlines() if row.strip())}
        for pid in map(int, pids):
            seen = set()
            while pid > 1 and pid not in seen:
                if pid == ancestor:
                    return
                seen.add(pid); pid = parents.get(pid, 0)
        raise Stop("Listener does not belong to the named PM2 process")

    def install(self, content, target, metadata):
        state_root = private_dir(self.config.state_root)
        tmp = state_root / ("config-" + uuid.uuid4().hex)
        tmp.write_bytes(content); tmp.chmod(0o600)
        root_tmp = target.parent / (".monetcore-review-" + uuid.uuid4().hex)
        try:
            self.commands.run(["sudo", "-n", "install", "-m", oct(metadata["mode"])[2:], "-o", str(metadata["uid"]), "-g", str(metadata["gid"]), str(tmp), str(root_tmp)])
            self.commands.run(["sudo", "-n", "mv", "-T", str(root_tmp), str(target)])
        finally:
            tmp.unlink(missing_ok=True)

    def save_state(self, directory, state):
        target = directory / "state.json"
        target.write_text(json.dumps(state, indent=2) + "\n"); target.chmod(0o600)

    def switch(self, release, credential):
        config = self.config
        require(config.candidate_port is not None and config.previous_process_name, "Select a free candidate port and verified rollback PM2 name")
        source = self.nginx_text()
        old_port, _ = review_vhost(source)
        require(old_port != config.candidate_port, "Candidate cannot reuse the running review port")
        apps = self.pm2_apps()
        previous = [app for app in apps if app.get("name") == config.previous_process_name]
        require(len(previous) == 1 and previous[0].get("pm2_env", {}).get("status") == "online", "Rollback PM2 process is not online")
        self.owned_listener(self.commands.run(["ss", "-ltnpH"]), old_port, previous[0]["pid"])
        verify_private(self.fetch)
        require(self.fetch("/", credential=credential)[0] == 200, "Existing authenticated review is not healthy")
        probe = socket.socket()
        try:
            probe.bind(("127.0.0.1", config.candidate_port))
        except OSError:
            raise Stop("Candidate port is already occupied") from None
        finally:
            probe.close()
        name = f"monetcore-review-{SOURCE_COMMIT[:8]}-{config.candidate_port}-{uuid.uuid4().hex[:6]}"
        require(not any(app.get("name") == name for app in apps), "Candidate PM2 name already exists; inspect, do not overwrite")
        prepared = self.validate_prepared(release)
        require(available_memory_kib() >= 768 * 1024, "Insufficient memory to retain rollback process and start candidate safely")
        switched = False
        directory = private_dir(config.state_root) / ("switch-" + uuid.uuid4().hex)
        directory.mkdir(mode=0o700)
        metadata = config.nginx_site.stat()
        state = {"version": 1, "commit": SOURCE_COMMIT, "site": str(config.nginx_site), "old_port": old_port, "new_port": config.candidate_port, "candidate_name": name, "previous_name": config.previous_process_name, "previous_pid": previous[0]["pid"], "previous_cwd": previous[0]["pm2_env"].get("pm_cwd"), "release": str(release), "old_hash": digest(source.encode()), "other_config_hash": self.other_config_hash, "metadata": {"mode": stat.S_IMODE(metadata.st_mode), "uid": metadata.st_uid, "gid": metadata.st_gid}, "status": "candidate"}
        backup = directory / "nginx.before.conf"
        backup.write_text(source); backup.chmod(0o600)
        self.save_state(directory, state)
        try:
            self.commands.run(["pm2", "start", str(release / ".private-review-start.cjs"), "--name", name, "--cwd", str(release), "--max-memory-restart", "768M", "--restart-delay", "3000", "--", str(config.candidate_port)], env=self.pm2_env())
            for attempt in range(30):
                try:
                    verify_release(self.fetch, port=config.candidate_port, expected_marker=prepared["marker"])
                    break
                except (OSError, ValueError, Stop, http.client.HTTPException):
                    if attempt == 29:
                        raise Stop("Candidate health did not pass") from None
                    time.sleep(1)
            candidate = [app for app in self.pm2_apps() if app.get("name") == name]
            require(len(candidate) == 1 and candidate[0].get("pm2_env", {}).get("pm_cwd") == str(release), "Candidate identity mismatch")
            self.owned_listener(self.commands.run(["ss", "-ltnpH"]), config.candidate_port, candidate[0]["pid"])
            confirmation = f"SWITCH REVIEW {SOURCE_COMMIT[:12]} {config.candidate_port}"
            require(self.prompt("Candidate healthy; old process preserved. Type '" + confirmation + "': ") == confirmation, "Switch cancelled; nginx remains unchanged")
            require(digest(config.nginx_site.read_bytes()) == state["old_hash"], "Review config changed during preparation; stop")
            replacement = updated_vhost(source, config.candidate_port)
            state["new_hash"] = digest(replacement.encode()); state["status"] = "switching"; self.save_state(directory, state)
            # Treat even an uncertain install response as requiring recovery.
            switched = True
            require(other_nginx_digest(self.commands.run(["sudo", "-n", "nginx", "-T"]),config.nginx_site) == state["other_config_hash"], "Unrelated nginx configuration changed; stop")
            self.install(replacement.encode(), config.nginx_site, state["metadata"])
            self.commands.run(["sudo", "-n", "nginx", "-t"])
            self.commands.run(["sudo", "-n", "systemctl", "reload", "nginx"])
            verify_private(self.fetch)
            verify_release(self.fetch, credential=credential, expected_marker=prepared["marker"])
            state["status"] = "switched"; self.save_state(directory, state)
            return state, directory / "state.json"
        except BaseException as failure:
            reason = str(failure) if isinstance(failure, Stop) else "Candidate operation failed"
            if switched:
                try:
                    self.restore(directory, state, credential)
                except BaseException:
                    state["status"] = "rollback_unconfirmed"; self.save_state(directory, state)
                    raise Stop("CRITICAL: rollback unconfirmed; preserve both PM2 processes; state: " + str(directory / "state.json")) from None
                raise Stop(reason + "; previous review restored and verified; state: " + str(directory / "state.json")) from None
            else:
                try:
                    self.commands.run(["pm2", "delete", name], env=self.pm2_env())
                except Stop:
                    raise Stop("Review upstream untouched; candidate cleanup unconfirmed; state: " + str(directory / "state.json")) from None
                state["status"] = "not_switched"; self.save_state(directory, state)
                raise Stop(reason + "; review upstream untouched; state: " + str(directory / "state.json")) from None

    def restore(self, directory, state, credential):
        require(state["version"] == 1 and state["commit"] == SOURCE_COMMIT and state["site"] == str(self.config.nginx_site), "Rollback state mismatch")
        backup = (directory / "nginx.before.conf").read_bytes()
        require(digest(backup) == state["old_hash"], "Rollback backup digest mismatch")
        current = digest(self.config.nginx_site.read_bytes())
        require(current in (state["old_hash"], state.get("new_hash")), "Nginx changed externally; refusing to overwrite it")
        old_port, _ = review_vhost(backup.decode())
        require(old_port == state["old_port"], "Rollback upstream mismatch")
        previous = [app for app in self.pm2_apps() if app.get("name") == state["previous_name"]]
        require(len(previous) == 1 and previous[0].get("pm2_env", {}).get("status") == "online" and previous[0].get("pid") == state["previous_pid"] and previous[0].get("pm2_env", {}).get("pm_cwd") == state["previous_cwd"], "Rollback process changed or is no longer online")
        self.owned_listener(self.commands.run(["ss", "-ltnpH"]), old_port, previous[0]["pid"])
        require(other_nginx_digest(self.commands.run(["sudo", "-n", "nginx", "-T"]),self.config.nginx_site) == state["other_config_hash"], "Unrelated nginx configuration changed; manual recovery required")
        self.install(backup, self.config.nginx_site, state["metadata"])
        self.commands.run(["sudo", "-n", "nginx", "-t"])
        self.commands.run(["sudo", "-n", "systemctl", "reload", "nginx"])
        verify_private(self.fetch)
        require(self.fetch("/", credential=credential)[0] == 200, "Restored authenticated review is not healthy")
        state["status"] = "rolled_back"; self.save_state(directory, state)
        # Keep BOTH processes. Do not stop a candidate when effective routing is uncertain.

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("inspect", "prepare", "deploy", "rollback"))
    parser.add_argument("--config", required=True)
    parser.add_argument("--state")
    parser.add_argument("--release", help="Previously prepared, privately transferred Linux release; avoids building on the VPS")
    args = parser.parse_args()
    config = Config.load(args.config)
    tool = Deployment(config)
    if args.action == "inspect":
        print(json.dumps(tool.inspect(), indent=2)); return
    if args.action == "prepare":
        print(json.dumps({"source_commit": SOURCE_COMMIT, "release": str(tool.prepare()), "deployed": False})); return
    tool.inspect()
    require(sys.stdin.isatty(), "Use an interactive SSH terminal; do not pipe review credentials")
    user = input("Existing review Basic Authentication username: ")
    password = getpass.getpass("Existing review password (not stored or logged): ")
    require(user and ":" not in user and password, "Review credentials required")
    credential = "Basic " + base64.b64encode((user + ":" + password).encode()).decode()
    if args.action == "deploy":
        # Validate original private ingress and rollback state BEFORE the long build.
        verify_private(tool.fetch)
        require(tool.fetch("/", credential=credential)[0] == 200, "Existing review login failed")
        release = Path(args.release).resolve() if args.release else tool.prepare()
        state, filename = tool.switch(release, credential)
        print(json.dumps({"source_commit": SOURCE_COMMIT, "url": "https://" + HOST, "pm2_name": state["candidate_name"], "port": state["new_port"], "state_file": str(filename), "customer_platform_enabled": False, "pm2_saved": False})); return
    require(args.state, "Rollback requires its exact state file")
    filename = Path(args.state)
    require(filename.is_absolute() and filename.name == "state.json" and filename.parent.parent == config.state_root.resolve(), "Invalid rollback state location")
    private_dir(filename.parent)
    require(not filename.is_symlink() and filename.stat().st_uid == os.geteuid() and not filename.stat().st_mode & 0o077, "Rollback state must be private")
    state = json.loads(filename.read_text())
    require(input(f"Type ROLLBACK REVIEW {state['old_port']}: ") == f"ROLLBACK REVIEW {state['old_port']}", "Rollback cancelled")
    tool.restore(filename.parent, state, credential)
    print(json.dumps({"status": "rolled_back", "old_port": state["old_port"], "both_processes_preserved": True}))

if __name__ == "__main__":
    try:
        main()
    except (Stop, OSError, ValueError, KeyError, TypeError, AttributeError, http.client.HTTPException):
        # Exception strings may contain provider details; only our safe category is printed.
        error = sys.exc_info()[1]
        print("STOP: " + (str(error) if isinstance(error, Stop) else "Operation could not be verified; no secrets printed"), file=sys.stderr)
        sys.exit(1)
