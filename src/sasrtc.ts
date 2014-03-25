/// <reference path='interfaces/MediaStream.d.ts' />
/// <reference path='interfaces/promise.d.ts' />

// Type injections.
interface Window { URL :any; }
interface HTMLElement { src :string; }
interface mozRTCPeerConnection extends RTCPeerConnection {}

/**
 * Contains all of SAS-RTC functionality.
 * Only works on Chrome or Firefox.
 */
module SasRtc {

  var RTCPC = RTCPC || webkitRTCPeerConnection;  // || mozRTCPeerConnection;

  navigator.getUserMedia = navigator.getUserMedia ||
                           navigator.webkitGetUserMedia; // ||

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
  function mediaPromise() {
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
    console.log('Attaching stream', stream, ' to element ', $vid);
    $vid.src = window.URL.createObjectURL(stream);
  }

  /**
   * Represents an endpoint to communicate with.
   */
  export class Endpoint {

    public pc            :RTCPeerConnection;
    private sharedSecret :string;
    private $vid         :HTMLElement;
    private $vidRemote   :HTMLElement;
    public stream        :MediaStream;

    // To be sent over 'signalling channel' when new ICE candidates arrive.
    private iceHandler_  :(c:RTCIceCandidate)=>void;

    constructor(public eid:string) {
      this.pc = new RTCPC(null);
      this.pc.onaddstream = (ev:RTCMediaStreamEvent) => {
        console.log('stream event!');
        console.log(ev.stream);
        attachMedia(this.$vidRemote, ev.stream);
      }

      this.pc.onnegotiationneeded = (e:Event) => {
        console.log(this.eid + ': negotiation needed...');
      }

      this.pc.onicecandidate = (e:RTCIceCandidateEvent) => {
        var candidate = e.candidate;
        console.log(eid + ': onicecandidate', e);
        if (null !== candidate) {
          this.iceHandler_(candidate);
        }
      }
    }

    public initializeMedia = (
        vidId:string, remoteVidId:string) => {
      this.$vid = document.getElementById(vidId);
      this.$vidRemote = document.getElementById(remoteVidId);
      if (!this.$vid) {
        console.error('No DOM video element: ' + vidId);
        return;
      }
      mediaPromise()
          .then((stream:MediaStream) => {
            this.stream = stream;
            attachMedia(this.$vid, stream);
            // console.log(stream);
            // var video = stream.getVideoTracks();
            // var audio = stream.getAudioTracks();
            console.log('adding mediastream to peerconnection');
            this.pc.addStream(stream);
          })
          .catch((e) => {
            // TODO: Fallback to a 'real-time canvas drawing method.'
            console.error('Failed to initialize media.', e);
          });
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
        this.pc.createAnswer(
            (answer) => { F(answer) },
            () => { R(new Error('Failed to create PeerConnection offer.')); },
            sdpConstraints  // Important for audio/video xfer.
        )
      });
    }

    private setLocalDescription_ = (offer:RTCSessionDescription) => {
      return new Promise((F, R) => {
        this.pc.setLocalDescription(offer,
            () => { F(offer) },
            () => { R(new Error('Failed to setLocalDescription.')); })
      });
    }

    /**
     * Promise for receiving SDP headers as the remote description.
     */
    public receive = (offer:RTCSessionDescription) : Promise<void> => {
      return new Promise<void>((F, R) => {
        console.log(this.eid + ': received ', offer);
        this.pc.setRemoteDescription(offer, F,
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
      // var config = {
        // iceServers: [{ 'url':
      // };
      // var con = new webkitRTCPeerConnection();
    }

    /**
     * Given an offer from a remote endpoint, receive it, and promise an answer
     * with own SDP headers, which should be sent back to the remote endpoint.
     */
    public answer = (offer:RTCSessionDescription)
        : Promise<RTCSessionDescription> => {
      return this.receive(offer)
          .then(this.createAnswer_)
          .then(this.setLocalDescription_);
    }

    public addICE = (candidate:RTCIceCandidate) => {
      console.log(this.eid + ': add ICE candidate ', candidate.candidate);
      // this.pc.addIceCandidate(candidate);
      this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      // () => {
      // new RTCIceCandidate(candidate), () => {
        // console.log('success!');
      // }, () => { console.log('faiiilll.'); });
    }

    public setICE = (f) => {
      this.iceHandler_ = f;
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
