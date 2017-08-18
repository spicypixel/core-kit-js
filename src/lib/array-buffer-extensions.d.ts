interface ArrayBuffer {
  toBase64(): string;
  toBinaryString(): string;
}

interface ArrayBufferConstructor {
  fromBase64(base64: string): ArrayBuffer;
  fromBinaryString(binaryString: string): ArrayBuffer;
}