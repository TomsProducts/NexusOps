"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="card-glass p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 mx-auto mb-4 border border-cyberCyan/60 rounded-xl flex items-center justify-center text-cyberCyan shadow-[0_0_20px_rgba(25,217,255,0.2)] font-black text-xl">
          NX
        </div>
        <h1 className="text-xl font-bold tracking-wider mb-2">NEXUSOPS</h1>
        <p className="text-xs text-[#71839e] mb-6">Redirecting to operations console...</p>
        <div className="w-6 h-6 border-2 border-cyberCyan border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
