// ==UserScript==
// @name         Twitch Homepage Auto-Play Disable
// @namespace    https://github.com/Qnoses
// @version      2.0
// @description  Disables Twitch homepage featured video auto-play.
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
    // Twitch's homepage is "/" (sometimes "" before the router settles).
    const onHomepage = () => location.pathname === '/' || location.pathname === '';
    function tamePlayers() {
        if (!onHomepage()) return;
        // Selector-agnostic: grab any <video>, so Twitch class renames can't break us.
        document.querySelectorAll('video').forEach((video) => {
            if (video.dataset.autoplayDisabled) return;   // only handle each element once
            video.dataset.autoplayDisabled = '1';
            video.autoplay = false;
            video.removeAttribute('autoplay');
            video.pause();
            console.log('[autoplay-disable] paused a homepage video');
            // React/Twitch will often try to resume playback; re-pause, but only
            // while we're still on the homepage so other pages stay playable.
            video.addEventListener('play', () => {
                if (onHomepage()) video.pause();
            });
        });
    }
    // Twitch is a SPA: videos appear/disappear without page loads, so watch the DOM.
    // Throttle to one scan per frame to avoid hammering on Twitch's heavy mutations.
    let scheduled = false;
    const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            tamePlayers();
        });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    // Initial passes for the cases the observer might miss.
    document.addEventListener('DOMContentLoaded', tamePlayers);
    window.addEventListener('load', tamePlayers);
    tamePlayers();
})();
