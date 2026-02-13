import { E2EE_WIRE_PREFIX } from "@env";

import { maxMessageChars } from "../constants";

// AES-GCM standard IV length
export const ivBytes = 12;
// PBKDF2 work factor (tune based on target devices)
export const pbkdf2Iterations = 200000;
// Salt derived from room id hash
export const saltBytes = 16;
// Helps avoid sending messages that will exceed server limits after encoding.
// (Rough guard; final size depends on base64 and envelope overhead.)
export const maxWireCharsDefault = 5000;

export const wirePrefix = E2EE_WIRE_PREFIX;

export type AesGcmAlg = "AES-GCM";

export type E2EEEnvelopeV1 = {
  v: 1;
  alg: AesGcmAlg;
  iv: string;
  content: string;
};

// MOCK IMPLEMENTATION: In a real implementation, this would be replaced with actual encryption logic.
