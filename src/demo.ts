/**
 * Demonstration of SAS-RTC.
 */

/// <reference path='sasrtc.ts' />

var init = () => {
  SasRtc.initializeLocalMedia('vidAlice');
  console.log('Initializing demo...');
}

window.addEventListener('DOMContentLoaded', init);
