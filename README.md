# Twitch Homepage Auto-Play Disable

A userscript that stops the Twitch homepage from auto-playing video at you — the
featured stream banner at the top of `twitch.tv/`, **and** the persistent corner
mini-player that starts up when you return to the homepage from a channel. No
audio blasting out, no stream quietly eating bandwidth. Channel and VOD playback
is untouched.

## What it does

While you're on the homepage (`twitch.tv/`), for every `<video>` it finds, the
script:

1. **Mutes it** — set before the player's first `play()`, so there's never an
   unmuted frame. This is the guarantee: no audio, ever, on the homepage.
2. **Pauses it once, shortly after load** (on by default) — to stop the stream
   itself, not just the sound. Once that pause sticks, Twitch stops fetching the
   video, so it stops pulling bandwidth too.
3. **Optionally hides it** — the featured carousel and the corner mini-player
   are hidden outright by default, so you don't need a separate ad-block or CSS filter.

The moment you navigate into an actual channel or VOD, normal playback resumes —
the script only governs the homepage. The video handling is selector-agnostic
(it targets `<video>` elements directly rather than Twitch's CSS class names),
so Twitch reshuffling its markup won't quietly break it.

## Why mute, instead of just pausing?

Pausing alone fights the player. Twitch's player-core treats a stopped media sink
as an error: its `onSinkStop` handler re-issues `play()` on a ~300 ms timer. If
you re-pause the instant it resumes, that becomes a tight play/pause flicker
loop. Muting is the one lever the player **doesn't** fight, so it's used as the
primary, reliable silence.

For bandwidth, the script adds a **single, delayed pause** per video — never an
instant or repeated one — so it can't create that loop. Where the pause sticks
(the common case), the player goes idle and the stream stops. Where a player
insists on resuming, it simply stays muted and keeps streaming: a harmless
fallback, not a loop.

## Pairs with hiding the carousel

This is meant to sit alongside **hiding the homepage carousel** — the big
featured-stream banner. The catch with hiding alone: `display: none` **does not
stop the `<video>` from playing.** The carousel vanishes visually, but the
featured stream keeps running underneath, pulling bandwidth and (since Twitch
doesn't mute autoplaying video) playing its audio out loud. So hiding without
silencing leaves you hearing a random channel with no visible source.

This script closes that gap: it can do the hiding itself (see `HIDE_CAROUSEL` /
`HIDE_MINIPLAYER` below) **and** it mutes and stops the underlying video, so a
carousel you can't even see isn't streaming at you anyway. It also works fine
without hiding anything — you'll just see the featured player sitting muted and
paused instead of gone.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or
   [Violentmonkey](https://violentmonkey.github.io/).
2. Open the raw script — your manager will offer to install it:
   **https://raw.githubusercontent.com/Qnoses/Twitch-Homepage-Auto-Play-Disable/main/twitch-homepage-auto-play-disable.user.js**

## Configuration

Four constants at the top of the script, safe to flip with no other edits:

- `HIDE_CAROUSEL` (default `true`) — hide the big featured banner on the homepage.
- `HIDE_MINIPLAYER` (default `true`) — hide the floating corner mini-player on the
  homepage.
- `PAUSE_FOR_BANDWIDTH` (default `true`) — after muting, pause once to stop the
  stream and save bandwidth. Set `false` to mute only.
- `PAUSE_DELAY` (default `700`) — milliseconds to wait before that single pause,
  giving the player time to settle so the pause lands cleanly.

## Scope & behavior

- Runs only on `www.twitch.tv`, at `document-start`.
- Acts **only on the homepage** (`/`). Every other page — channels, VODs,
  directories — is left completely alone.
- Always **mutes** homepage videos, with no audible bleed (mute is set before the
  first play).
- With `PAUSE_FOR_BANDWIDTH` on, also **pauses once** to stop the stream. A player
  that resumes afterward stays muted and is not fought again, so there's no loop.
- Hiding is injected as CSS **scoped to the homepage** via a marker attribute on
  `<html>`, so the mini-player still behaves normally on the pages where it
  belongs.
- Touches no storage; toggle it off in your manager to fully revert.

## How it stays efficient

Twitch is a single-page app, so videos appear and disappear without full page
loads. The script uses a `MutationObserver` throttled to **one scan per animation
frame**, so it keeps up with Twitch's heavy DOM churn without hammering the CPU.

## License

MIT — see [LICENSE.md](LICENSE.md).
