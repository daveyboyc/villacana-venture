// Drive push notification -> GitHub repository_dispatch. Standard fetch handler:
// runs on Deno Deploy, Supabase Edge Functions or a Cloudflare Worker (pass env as `env`).
// Secrets on the host (never in the repo): DRIVE_CHANNEL_TOKEN (any random string, the same one
// given to scripts/drive_watch.py), GITHUB_DISPATCH_TOKEN (fine-grained token, this repository,
// "Contents: read and write"). Drive tells us only THAT something changed; the workflow diffs.
const REPO = "daveyboyc/villacana-venture";

export default async function handler(request: Request, env: Record<string, string | undefined> = {}) {
  const get = (k: string) => env[k] ?? (globalThis as any).Deno?.env.get(k);
  if (request.method !== "POST") return new Response("POST only", { status: 405 });
  if (request.headers.get("x-goog-channel-token") !== get("DRIVE_CHANNEL_TOKEN")) {
    return new Response("bad token", { status: 401 });
  }
  // "sync" is the handshake sent when the channel is created; nothing changed yet.
  if (request.headers.get("x-goog-resource-state") === "sync") return new Response("ok");
  const res = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${get("GITHUB_DISPATCH_TOKEN")}`,
      accept: "application/vnd.github+json",
      "user-agent": "villacana-drive-relay",
    },
    body: JSON.stringify({ event_type: "drive-photos" }),
  });
  // Answer Drive 2xx whatever GitHub said: Drive retries and may drop the channel on errors.
  return new Response(res.ok ? "dispatched" : `github ${res.status}`, { status: 200 });
}
