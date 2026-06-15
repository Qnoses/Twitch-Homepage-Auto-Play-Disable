# Twitch Homepage Auto-Play Disable

A userscript that stops the featured video on the Twitch homepage from
auto-playing — no more a stream blasting at you the moment you open
`twitch.tv`. Channel and VOD playback is untouched.

## What it does

The Twitch homepage (`twitch.tv/`) auto-plays a large featured stream preview at
the top of the page. This script watches the page and, **while you're on the
homepage**, pauses any `<video>` element, strips its `autoplay`, and re-pauses it
if Twitch's React app tries to resume it. The moment you navigate into an actual
channel or VOD, normal playback resumes — the script only governs the homepage.

It's selector-agnostic (it targets `<video>` elements directly rather than
Twitch's CSS class names), so Twitch reshuffling its markup won't quietly break
it.

## Why

This is meant to pair with **hiding the homepage carousel** — the big
featured-stream banner at the top of `twitch.tv/` — which most people do with an
ad-blocker filter or a CSS injector.

The catch: hiding an element with CSS (`display: none`) **does not stop its
`<video>` from playing.** The carousel vanishes visually, but the featured stream
keeps running underneath — pulling bandwidth and, since Twitch doesn't mute
autoplaying video, playing its audio out loud. So you're left hearing a random
channel with no visible source every time you open the front page. This script
pauses that playback, so a carousel you can't even see isn't streaming at you
anyway.

It also works on its own, without hiding the carousel — you'll just see the
featured player sitting paused instead of gone — but the hidden-carousel case is
what it's built for.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or
   [Violentmonkey](https://violentmonkey.github.io/).
2. Open the raw script — your manager will offer to install it:
   **https://raw.githubusercontent.com/Qnoses/Twitch-Homepage-Auto-Play-Disable/main/twitch-homepage-auto-play-disable.user.js**

## Scope & behavior

- Runs only on `www.twitch.tv`, at `document-start`.
- Acts **only on the homepage** (`/`). Every other page — channels, VODs,
  directories — is left completely alone.
- Because it actively re-pauses, the featured homepage player **stays paused even
  if something tries to play it** while you're on the homepage. In the intended
  setup the carousel is hidden, so you never see or touch it anyway; if you don't
  hide it and want to watch a featured stream, click into its channel, where it
  plays normally.
- Touches no storage; toggle it off in your manager to fully revert.

## How it stays efficient

Twitch is a single-page app, so videos appear and disappear without full page
loads. The script uses a `MutationObserver` throttled to **one scan per animation
frame**, so it keeps up with Twitch's heavy DOM churn without hammering the CPU.

## License

MIT — see [LICENSE](LICENSE).
