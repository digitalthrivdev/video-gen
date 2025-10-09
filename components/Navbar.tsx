import { VideoIcon } from "lucide-react";
import Link from "next/link";
import { UserInfoBadge } from "./auth/user-info";
import { AuthButton } from "./auth/auth-button";

export function Navbar() {
  return (
    <div className="fixed top-0 inset-x-0 z-50 border-b bg-white/70 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-left">
            <VideoIcon className="h-5 w-5" />
            <span className="text-lg font-semibold">Vimeo AI</span>
          </Link>
          {/* Right: user info + auth */}
          <div className="flex items-center gap-4">
            <Link href="/video" className="text-sm text-gray-600 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white">
              Generate Video
            </Link>
            <Link href="/images" className="text-sm text-gray-600 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white">
              Generate Images
            </Link>
            <Link href="/videos" className="text-sm text-gray-600 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white">
              My Videos
            </Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white">
              Pricing
            </Link>
            <UserInfoBadge />
            <AuthButton />
          </div>
        </div>
      </div>
  );
}
