"use strict";

class StreamManager {
  constructor() {
    this.streams = new Set();
  }

  add(stream) {
    this.streams.add(stream);
  }

  remove(stream) {
    this.streams.delete(stream);
  }

  publish(event, payload, matcher = () => true) {
    for (const stream of this.streams) {
      if (stream.closed || stream.res.destroyed || !matcher(stream)) continue;
      stream.res.write(`event: ${event}\\ndata: ${JSON.stringify(payload)}\\n\\n`);
    }
  }

  closeAll() {
    for (const stream of this.streams) {
      try { stream.res.end(); } catch {}
      stream.closed = true;
    }
    this.streams.clear();
  }

  get size() {
    return this.streams.size;
  }
}

module.exports = { StreamManager };
