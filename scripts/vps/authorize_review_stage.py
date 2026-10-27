#!/usr/bin/env python3
"""Check solo-owner intent and pinning. No network, credentials, or VPS actions."""
import os
import re
import sys

REPOSITORY = 'monetcore-dev/monetcore-website'
OWNER = 'monetcore-dev'
REF = 'refs/heads/feature/monetcore-vps-completed'


class Denied(ValueError):
    pass


def authorize(context):
    if context.get('GITHUB_EVENT_NAME') != 'workflow_dispatch':
        raise Denied('Only explicit manual dispatch is allowed')
    if context.get('GITHUB_REPOSITORY') != REPOSITORY or context.get('GITHUB_REF') != REF:
        raise Denied('Wrong repository or release branch')
    if context.get('GITHUB_ACTOR') != OWNER or context.get('GITHUB_TRIGGERING_ACTOR') != OWNER:
        raise Denied('Only the owner may dispatch or rerun this workflow')
    sha = context.get('CANDIDATE_SHA', '')
    if not re.fullmatch(r'[a-f0-9]{40}', sha):
        raise Denied('Provide the complete lowercase candidate commit SHA')
    if sha != context.get('GITHUB_SHA'):
        raise Denied('Candidate differs from dispatch commit; review the current branch and dispatch again')
    stage = context.get('STAGE_REQUESTED')
    if stage not in ('true', 'false'):
        raise Denied('Explicit staging choice is required')
    if stage == 'true' and context.get('OWNER_CONFIRMATION') != f'REVIEWED {sha} FOR STAGING ONLY':
        raise Denied('Staging requires the exact owner review confirmation for this commit')
    return sha, stage == 'true'


def main():
    sha, stage = authorize(os.environ)
    with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
        output.write(f'sha={sha}\nstage_authorized={str(stage).lower()}\n')
    print('Owner intent and commit pin checked; validation and upload enable gate remain separate')


if __name__ == '__main__':
    try:
        main()
    except (Denied, KeyError, OSError) as error:
        print('STOP: ' + (str(error) if isinstance(error, Denied) else 'Authorization output unavailable'), file=sys.stderr)
        sys.exit(1)
