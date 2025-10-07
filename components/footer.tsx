import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto max-w-4xl text-center mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 dark:border-neutral-700 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-4">
              <Link 
                href="/privacy" 
                className="text-sm text-gray-600 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="text-sm text-gray-600 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white transition-colors"
              >
                Terms of Use
              </Link>
            </div>
            <p className="text-xs text-gray-500 dark:text-neutral-600">
              © 2025 Next Video Gen. All rights reserved.
            </p>
          </div>
        </footer>
  );
}