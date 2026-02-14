import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen gradient-mesh">
      <div className="flex flex-col items-center gap-3 border-gray-200/80 shadow-sm rounded-2xl px-10 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
