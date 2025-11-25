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
import { Play, Trash2, CheckCircle2, XCircle, Clock, Loader2, ChevronDown, ChevronRight, Calendar, Bell } from "lucide-react";
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
          <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Passed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-50 text-red-700 border-0 text-xs">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case "RUNNING":
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-0 text-xs">
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
        <span className="text-xs text-slate-400">Never run</span>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">
          {formatDistanceToNow(new Date(test.lastRunAt), { addSuffix: true })}
        </span>
        {getStatusBadge(test.lastRunStatus)}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-slate-900">
            Saved Test Library
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Loading your automated test cases...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900">Fetching tests...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tests.length === 0) {
    return (
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-slate-900">
            Saved Test Library
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Your automated test collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              No Saved Tests Yet
            </h3>
            <p className="text-sm text-slate-500 max-w-md leading-relaxed">
              Create your first test above and it will automatically be saved here for future runs and scheduling.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Saved Test Library
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 mt-1">
              {tests.length} automated test{tests.length === 1 ? "" : "s"} ready to run
            </CardDescription>
          </div>
          <Badge className="bg-slate-100 text-slate-700 border-0 px-3 py-1 text-sm font-medium">
            {tests.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {tests.map((test) => {
            const isExpanded = expandedTestId === test.id;
            return (
              <div
                key={test.id}
                className="group rounded-lg border border-slate-200 overflow-hidden transition-all hover:border-slate-300 bg-white"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-all"
                  onClick={() => toggleExpand(test.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <div className="p-1.5 bg-slate-100 rounded transition-all">
                          <ChevronDown className="h-4 w-4 text-slate-600" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-slate-100 rounded transition-all">
                          <ChevronRight className="h-4 w-4 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="font-semibold text-sm text-slate-900 truncate">
                          {test.name}
                        </h4>
                        {test.isScheduled && (
                          <Badge className="bg-indigo-50 text-indigo-700 border-0 gap-1.5 text-xs font-medium">
                            <Clock className="h-3 w-3" />
                            Every {test.scheduleInterval === "15m" ? "15 min" :
                                  test.scheduleInterval === "30m" ? "30 min" :
                                  test.scheduleInterval === "1h" ? "1 hr" :
                                  test.scheduleInterval === "6h" ? "6 hrs" :
                                  test.scheduleInterval === "12h" ? "12 hrs" : "24 hrs"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {test.url}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Last run:</span>
                        {getLastRunText(test)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-6" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      onClick={() => onRunTest(test)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Run
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteTest(test.id)}
                      className="text-slate-600 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Test URL
                        </h5>
                        <p className="text-xs text-slate-600 break-all bg-white p-2.5 rounded border border-slate-200">
                          {test.url}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <h5 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Expected Outcome
                        </h5>
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                          {test.desiredOutcome}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h5 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Test Instructions
                      </h5>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap bg-white p-3 rounded border border-slate-200 leading-relaxed">
                        {test.instructions}
                      </p>
                    </div>

                    {test.slackWebhookUrl && (
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Slack Notifications
                        </h5>
                        <div className="flex items-center gap-2 bg-white p-2.5 rounded border border-slate-200">
                          <Badge className="bg-slate-100 text-slate-700 border-0 text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            Enabled
                          </Badge>
                          <span className="text-xs text-slate-500 truncate">
                            {test.slackWebhookUrl.substring(0, 50)}...
                          </span>
                        </div>
                      </div>
                    )}

                    {test.lastRunScreenshot && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                            Last Run Screenshot
                          </h5>
                          <Badge className="bg-slate-100 text-slate-700 border-0 text-xs">
                            Latest
                          </Badge>
                        </div>
                        <div className="rounded border border-slate-200 bg-white overflow-hidden">
                          <img
                            src={test.lastRunScreenshot}
                            alt="Last test run screenshot"
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    )}
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
