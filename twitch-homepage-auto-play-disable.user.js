// ==UserScript==
// @name         Twitch Homepage Auto-Play Disable
// @namespace    https://github.com/Qnoses
// @version      2.4
// @description  Silences Twitch homepage auto-play (carousel + persistent mini-player) by muting, without fighting the player, and optionally hides them.
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
    const HIDE_CAROUSEL   = true;   // hide the big featured banner on the homepage
    const HIDE_MINIPLAYER = true;   // hide the floating corner mini-player on the homepage
    const PAUSE_FOR_BANDWIDTH = true;  // pause once (delayed) to stop the stream; see maybePauseOnce()
    const PAUSE_DELAY = 700;        // ms before the single bandwidth pause attempt
    const CAROUSEL_SELECTOR   = '.front-page-carousel';
    const MINIPLAYER_SELECTOR = '.persistent-player[data-a-player-state="mini"]';
    const HOME_FLAG = 'data-qn-twitch-home'; // marker toggled on <html> to scope the CSS
    // -------------------------------------------------------------------------

    const onHomepage = () => location.pathname === '/' || location.pathname === '';

    // ---- Cosmetic layer: inject CSS once, scoped to the homepage ------------
    function injectStyles() {
        const targets = [];
        if (HIDE_CAROUSEL && CAROUSEL_SELECTOR.trim()) targets.push(`:root[${HOME_FLAG}] ${CAROUSEL_SELECTOR}`);
        if (HIDE_MINIPLAYER) targets.push(`:root[${HOME_FLAG}] ${MINIPLAYER_SELECTOR}`);
        if (!targets.length) return;
        const style = document.createElement('style');
        style.textContent = `${targets.join(',\n')} { display: none !important; }`;
        (document.head || document.documentElement).appendChild(style);
    }

    function syncHomeMarker() {
        const root = document.documentElement;
        if (onHomepage()) root.setAttribute(HOME_FLAG, '');
        else root.removeAttribute(HOME_FLAG);
    }

    // Mute homepage videos. Muting (unlike pausing) is non-contentious, and is
    // set before the first play(), so there is never an unmuted frame.
    function silence(video) {
        video.muted = true;
        video.autoplay = false;
        video.removeAttribute('autoplay');
    }

    // Optionally stop the stream for bandwidth with a single delayed pause that
    // is never repeated, so it can't loop; a player that resumes just stays muted.
    function maybePauseOnce(video) {
        if (!PAUSE_FOR_BANDWIDTH || video.dataset.autoplayPauseTried) return;
        video.dataset.autoplayPauseTried = '1';
        setTimeout(() => {
            if (onHomepage() && !video.paused) video.pause();
        }, PAUSE_DELAY);
    }

    function tameVideos() {
        if (!onHomepage()) return;
        document.querySelectorAll('video').forEach((video) => {
            if (!video.dataset.autoplayHandled) {
                video.dataset.autoplayHandled = '1';
                // Re-assert mute on resume; never re-pause (that would loop).
                video.addEventListener('play', () => { if (onHomepage()) video.muted = true; });
            }
            silence(video);
            maybePauseOnce(video);
        });
    }

    function tick() {
        syncHomeMarker();
        tameVideos();
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
    syncHomeMarker();
    observer.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', tick);
    window.addEventListener('load', tick);
    tick();
})();
