"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function WorkspaceCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-3 border-t">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-20" />
      </CardFooter>
    </Card>
  );
}

export function WorkspaceGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <WorkspaceCardSkeleton key={i} />
      ))}
    </div>
  );
}
