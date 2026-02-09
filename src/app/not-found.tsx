import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold text-slate-900">404</h1>
          <h2 className="text-2xl font-semibold text-slate-700">Page Not Found</h2>
          <p className="text-slate-600">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>

        <div className="pt-8 border-t">
          <p className="text-xs text-muted-foreground">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
