/**
 * Demonstration of SAS-RTC.
 */

/// <reference path='sasrtc.ts' />

var init = () => {
  console.log('Initializing demo...');
  var alice = new SasRtc.Endpoint('alice');
  var bob = new SasRtc.Endpoint('bob');
  alice.initializeMedia('vidAliceLocal', 'vidAlice');
  bob.initializeMedia('vidBobLocal', 'vidBob');

  alice.setICE(bob.addICE);
  bob.setICE(alice.addICE);

  window.setTimeout(() => {
    // Bind Alice and Bob together.
    alice.offer()
      .then(bob.answer)
      .then(alice.receive)
      .then(() => {
        console.log('Finished connecting Alice and Bob.');
        console.log(alice.pc.getLocalStreams());
        console.log(alice.pc.getRemoteStreams());
        console.log(bob.pc.getLocalStreams());
        console.log(bob.pc.getRemoteStreams());
      })

  // The local media needs to be ready before setting up a peer connection.
  }, 1000);
  // Start audio/video streams.
}

window.addEventListener('DOMContentLoaded', init);
