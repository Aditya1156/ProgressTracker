import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department Performance skeleton */}
        <Card className="glass-card animate-fade-in animate-delay-400">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* At-Risk Students skeleton */}
        <Card className="glass-card animate-fade-in animate-delay-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <div className="text-right space-y-1.5">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                  {i < 4 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
