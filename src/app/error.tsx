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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Something went wrong
          </h1>
          <p className="text-slate-600">
            We encountered an unexpected error. Please try again or contact support if
            the problem persists.
          </p>
        </div>

        {error.digest && (
          <div className="p-3 bg-slate-100 rounded-md">
            <p className="text-xs text-muted-foreground font-mono">
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

        <div className="pt-8 border-t">
          <p className="text-xs text-muted-foreground">
            If this error continues, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
