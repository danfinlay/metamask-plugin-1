export const globals = {
  console, // Adding console for now for logging purposes.

  alert,
  prompt,
  confirm,

  BigInt,
  crypto,
  SubtleCrypto,
  fetch,
  XMLHttpRequest,
  WebSocket,
  Buffer,
  Date,

  // Timers. TODO: Must constrain or remove for untrusted modules
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,

  // Typed Arrays:
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  BigInt64Array,
  BigUint64Array,

  // Other ethers.js requirements:
  MessageChannel,
  atob,
  btoa,
}
