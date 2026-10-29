#!/usr/bin/python3 -I
"""Root-owned forced SSH command. The key cannot open a shell or select a path."""
import os
import re
import sys
command = os.environ.get('SSH_ORIGINAL_COMMAND', '')
protocol = 'monetcore-review-v2-1'
m = re.fullmatch(r'review-deploy ([a-f0-9]{40}) ([a-f0-9]{64}) '+protocol, command)
r = re.fullmatch(r'review-rollback ([0-9]{8}T[0-9]{6}Z-[a-f0-9]{8}) '+protocol, command)
if m:
    args = ['deploy', *m.groups(), protocol]
elif r:
    args = ['rollback', r[1], protocol]
elif command == 'review-status '+protocol:
    args = ['status', protocol]
else:
    sys.exit('STOP unsupported review protocol')
os.execve('/usr/bin/sudo', ['sudo','-n','/usr/local/libexec/monetcore-review-deploy',*args], {'PATH':'/usr/sbin:/usr/bin:/sbin:/bin','LANG':'C.UTF-8'})
