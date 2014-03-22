/// <reference path='interfaces/MediaStream.d.ts' />
/// <reference path='interfaces/promise.d.ts' />

// Type injections.
interface Window { URL :any; }
interface HTMLElement { src :string; }

/**
 * Contains all of SAS-RTC functionality.
 * Only works on Chrome or Firefox.
 */
module SasRtc {

  /**
   * Initialize the local view upon the id of <video> DOM object.
   */
  export function initializeLocalMedia(vidId:string) {
    var $vid = document.getElementById(vidId);
    if (!$vid) {
      console.error('No DOM video element: ' + vidId);
      return;
    }

    mediaPromise()
        .then((stream:MediaStream) => {
          $vid.src = window.URL.createObjectURL(stream);
        })
        .catch((e) => {
          // TODO: Fallback to a 'real-time canvas drawing method.'
          console.error('Failed to initialize media.', e);
        });
  }

  var vgaConstraints :MediaStreamConstraints = {
    video: true,
    audio: true
  }

  /**
   * Returns the promise of a media stream.
   */
  function mediaPromise() {
    return new Promise<MediaStream>((F,R) => {
      navigator.getUserMedia = navigator.getUserMedia ||
                                   navigator.webkitGetUserMedia; // ||
                                   // navigator.mozGetUserMedia;
      if (undefined === navigator.getUserMedia) {
        R(new Error('No WebRTC media available.'));
      } else {
        navigator.getUserMedia(vgaConstraints, F, R);
      }
    });
  }

  /**
   * Represents an endpoint to communicate with.
   */
  export class Endpoint {

    // Shared secret.
    private sharedSecret :string;

    constructor(
      public eid:string  // Endpoint identifier.
      ) {
    }

    // Send public key.
    public verify = () => {
    }

    /**
     * Begin media locally, and await the other end.
     */
    public startMedia = () => {
    }
  }

  /**
   * Represents an authentication session.
   */
  export class Session {
  }

}  // module SasRtc
