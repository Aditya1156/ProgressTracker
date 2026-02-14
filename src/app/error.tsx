"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh px-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/15 rounded-full blur-3xl animate-orb-1 pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-orb-2 pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 border-gray-200/80 shadow-sm rounded-3xl p-10 relative z-10">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-red-100/80 backdrop-blur-sm flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-800">
            Something went wrong
          </h1>
          <p className="text-gray-500">
            We encountered an unexpected error. Please try again or contact support if
            the problem persists.
          </p>
        </div>

        {error.digest && (
          <div className="p-3 glass rounded-md">
            <p className="text-xs text-gray-400 font-mono">
              Error ID: {error.digest}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => reset()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>

        <div className="pt-8 border-t border-white/20">
          <p className="text-xs text-gray-400">
            If this error continues, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
