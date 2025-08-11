// stockfish-worker.js
importScripts('stockfish.wasm.js'); // this loads the WASM version

// The imported file exposes `Module` and `onmessage` is already handled
// We just forward messages from the main thread

const engine = STOCKFISH(); // this is created by wasm.js

engine.onmessage = (e) => {
  postMessage(e.data); // send response back to main thread
};

onmessage = (e) => {
  engine.postMessage(e.data); // forward command to stockfish
};
