# Shotgun audio credits

Sounds are unmodified WAVs from **Freedoom**, an open-content game for Doom engines:
https://github.com/freedoom/freedoom

Pinned source revision: e61c4f86722259ba9f410567156d958c712584a2.
The full BSD-3-Clause notice is in COPYING.adoc; the upstream contributor list is
in CREDITS. sources.json records the original URLs and SHA-256 hashes.

| Local file | Freedoom source | Use here |
| --- | --- | --- |
| fire.wav | sounds/dsshotgn.wav | Shotgun blast |
| pump.wav | sounds/dssgcock.wav | Automatic pump after a shot |
| reload-open.wav | sounds/dsdbopn.wav | Start reload |
| reload-shell.wav | sounds/dsdbload.wav | Insert a shell |
| reload-close.wav | sounds/dsdbcls.wav | Finish reload; first 75 ms also used for empty-fire feedback |

These are Freedoom's independently created effects, not recordings extracted from
id Software's Doom. The double-barrel reload samples are adapted as gameplay cues
for this pump-action prototype; the audio files themselves are unchanged.

Browser playback code is reused through **Howler.js 2.2.4**, by James Simpson and
GoldFire Studios, under the MIT licence:
https://github.com/goldfire/howler.js/tree/v2.2.4

Its full notice is shipped at ../../licenses/howler-MIT.txt. The application uses
Howler's decoded audio playback, mobile unlocking, muting, stopping and unloading.
The shell-count and reload state machine is application-specific code.
