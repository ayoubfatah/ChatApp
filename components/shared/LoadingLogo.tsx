import Image from "next/image";

export default function LoadingLogo({ size = 100 }: { size?: number }) {
  return (
    <div className="h-full w-full flex justify-center items-center">
      <Image
        src="/logo.svg"
        alt="logo"
        width={size}
        height={size}
        className="animate-pulse duration-700"
      />
    </div>
  );
}
