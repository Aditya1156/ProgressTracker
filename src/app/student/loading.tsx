import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header skeleton with avatar */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="glass-card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Results Card */}
      <Card className="glass-card animate-fade-in animate-delay-300">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subject Performance Card */}
      <Card className="glass-card animate-fade-in animate-delay-400">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
