#!/usr/bin/python3 -I
"""Root-owned forced SSH command. The key cannot open a shell or select a path."""
import os
import re
import sys
command = os.environ.get('SSH_ORIGINAL_COMMAND', '')
m = re.fullmatch(r'review-deploy ([a-f0-9]{40}) ([a-f0-9]{64})', command)
r = re.fullmatch(r'review-rollback ([0-9]{8}T[0-9]{6}Z-[a-f0-9]{8})', command)
if m:
    args = ['deploy', *m.groups()]
elif r:
    args = ['rollback', r[1]]
else:
    sys.exit('STOP unsupported review protocol')
os.execve('/usr/bin/sudo', ['sudo','-n','/usr/local/libexec/monetcore-review-deploy',*args], {'PATH':'/usr/sbin:/usr/bin:/sbin:/bin','LANG':'C.UTF-8'})
