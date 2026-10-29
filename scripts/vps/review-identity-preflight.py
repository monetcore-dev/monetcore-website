#!/usr/bin/python3 -I
"""Read-only first-install collision check. Creates/changes no accounts or files."""
import grp
import json
import os
from pathlib import Path
import pwd
import stat
import sys

DEPLOY_USER = 'monetcore_review_actions'
DEPLOY_HOME = Path('/var/lib/monetcore-review-automation')
RUNTIME_USER = 'monetcore_review_runtime'
RUNTIME_HOME = Path('/var/lib/monetcore-review-runtime')
LEGACY_USER = 'monetcore-review-deploy'
LEGACY_HOME = Path('/var/lib/monetcore-review-deploy')
LEGACY_UID = 999
IDENTITIES = ((DEPLOY_USER,DEPLOY_HOME),(RUNTIME_USER,RUNTIME_HOME))
NEW_PATHS = (
    DEPLOY_HOME,RUNTIME_HOME,Path('/srv/monetcore-review-deploy'),
    Path('/etc/monetcore-review-deploy.json'),
    Path('/usr/local/libexec/monetcore-review-deploy'),
    Path('/usr/local/libexec/monetcore-review-ssh'),
    Path('/usr/local/libexec/monetcore-review-pm2-start'),
    Path('/etc/systemd/system/monetcore-review-pm2.service'),
    Path('/usr/lib/systemd/system/monetcore-review-pm2.service'),
    Path('/etc/sudoers.d/monetcore-review-actions'),
)

class Collision(ValueError):
    pass

def require(condition, category):
    if not condition:raise Collision(category)

def metadata(path):
    try:return os.lstat(path)
    except FileNotFoundError:return None


def audit():
    for name,home in IDENTITIES:
        require(name!=LEGACY_USER and home!=LEGACY_HOME and LEGACY_HOME not in home.parents and home not in LEGACY_HOME.parents,'legacy_identity_overlap')
        for lookup,category in [(pwd.getpwnam,'planned_user_exists'),(grp.getgrnam,'planned_group_exists')]:
            try:lookup(name)
            except KeyError:pass
            else:raise Collision(category)
    targets={str(home) for _,home in IDENTITIES}
    # NSS alias and dangling membership checks are metadata-only, not home scans.
    for record in pwd.getpwall():
        assigned=Path(record.pw_dir)
        require(not any(assigned==Path(home) or Path(home) in assigned.parents for home in targets),'planned_home_assigned_to_another_user')
    for record in grp.getgrall():
        require(not any(name in record.gr_mem for name,_ in IDENTITIES),'planned_name_has_existing_group_membership')
    for target in NEW_PATHS:
        # lstat detects broken links and fails closed on permission errors.
        # Never inspect or reuse an existing target's contents.
        require(metadata(target) is None,'planned_path_already_exists')
        for parent in target.parents:
            info=metadata(parent)
            if info is not None:
                require(stat.S_ISDIR(info.st_mode) and info.st_uid==0 and not info.st_mode&0o022,'untrusted_install_parent')
    return {'status':'no-collisions-found','deployment_user':DEPLOY_USER,'deployment_home':str(DEPLOY_HOME),'runtime_user':RUNTIME_USER,'writes_performed':False,'activation_authorized':False}

if __name__=='__main__':
    try:
        require(len(sys.argv)==1,'no_arguments_accepted')
        print(json.dumps(audit()))
    except (Collision,OSError) as error:
        print(json.dumps({'status':'STOP','category':str(error) if isinstance(error,Collision) else 'inventory_unavailable','writes_performed':False}),file=sys.stderr)
        sys.exit(1)
