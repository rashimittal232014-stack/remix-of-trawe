import { authorizeUpload } from "./plan.functions";

/** Shared preflight for every tenant file upload. */
export async function assertUploadAllowed(file: File) {
  return authorizeUpload({ data: { bytes: file.size } });
}