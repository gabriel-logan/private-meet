import "./src/utils/i18n";

type TrackLike = {
  kind?: string;
  enabled?: boolean;
  label?: string;
  stop?: () => void;
  getSettings?: () => MediaTrackSettings;
};

class MockMediaStream {
  private tracks: TrackLike[];

  constructor(tracks: TrackLike[] = []) {
    this.tracks = [...tracks];
  }

  getTracks(): TrackLike[] {
    return [...this.tracks];
  }

  getAudioTracks(): TrackLike[] {
    return this.tracks.filter((t) => t.kind === "audio");
  }

  getVideoTracks(): TrackLike[] {
    return this.tracks.filter((t) => t.kind === "video");
  }

  addTrack(track: TrackLike) {
    this.tracks.push(track);
  }

  removeTrack(track: TrackLike) {
    this.tracks = this.tracks.filter((t) => t !== track);
  }
}

function defineGlobal(name: string, value: unknown) {
  const g = globalThis as unknown as Record<string, unknown>;

  if (g[name] !== undefined) {
    return;
  }

  Object.defineProperty(globalThis, name, {
    value,
    writable: true,
    configurable: true,
  });
}

defineGlobal("MediaStream", MockMediaStream);

if (typeof Element !== "undefined") {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {
      // JSDOM doesn't implement scrolling; noop for tests.
    };
  }
}
