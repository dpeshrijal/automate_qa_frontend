"use client";

import { TestDefinition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Play, Trash2, CheckCircle2, XCircle, Clock, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface SavedTestsTableProps {
  tests: TestDefinition[];
  onRunTest: (test: TestDefinition) => void;
  onDeleteTest: (testId: string) => void;
  isLoading?: boolean;
}

export function SavedTestsTable({
  tests,
  onRunTest,
  onDeleteTest,
  isLoading = false,
}: SavedTestsTableProps) {
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const toggleExpand = (testId: string) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
  };
  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Passed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case "RUNNING":
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Running
          </Badge>
        );
      default:
        return null;
    }
  };

  const getLastRunText = (test: TestDefinition) => {
    if (!test.lastRunAt) {
      return (
        <span className="text-sm text-muted-foreground">Never run</span>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(test.lastRunAt), { addSuffix: true })}
        </span>
        {getStatusBadge(test.lastRunStatus)}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Tests</CardTitle>
          <CardDescription>Loading your saved test cases...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Tests</CardTitle>
          <CardDescription>
            Save your test cases to run them again later
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No saved tests yet. Create a test above and click "Save Test" to
              get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Tests</CardTitle>
        <CardDescription>
          {tests.length} saved test {tests.length === 1 ? "case" : "cases"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tests.map((test) => {
            const isExpanded = expandedTestId === test.id;
            return (
              <div
                key={test.id}
                className="rounded-lg border overflow-hidden transition-colors"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleExpand(test.id)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{test.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {test.url}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Last run:</span>
                        {getLastRunText(test)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      onClick={() => onRunTest(test)}
                      className="gap-1"
                    >
                      <Play className="h-4 w-4" />
                      Run
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteTest(test.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t bg-muted/30 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <h5 className="text-sm font-semibold mb-1 text-muted-foreground">URL</h5>
                      <p className="text-sm break-all">{test.url}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold mb-1 text-muted-foreground">Instructions</h5>
                      <p className="text-sm whitespace-pre-wrap">{test.instructions}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold mb-1 text-muted-foreground">Desired Outcome</h5>
                      <p className="text-sm whitespace-pre-wrap">{test.desiredOutcome}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
