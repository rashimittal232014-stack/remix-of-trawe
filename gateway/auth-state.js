/**
 * Encrypted-at-rest auth state for Baileys.
 *
 * Drop-in replacement for `useMultiFileAuthState`, except every file written to
 * disk is AES-256-GCM encrypted with a key derived from TRAWE_WA_ENC_KEY (or the
 * gateway token). If the disk is ever copied, the session files are useless
 * without the key.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { initAuthCreds, BufferJSON, proto } from "@whiskeysockets/baileys";

const SALT = "trawe-wa-session-v1";

function keyFrom(secret) {
  return scryptSync(String(secret), SALT, 32);
}

function encrypt(key, plaintext) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

function decrypt(key, buf) {
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}

const safeName = (name) => String(name).replace(/[^a-zA-Z0-9._-]/g, "_");

export async function useEncryptedAuthState(folder, secret) {
  const key = keyFrom(secret);
  mkdirSync(folder, { recursive: true });

  const fileFor = (name) => join(folder, `${safeName(name)}.enc`);

  const readData = (name) => {
    const file = fileFor(name);
    if (!existsSync(file)) return null;
    try {
      return JSON.parse(decrypt(key, readFileSync(file)), BufferJSON.reviver);
    } catch {
      return null;
    }
  };

  const writeData = (name, data) => {
    writeFileSync(fileFor(name), encrypt(key, JSON.stringify(data, BufferJSON.replacer)));
  };

  const removeData = (name) => {
    try { unlinkSync(fileFor(name)); } catch { /* ignore */ }
  };

  const creds = readData("creds") || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const out = {};
          for (const id of ids) {
            let value = readData(`${type}-${id}`);
            if (type === "app-state-sync-key" && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            if (value) out[id] = value;
          }
          return out;
        },
        set: async (data) => {
          for (const type of Object.keys(data)) {
            for (const id of Object.keys(data[type])) {
              const value = data[type][id];
              if (value) writeData(`${type}-${id}`, value);
              else removeData(`${type}-${id}`);
            }
          }
        },
      },
    },
    saveCreds: async () => writeData("creds", creds),
    hasSession: () => existsSync(fileFor("creds")),
  };
}

export const credsFileExists = (folder) => existsSync(join(folder, "creds.enc"));
