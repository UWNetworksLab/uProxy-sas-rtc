/// <reference path='interfaces/MediaStream.d.ts' />
/// <reference path='interfaces/promise.d.ts' />

// Type injections because "DefinitelyTyped" is not perfect.
interface Window { URL :any; }
interface HTMLElement { src :string; }
interface RTCPeerConnection {
  getStats :any;
}
interface mozRTCPeerConnection extends RTCPeerConnection {}
interface MediaStream {
  id :string;
}

/**
 * Contains all of SAS-RTC functionality.
 * Only works on Chrome or Firefox.
 */
module SasRtc {

  var RTCPC = RTCPC || webkitRTCPeerConnection;  // || mozRTCPeerConnection;

  navigator.getUserMedia = navigator.getUserMedia ||
                           navigator.webkitGetUserMedia;

  var vgaConstraints :MediaStreamConstraints = {
    video: true,
    audio: true
  }

  var sdpConstraints :MediaConstraints = {
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    }
  };

  /**
   * Returns the promise of a media stream.
   */
  function mediaPromise() : Promise<MediaStream> {
    return new Promise<MediaStream>((F,R) => {
                                   // navigator.mozGetUserMedia;
      if (undefined === navigator.getUserMedia) {
        R(new Error('No WebRTC media available.'));
      } else {
        navigator.getUserMedia(vgaConstraints, F, R);
      }
    });
  }

  export var attachMedia = ($vid:HTMLElement, stream:MediaStream) => {
    console.log('Attaching stream', stream.id, ' to element', $vid.id);
    $vid.src = window.URL.createObjectURL(stream);
  }

  /**
   * Represents an endpoint to communicate with.
   */
  export class Endpoint {

    public pc            :RTCPeerConnection;
    private sharedSecret :string;
    private remoteKey    :string;
    private $vid         :HTMLElement;
    private $vidRemote   :HTMLElement;
    public stream        :MediaStream;

    // To be sent over 'signalling channel' when new ICE candidates arrive.
    // private iceHandler_  :(c:RTCIceCandidate)=>void = null;
    // public negotiationHandler_ :any = null;

    // External callback for signalling.
    private sendSignal_ :any;

    constructor(public eid:string) {
      this.pc = new RTCPC(null);
      this.pc.onaddstream = (ev:RTCMediaStreamEvent) => {
        console.log(this.eid + ': received remote stream: ', ev.stream);
        attachMedia(this.$vidRemote, ev.stream);
      }
      this.pc.onicecandidate = (e:RTCIceCandidateEvent) => {
        var candidate = e.candidate;
        if (null !== candidate) {
          this.sendSignal_(JSON.stringify({ candidate: candidate }));
        }
      }
      this.pc.onnegotiationneeded = () => {
        console.log(eid + ': negotiationneeded.');
        // this.negotiationHandler_ && this.negotiationHandler_();
      }
    }

    /**
     * Promise the initialization of MediaStream for this Endpoint.
     */
    public startMedia = (
        vidId:string, remoteVidId:string) : Promise<void> => {
      this.$vid = document.getElementById(vidId);
      this.$vidRemote = document.getElementById(remoteVidId);
      if (!this.$vid) {
        console.error('No DOM video element: ' + vidId);
        return;
      }
      return mediaPromise()
          .then((stream:MediaStream) => {
            this.stream = stream;
            console.log('adding mediastream to peerconnection');
            this.pc.addStream(stream);
            attachMedia(this.$vid, stream);
          })
          .catch((e) => {
            // TODO: Fallback to a 'real-time canvas drawing method.'
            console.error('Failed to initialize media.', e);
          });
    }

    /**
     * Receive a signal, and return a promise that it's been handled.
     * Assumes |msg| is valid JSON.
     */
    public handleSignal = (msg:string) => {
      var json = JSON.parse(msg);
      if (json.sdp) {
        console.log(this.eid + ': recv ', msg);
        this.receive_(new RTCSessionDescription(json.sdp))
            .then((offer) => {
              this.remoteKey = extractCryptoKey(offer);
              console.log(this.eid + ': remote key is ' + this.remoteKey);
            });
      } else if (json.candidate) {
        this.addICE(json.candidate);
      } else {
        console.warn(this.eid + ': unexpected signal', msg);
      }
    }

    public setSignalHandler = (handler:(json:string)=>void) => {
      this.sendSignal_ = handler;
    }

    private createOffer_ = () : Promise<RTCSessionDescription> => {
      return new Promise<RTCSessionDescription>((F, R) => {
        this.pc.createOffer(
            (offer) => { F(offer) },
            () => { R(new Error('Failed to create PeerConnection offer.')); }
        )
      });
    }

    private createAnswer_ = () : Promise<RTCSessionDescription> => {
      return new Promise<RTCSessionDescription>((F, R) => {
        this.pc.createAnswer(F,
            () => { R(new Error('Failed to create PeerConnection offer.')); },
            sdpConstraints  // Important for audio/video xfer.
        )
      });
    }

    /**
     * Promise setting the local description to |offer|, and also fire a signal.
     * The application is responsible for passing this to the remote.
     */
    private setLocalDescription_ = (offer:RTCSessionDescription) => {
      return new Promise((F, R) => {
        this.pc.setLocalDescription(offer,
            () => {
              console.log(this.eid + ': set local desc. sending sig');
              this.sendSignal_(JSON.stringify({ sdp: offer }));
              F(offer);
            },
            () => {
              R(new Error('Failed to setLocalDescription.'));
            })
      });
    }

    /**
     * Promise for setting the remote description in response to receiving SDP
     * headers from other endpoint.
     */
    private receive_ = (offer:RTCSessionDescription) : Promise<RTCSessionDescription> => {
      return new Promise<void>((F, R) => {
        this.pc.setRemoteDescription(offer,
            () => { F(offer); },
            () => { R(new Error('Failed to setRemoteDescription.')); })
      });
    }

    /**
     * Prepare an offer for a peer connection.
     *
     * Returns a promise containing the local description, which should be sent
     * over *some* signalling channel to the remote Endpoint.
     */
    public offer = () : Promise<RTCSessionDescription> => {
      console.log(this.eid + ': creating offer...');
      return this.createOffer_().then(this.setLocalDescription_);
    }

    /**
     * Prepare an answer in response to an offer.
     *
     * Given an offer from a remote endpoint, receive it, and promise an answer
     * with own SDP headers, which should be sent back to the remote endpoint.
     */
    public answer = (offer:RTCSessionDescription)
        : Promise<RTCSessionDescription> => {
      return this.createAnswer_().then(this.setLocalDescription_);
    }

    public addICE = (candidate:RTCIceCandidate) => {
      // console.log(this.eid + ': adding ICE ' + candidate.candidate);
      this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }

  }  // class Endpoint


  // This regular expression captures the keyhash from the crypto sdp header.
  //
  // For example, given the below header:
  //  a=crypto:1 AES_CM_128_HMAC_SHA1_80
  //    inline:FZoIzaV2KYVbd1mO445wH9NNIcE3tbKz0X0AtEok

  // This will capture:
  //    'FZoIzaV2KYVbd1mO445wH9NNIcE3tbKz0X0AtEok'
  var SDP_CRYPTO_REGEX = /(?:a=crypto:1.*inline:)(.*)\s/m

  function extractCryptoKey(desc:RTCSessionDescription) : string {
    var sdp = desc.sdp;
    var captured = sdp.match(SDP_CRYPTO_REGEX);
    if (!captured || !captured[1]) {
      console.warn('SDP header does not contain crypto.');
      return null;
    }
    return captured[1];
  }

  /**
   * Represents an authentication session.
   */
  export class Session {
  }

}  // module SasRtc
