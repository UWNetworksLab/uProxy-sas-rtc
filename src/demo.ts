/**
 * Demonstration of SAS-RTC.
 */

/// <reference path='sasrtc.ts' />

var init = () => {
  console.log('Initializing demo...');
  var alice = new SasRtc.Endpoint('alice');
  var bob = new SasRtc.Endpoint('bob');
  var aliceReady = alice.startMedia('vidAliceLocal', 'vidAlice');
  var bobReady = bob.startMedia('vidBobLocal', 'vidBob');

  alice.setSignalHandler(bob.handleSignal);
  bob.setSignalHandler(alice.handleSignal);

  var bindAliceAndBob = () => {
    alice.offer()
      .then(bob.answer);
      // .then(() => {
        // console.log('Finished connecting Alice and Bob.');
        // alice.pc.getStats(null, (x) => {
          // console.log('stats', x);
        // });
      // })
  };

  // Bind Alice and Bob together when media streams are reday.
  Promise.all(aliceReady, bobReady).then(() => {
    console.log('Alice and Bob are ready. Connecting...');
    // bindAliceAndBob();
    window.setTimeout(bindAliceAndBob, 400);
  });
};

window.addEventListener('DOMContentLoaded', init);
