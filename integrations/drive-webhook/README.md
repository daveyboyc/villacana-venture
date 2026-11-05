# Drive webhook for new photos

New photos in the Drive folder go on the map as camera pins with no agent: the
`Drive photo intake` workflow (`drive-intake.yml`, see step 0) runs
`scripts/drive_intake.py`. Describing what each photo shows still needs someone to look
at it; the workflow log lists the photos that are untagged.

Two ways to start it. Set up the first, add the second for instant updates.

## 0. Install the workflow (one time, by someone with workflow permission)

Pushes made by Claude's GitHub app cannot create files under `.github/workflows/`, so the workflow
lives here until it is copied in: `cp integrations/drive-webhook/drive-intake.yml .github/workflows/`,
commit and push it yourself. (Optional: add `python3 scripts/test_drive_intake.py` to the test line in
`.github/workflows/evidence.yml`.)

## 1. Polling (works with only a Google service account)

1. Google Cloud console: create a service account, add a JSON key. Enable the Drive API.
2. Share the Drive folder with the service account's email address (Viewer).
3. Repository secrets: `GOOGLE_SERVICE_ACCOUNT_JSON` (the whole key file) and
   `VILLACANA_DRIVE_FOLDER` (the folder id, the last part of its URL).
4. Run the workflow once by hand (Actions, Drive photo intake, Run workflow). From then on it
   polls every 15 minutes (GitHub may delay scheduled runs by several minutes).

Until the secrets exist the workflow does nothing. Originals are downloaded to a temporary
folder on the runner and never committed; only EXIF-free web copies, thumbnails and
generated data are.

## 2. Webhook (instant)

Drive can call a URL when files change. GitHub Actions cannot receive that call itself, so a
tiny public relay turns it into a `repository_dispatch` event:

1. Host `relay.ts` (Deno Deploy, a Supabase Edge Function or a Cloudflare Worker). Give the host
   `DRIVE_CHANNEL_TOKEN` (any long random string) and `GITHUB_DISPATCH_TOKEN` (fine-grained
   token for this repository, Contents read and write).
2. `GOOGLE_SERVICE_ACCOUNT_JSON=... python3 scripts/drive_watch.py --address <relay URL> --token <the same string>`
3. Channels expire, so repeat step 2 regularly (it stops the old channel first).

What has been exercised: `drive_intake.py` offline (`scripts/test_drive_intake.py`, a stub Drive and
generated photos, including re-uploads and IMG-number clashes) and a full run of its steps on a
clean checkout; `relay.ts` under Node with a mocked GitHub call. Not yet run against live Google
Drive, a hosted relay, or the Actions schedule: the first real run needs the secrets above.
