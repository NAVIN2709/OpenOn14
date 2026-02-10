// Web Crypto API utilities for E2EE
// Using Hybrid Encryption: AES-GCM (for message) + RSA-OAEP (for AES key)
// This produces much smaller ciphertext than pure RSA

const RSA_ALGORITHM = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

const AES_ALGORITHM = "AES-GCM";
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

const PRIVATE_KEY_STORAGE_KEY = "valentine_private_key";

// ============ KEY GENERATION & MANAGEMENT ============

/**
 * Generate a new RSA key pair for E2EE
 */
export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    RSA_ALGORITHM,
    true, // extractable
    ["encrypt", "decrypt"],
  );
  return keyPair;
}

/**
 * Export public key to base64 string for storage in Firestore
 */
export async function exportPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(exported);
}

/**
 * Export private key to base64 string for localStorage
 */
export async function exportPrivateKey(privateKey) {
  const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import public key from base64 string
 */
export async function importPublicKey(base64Key) {
  const keyData = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    "spki",
    keyData,
    RSA_ALGORITHM,
    true,
    ["encrypt"],
  );
}

/**
 * Import private key from base64 string
 */
export async function importPrivateKey(base64Key) {
  const keyData = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    "pkcs8",
    keyData,
    RSA_ALGORITHM,
    true,
    ["decrypt"],
  );
}

/**
 * Ensure a private key exists. If not, generate a new pair and return the public key for syncing.
 * Returns { privateKey, publicKey, isNew }
 */
export async function ensureKeyPair() {
  if (hasPrivateKey()) {
    const stored = getStoredPrivateKey();
    try {
      const privateKey = await importPrivateKey(stored);
      return { privateKey, publicKey: null, isNew: false };
    } catch (e) {
      console.warn("Stored private key is invalid, regenerating...", e);
      // Fall through to generate new key
    }
  }

  const keyPair = await generateKeyPair();
  const privateKeyBase64 = await exportPrivateKey(keyPair.privateKey);
  const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);

  storePrivateKey(privateKeyBase64);

  return {
    privateKey: keyPair.privateKey,
    publicKey: publicKeyBase64,
    isNew: true,
  };
}

// ============ HYBRID ENCRYPTION ============

/**
 * Encrypt a message using hybrid encryption (AES-GCM + RSA-OAEP)
 *
 * Process:
 * 1. Generate random AES-256 key
 * 2. Generate random IV (12 bytes)
 * 3. Encrypt message with AES-GCM
 * 4. Encrypt AES key with recipient's RSA public key
 * 5. Combine: base64(encryptedAesKey) + "." + base64(iv + encryptedMessage)
 *
 * Output size: ~350 bytes overhead + message length
 */
export async function encryptMessage(publicKey, message) {
  // 1. Generate random AES key
  const aesKey = await window.crypto.subtle.generateKey(
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    true, // extractable (we need to encrypt it with RSA)
    ["encrypt"],
  );

  // 2. Generate random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // 3. Encrypt message with AES-GCM
  const encoder = new TextEncoder();
  const messageData = encoder.encode(message);

  const encryptedMessage = await window.crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv: iv },
    aesKey,
    messageData,
  );

  // 4. Export and encrypt AES key with RSA
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    rawAesKey,
  );

  // 5. Combine IV + encrypted message, then format as: encryptedKey.ivAndMessage
  const ivAndMessage = new Uint8Array(iv.length + encryptedMessage.byteLength);
  ivAndMessage.set(iv, 0);
  ivAndMessage.set(new Uint8Array(encryptedMessage), iv.length);

  const encryptedKeyBase64 = arrayBufferToBase64(encryptedAesKey);
  const ivAndMessageBase64 = arrayBufferToBase64(ivAndMessage.buffer);

  return `${encryptedKeyBase64}.${ivAndMessageBase64}`;
}

/**
 * Decrypt a message using hybrid decryption
 *
 * Process:
 * 1. Split the ciphertext into encrypted AES key and IV+message
 * 2. Decrypt AES key with private RSA key
 * 3. Extract IV and encrypted message
 * 4. Decrypt message with AES-GCM
 */
export async function decryptMessage(privateKey, ciphertext) {
  // 1. Split the ciphertext
  const [encryptedKeyBase64, ivAndMessageBase64] = ciphertext.split(".");

  if (!encryptedKeyBase64 || !ivAndMessageBase64) {
    throw new Error("Invalid ciphertext format");
  }

  const encryptedAesKey = base64ToArrayBuffer(encryptedKeyBase64);
  const ivAndMessage = new Uint8Array(base64ToArrayBuffer(ivAndMessageBase64));

  // 2. Decrypt AES key with RSA private key
  const rawAesKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedAesKey,
  );

  // Import the decrypted AES key
  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: AES_ALGORITHM },
    false,
    ["decrypt"],
  );

  // 3. Extract IV and encrypted message
  const iv = ivAndMessage.slice(0, IV_LENGTH);
  const encryptedMessage = ivAndMessage.slice(IV_LENGTH);

  // 4. Decrypt message with AES-GCM
  const decryptedData = await window.crypto.subtle.decrypt(
    { name: AES_ALGORITHM, iv: iv },
    aesKey,
    encryptedMessage,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

// ============ LOCAL STORAGE ============

/**
 * Store private key in localStorage
 */
export function storePrivateKey(base64PrivateKey) {
  localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, base64PrivateKey);
}

/**
 * Retrieve private key from localStorage
 */
export function getStoredPrivateKey() {
  return localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
}

/**
 * Check if user has a private key stored
 */
export function hasPrivateKey() {
  return !!localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
}

/**
 * Clear private key from localStorage
 */
export function clearPrivateKey() {
  localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
}

// ============ UTILITIES ============

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
