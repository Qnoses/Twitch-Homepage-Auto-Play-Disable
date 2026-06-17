// ==UserScript==
// @name         Twitch Homepage Auto-Play Disable
// @namespace    https://github.com/Qnoses
// @version      3.0
// @description  Silences Twitch's auto-playing homepage carousel and persistent corner mini-player by role (data-a-player-type) — muting and optionally hiding them — while never touching the channel/VOD player you actually opened.
// @author       Qnoses
// @license      MIT
// @match        *://www.twitch.tv/*
// @run-at       document-start
// @grant        none
// @homepageURL  https://github.com/Qnoses/Twitch-Homepage-Auto-Play-Disable
// @supportURL   https://github.com/Qnoses/Twitch-Homepage-Auto-Play-Disable/issues
// @downloadURL  https://raw.githubusercontent.com/Qnoses/Twitch-Homepage-Auto-Play-Disable/main/twitch-homepage-auto-play-disable.user.js
// @updateURL    https://raw.githubusercontent.com/Qnoses/Twitch-Homepage-Auto-Play-Disable/main/twitch-homepage-auto-play-disable.user.js
// ==/UserScript==
/* eslint-disable no-multi-spaces */
(function () {
    'use strict';

    // ---- Config: safe to flip; no other edits needed ------------------------
    const HIDE_CAROUSEL       = true;  // hide the big featured banner on the homepage
    const HIDE_MINIPLAYER     = true;  // hide the floating corner mini-player wherever it appears
    const PAUSE_FOR_BANDWIDTH = true;  // pause once (delayed) to stop the stream; see maybePauseOnce()
    const PAUSE_DELAY         = 700;   // ms before the single bandwidth pause attempt
    // -------------------------------------------------------------------------

    // The two auto-playing nuisance roles; the channel/VOD player ("site") is never matched. Fails safe: a renamed role just goes audible again, never mis-muted.
    const SUPPRESS_TYPES = new Set(['site_mini', 'frontpage']);

    // Cosmetic hide targets the outer visible container; a miss leaves a visible-but-silent player (never audible), so brittle selectors are acceptable here.
    const CAROUSEL_HIDE_SELECTOR   = '[data-a-target="front-page-carousel"]';
    const MINIPLAYER_HIDE_SELECTOR = '.persistent-player[data-a-player-state="mini"]';

    // ---- Role detection -----------------------------------------------------
    const playerType  = (video) =>
        video.closest('[data-a-player-type]')?.getAttribute('data-a-player-type') || null;
    const isSuppressed = (video) => SUPPRESS_TYPES.has(playerType(video));

    // ---- Cosmetic layer: inject hide CSS once -------------------------------
    function injectStyles() {
        const targets = [];
        if (HIDE_CAROUSEL)   targets.push(CAROUSEL_HIDE_SELECTOR);
        if (HIDE_MINIPLAYER) targets.push(MINIPLAYER_HIDE_SELECTOR);
        if (!targets.length) return;
        const style = document.createElement('style');
        style.textContent = `${targets.join(',\n')} { display: none !important; }`;
        (document.head || document.documentElement).appendChild(style);
    }

    // Mute before the first play() (no unmuted frame); record the prior mute state once so restore() can hand it back intact.
    function silence(video) {
        if (video.dataset.autoplayPrevMuted === undefined) {
            video.dataset.autoplayPrevMuted = video.muted ? '1' : '0';
        }
        video.muted = true;
        video.autoplay = false;
        video.removeAttribute('autoplay');
    }

    // Give audio back when a silenced video is no longer a nuisance role; only unmute one we muted from unmuted, so a user-muted stream stays muted.
    function restore(video) {
        if (video.dataset.autoplayPrevMuted === '0') video.muted = false;
        delete video.dataset.autoplayPrevMuted;
        delete video.dataset.autoplayPauseTried; // let a later nuisance role pause again
    }

    // Single delayed pause to stop the stream for bandwidth; never repeated (can't loop). Re-checked at fire time so a video that left the set isn't paused.
    function maybePauseOnce(video) {
        if (!PAUSE_FOR_BANDWIDTH || video.dataset.autoplayPauseTried) return;
        video.dataset.autoplayPauseTried = '1';
        setTimeout(() => {
            if (isSuppressed(video) && !video.paused) video.pause();
        }, PAUSE_DELAY);
    }

    function tick() {
        document.querySelectorAll('video').forEach((video) => {
            if (isSuppressed(video)) {
                if (!video.dataset.autoplayHandled) {
                    video.dataset.autoplayHandled = '1';
                    // Re-assert mute on resume while still a nuisance role; never re-pause (would loop). Inert on channels.
                    video.addEventListener('play', () => { if (isSuppressed(video)) video.muted = true; });
                }
                silence(video);
                maybePauseOnce(video);
            } else if (video.dataset.autoplayPrevMuted !== undefined) {
                restore(video); // was a nuisance, isn't anymore -> give its audio back
            }
        });
    }

    // Twitch is a SPA; watch the DOM, throttled to one scan per frame.
    let scheduled = false;
    const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            tick();
        });
    });

    injectStyles();
    observer.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', tick);
    window.addEventListener('load', tick);
    tick();
})();
