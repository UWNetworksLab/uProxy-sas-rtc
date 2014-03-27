/**
 * Demonstration of SAS-RTC.
 */

/// <reference path='sasrtc.ts' />

var init = () => {
  console.log('Initializing demo...');
  var alice = new SasRtc.Peer('alice');
  var bob = new SasRtc.Peer('bob');
  var aliceReady = alice.startMedia('vidAliceLocal', 'vidAlice', 'sasAlice');
  var bobReady = bob.startMedia('vidBobLocal', 'vidBob', 'sasBob');

  alice.setSignalHandler(bob.handleSignal);
  bob.setSignalHandler(alice.handleSignal);

  var bindAliceAndBob = () => {
    alice.offer()
      .then(bob.answer);
  };

  // Bind Alice and Bob together when media streams are reday.
  Promise.all(aliceReady, bobReady).then(() => {
    console.log('Alice and Bob are ready. Connecting...');
    // bindAliceAndBob();
    window.setTimeout(bindAliceAndBob, 400);
  });
};

window.addEventListener('DOMContentLoaded', init);
