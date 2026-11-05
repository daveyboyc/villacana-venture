#!/usr/bin/env python3
"""Register (or renew) the Google Drive push-notification channel that calls the relay.

  python3 scripts/drive_watch.py --address https://relay.example.com/drive --token SECRET [--stop]

Uses changes.watch with the same service account as drive_intake.py (GOOGLE_SERVICE_ACCOUNT_JSON).
Drive notifies on any change the service account can see and says only that something changed; the
intake workflow works out which photos are new. Channels expire: run this again regularly (it
stops the channel recorded in the file given by --state first, then registers a fresh one).
The address must be public HTTPS with a valid certificate: see integrations/drive-webhook/README.md.
"""
import argparse
import json
import os
import uuid
from pathlib import Path

API = 'https://www.googleapis.com/drive/v3'


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--address', required=True, help='public HTTPS URL of the relay')
    parser.add_argument('--token', required=True, help='shared secret: the relay\'s DRIVE_CHANNEL_TOKEN')
    parser.add_argument('--state', type=Path, default=Path('drive-channel.json'), help='where the channel id/resource id are kept (private)')
    parser.add_argument('--stop', action='store_true', help='only stop the recorded channel')
    args = parser.parse_args()

    from google.oauth2 import service_account
    from google.auth.transport.requests import AuthorizedSession
    creds = service_account.Credentials.from_service_account_info(
        json.loads(os.environ['GOOGLE_SERVICE_ACCOUNT_JSON']), scopes=['https://www.googleapis.com/auth/drive.readonly'])
    session = AuthorizedSession(creds)

    if args.state.exists():
        old = json.loads(args.state.read_text())
        r = session.post(f'{API}/channels/stop', json={'id': old['id'], 'resourceId': old['resourceId']})
        print('stopped old channel' if r.ok else f'old channel not stopped ({r.status_code}); it will expire')
    if args.stop:
        return
    start = session.get(f'{API}/changes/startPageToken', params={'supportsAllDrives': 'true'})
    start.raise_for_status()
    channel = {'id': str(uuid.uuid4()), 'type': 'web_hook', 'address': args.address, 'token': args.token}
    r = session.post(f'{API}/changes/watch', params={'pageToken': start.json()['startPageToken'], 'supportsAllDrives': 'true',
                                                    'includeItemsFromAllDrives': 'true'}, json=channel)
    r.raise_for_status()
    body = r.json()
    args.state.write_text(json.dumps({'id': body['id'], 'resourceId': body['resourceId']}))
    print('watching; channel expires', body.get('expiration'), '(ms since epoch)')


if __name__ == '__main__':
    main()
