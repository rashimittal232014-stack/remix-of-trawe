import { ImagePicker } from "./image-picker";

/** Single-image variant of ImagePicker that binds a plain URL string. */
export function SingleImagePicker({
  value,
  onChange,
  bucket = "masters-media",
  folder = "images",
}: {
  value?: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
}) {
  return (
    <ImagePicker
      value={value ? [value] : []}
      onChange={(arr) => onChange(arr[arr.length - 1] ?? "")}
      bucket={bucket}
      folder={folder}
      max={1}
    />
  );
}