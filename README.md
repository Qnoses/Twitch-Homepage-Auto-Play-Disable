# Twitch Homepage Auto-Play Disable

A userscript that stops Twitch from auto-playing video at you — the featured-stream
banner at the top of `twitch.tv/` (the carousel) **and** the persistent corner
mini-player that follows you around once you've started watching something. No
audio blasting out, no stream quietly eating bandwidth. The channel or VOD you
actually open is left completely alone.

## What it does

The script identifies the two auto-playing nuisance players by the role Twitch
assigns each of them — `data-a-player-type="frontpage"` for the homepage carousel
and `data-a-player-type="site_mini"` for the floating mini-player — and for each
one's `<video>` it:

1. **Mutes it** — set before the player's first `play()`, so there's never an
   unmuted frame. This is the guarantee: no audio, ever, from these players.
2. **Pauses it once, shortly after load** (on by default) — to stop the stream
   itself, not just the sound. Once that pause sticks, Twitch stops fetching the
   video, so it stops pulling bandwidth too.
3. **Optionally hides it** — the carousel and the mini-player are hidden outright
   by default, so you don't need a separate ad-block or CSS filter.

Because it keys on the player's *role* rather than the page URL, it doesn't matter
where the mini-player floats — homepage, directory, following, search, settings —
it's silenced everywhere it appears, with no list of routes to maintain. The one
player it never touches is the one you opened on purpose: the channel/VOD player
is `site` (clips, popout, etc. are their own roles), none of which are nuisance
roles, so normal playback is untouched.

The role attribute lives in Twitch's `data-a-*` analytics namespace, which their
own tooling depends on, so it's far stickier than CSS class names. And it fails
*safe*: if Twitch ever renames a role, the script stops matching it and the player
simply goes back to audible — obvious, and a one-line fix — rather than ever
muting something it shouldn't.

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

## Handing audio back

The mini-player is a single `<video>` that survives navigation — expand it, or
click into the channel you were watching, and that same element becomes the full
channel player. So the moment a silenced player stops being a nuisance role (its
`data-a-player-type` is no longer `site_mini`/`frontpage`), the script restores
the mute state it found *before* it intervened. A stream you'd genuinely muted
yourself stays muted; one that was playing gets its audio back. The homepage mute
never leaks into the channel you open next.

## Pairs with hiding the players

This is meant to sit alongside **hiding the auto-playing players outright**. The
catch with hiding alone: `display: none` **does not stop a `<video>` from
playing.** The element vanishes visually, but the stream keeps running underneath,
pulling bandwidth and (since Twitch doesn't mute autoplaying video) playing its
audio out loud. So hiding without silencing leaves you hearing a random channel
with no visible source.

This script closes that gap: it can do the hiding itself (see `HIDE_CAROUSEL` /
`HIDE_MINIPLAYER` below) **and** it mutes and stops the underlying video, so a
player you can't even see isn't streaming at you anyway. It also works fine without
hiding anything — you'll just see the players sitting muted and paused instead of
gone.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or
   [Violentmonkey](https://violentmonkey.github.io/).
2. Open the raw script — your manager will offer to install it:
   **https://raw.githubusercontent.com/Qnoses/Twitch-Homepage-Auto-Play-Disable/main/twitch-homepage-auto-play-disable.user.js**

## Configuration

Four constants at the top of the script, safe to flip with no other edits:

- `HIDE_CAROUSEL` (default `true`) — hide the big featured banner on the homepage.
- `HIDE_MINIPLAYER` (default `true`) — hide the floating corner mini-player
  wherever it appears.
- `PAUSE_FOR_BANDWIDTH` (default `true`) — after muting, pause once to stop the
  stream and save bandwidth. Set `false` to mute only.
- `PAUSE_DELAY` (default `700`) — milliseconds to wait before that single pause,
  giving the player time to settle so the pause lands cleanly.

## Scope & behavior

- Runs on `www.twitch.tv`, at `document-start`.
- Acts **only on the two auto-playing nuisance players**, identified by Twitch's
  own role attribute (`data-a-player-type` of `frontpage` or `site_mini`). The
  channel/VOD player you open is `site` and is never touched — no URL
  allow-listing needed.
- Always **mutes** those players, with no audible bleed (mute is set before the
  first play).
- With `PAUSE_FOR_BANDWIDTH` on, also **pauses once** to stop the stream. A player
  that resumes afterward stays muted and is not fought again, so there's no loop.
- **Restores the prior mute state** when a silenced player stops being a nuisance
  role, so the mute never leaks into the channel you open next.
- Hiding is injected as CSS targeting the players' outer containers; if Twitch
  reshuffles those class names the worst case is a visible-but-silent player,
  never audio.
- Touches no storage; toggle it off in your manager to fully revert.

## How it stays efficient

Twitch is a single-page app, so videos appear and disappear without full page
loads. The script uses a `MutationObserver` throttled to **one scan per animation
frame**, so it keeps up with Twitch's heavy DOM churn without hammering the CPU.

## License

MIT — see [LICENSE.md](LICENSE.md).
