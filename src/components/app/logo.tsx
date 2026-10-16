import logoAsset from "@/assets/trawe-logo.png.asset.json";

export function Logo({ className = "h-8 w-auto", alt = "TraWe" }: { className?: string; alt?: string }) {
  return <img src={logoAsset.url} alt={alt} className={className} draggable={false} />;
}