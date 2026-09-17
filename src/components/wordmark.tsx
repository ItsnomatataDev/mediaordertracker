import Image from "next/image";

export function Wordmark({
  className = "h-10 w-auto",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      alt="IT's No Matata — making IT problem free"
      width={512}
      height={512}
      className={className}
      priority={priority}
    />
  );
}
