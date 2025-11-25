"use client";

import { useState, useEffect } from "react";
import {
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  Sparkles,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SavedTestsTable } from "@/components/SavedTestsTable";
import { TestDefinition } from "@/lib/types";
import { signOut } from "next-auth/react";

interface TestHistoryStep {
  message: string;
  status: "success" | "failed" | "pending";
}

interface HomeClientProps {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export default function HomeClient({ user }: HomeClientProps) {
  const [url, setUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [outcome, setOutcome] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // Mock live steps for visualization (Real app would stream this)
  const [liveSteps, setLiveSteps] = useState<TestHistoryStep[]>([]);

  // Saved tests state
  const [savedTests, setSavedTests] = useState<TestDefinition[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [currentTestDefinitionId, setCurrentTestDefinitionId] = useState<
    string | undefined
  >();

  // Screenshot display state
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);

  // Scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleInterval, setScheduleInterval] = useState<"15m" | "30m" | "1h" | "6h" | "12h" | "24h">("1h");

  // Slack integration state
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");

  const handleRunTest = async () => {
    if (!url || !instructions) return;

    setLoading(true);
    setResult(null);
    setError("");
    setCurrentScreenshot(null); // Clear previous screenshot
    setLiveSteps([{ message: "Initializing Agent...", status: "pending" }]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("API URL not configured");

      const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;

      // Save test only if we don't have currentTestDefinitionId
      // This prevents duplicates when running existing tests
      let savedTestId = currentTestDefinitionId;
      if (!savedTestId) {
        try {
          // Generate default name, handling URLs without protocol
          let defaultName = "New Test";
          try {
            const urlObj = new URL(url);
            defaultName = `Test for ${urlObj.hostname}`;
          } catch {
            // If URL is invalid (e.g., missing protocol), use the raw URL
            defaultName = `Test for ${url}`;
          }

          const saveResponse = await fetch(`${baseUrl}/test-definitions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-Id": user.id,
            },
            body: JSON.stringify({
              name: defaultName,
              url,
              instructions,
              desiredOutcome: outcome,
              isScheduled,
              scheduleInterval: isScheduled ? scheduleInterval : undefined,
              slackWebhookUrl: slackWebhookUrl || undefined,
            }),
          });

          if (saveResponse.ok) {
            const { testDefinition } = await saveResponse.json();
            savedTestId = testDefinition.id;
            setCurrentTestDefinitionId(savedTestId);
            // Refresh saved tests list in background
            fetchSavedTests();
          }
        } catch (err) {
          console.error("Failed to save test:", err);
          // Continue with test run even if save fails
        }
      }

      const startResponse = await fetch(`${baseUrl}/tests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id,
        },
        body: JSON.stringify({
          url,
          instructions,
          outcome,
          testDefinitionId: savedTestId, // Link to saved test
        }),
      });

      if (!startResponse.ok) {
        const err = await startResponse.json();
        throw new Error(err.error || "Failed to start test");
      }

      const { testId } = await startResponse.json();

      // Poll for Status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${baseUrl}/tests/${testId}`, {
            headers: {
              "X-User-Id": user.id,
            },
          });
          const statusData = await statusResponse.json();

          // Update screenshot if available (even during execution)
          if (statusData.screenshot) {
            setCurrentScreenshot(statusData.screenshot);
          }

          // Update live feed from backend history if available
          if (statusData.history && Array.isArray(statusData.history)) {
            const formattedSteps = statusData.history.map((h: string) => ({
              message: h,
              status: h.toLowerCase().includes("failed") ? "failed" : "success",
            }));
            setLiveSteps(formattedSteps);
          } else {
            setLiveSteps((prev) => [
              ...prev,
              { message: "Agent is thinking...", status: "pending" },
            ]);
          }

          if (statusData.status === "COMPLETED") {
            clearInterval(pollInterval);
            setResult({
              message: statusData.result,
              screenshot: statusData.screenshot,
            });
            setLoading(false);
            // Refresh saved tests to show updated status
            fetchSavedTests();
            // Clear form for next test
            setUrl("");
            setInstructions("");
            setOutcome("");
            setIsScheduled(false);
            setScheduleInterval("1h");
            setSlackWebhookUrl("");
            setCurrentTestDefinitionId(undefined);
          } else if (statusData.status === "FAILED") {
            clearInterval(pollInterval);
            setError(statusData.error || "Test failed");
            setLoading(false);
            // Refresh saved tests to show updated status
            fetchSavedTests();
            // Clear form for next test
            setUrl("");
            setInstructions("");
            setOutcome("");
            setIsScheduled(false);
            setScheduleInterval("1h");
            setSlackWebhookUrl("");
            setCurrentTestDefinitionId(undefined);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch saved tests on component mount
  useEffect(() => {
    fetchSavedTests();
  }, []);

  const fetchSavedTests = async () => {
    try {
      setLoadingTests(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) return;

      const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
      const response = await fetch(`${baseUrl}/test-definitions`, {
        headers: {
          "X-User-Id": user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedTests(data.testDefinitions || []);
      }
    } catch (err) {
      console.error("Failed to fetch saved tests:", err);
    } finally {
      setLoadingTests(false);
    }
  };

  const handleRunSavedTest = async (test: TestDefinition) => {
    // Set the current test ID to prevent duplicates
    setCurrentTestDefinitionId(test.id);

    // Load the test data
    setUrl(test.url);
    setInstructions(test.instructions);
    setOutcome(test.desiredOutcome);

    // Clear previous results
    setResult(null);
    setError("");
    setCurrentScreenshot(null); // Clear previous screenshot

    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Run the test immediately with the existing test ID
    setLoading(true);
    setLiveSteps([{ message: "Initializing Agent...", status: "pending" }]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("API URL not configured");

      const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;

      // Start the test run with the existing test ID
      const startResponse = await fetch(`${baseUrl}/tests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id,
        },
        body: JSON.stringify({
          url: test.url,
          instructions: test.instructions,
          outcome: test.desiredOutcome,
          testDefinitionId: test.id, // Link to existing test
        }),
      });

      if (!startResponse.ok) {
        const err = await startResponse.json();
        throw new Error(err.error || "Failed to start test");
      }

      const { testId } = await startResponse.json();

      // Poll for Status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${baseUrl}/tests/${testId}`, {
            headers: {
              "X-User-Id": user.id,
            },
          });
          const statusData = await statusResponse.json();

          // Update screenshot if available (even during execution)
          if (statusData.screenshot) {
            setCurrentScreenshot(statusData.screenshot);
          }

          // Update live feed from backend history if available
          if (statusData.history && Array.isArray(statusData.history)) {
            const formattedSteps = statusData.history.map((h: string) => ({
              message: h,
              status: h.toLowerCase().includes("failed") ? "failed" : "success",
            }));
            setLiveSteps(formattedSteps);
          } else {
            setLiveSteps((prev) => [
              ...prev,
              { message: "Agent is thinking...", status: "pending" },
            ]);
          }

          if (statusData.status === "COMPLETED") {
            clearInterval(pollInterval);
            setResult({
              message: statusData.result,
              screenshot: statusData.screenshot,
            });
            setLoading(false);
            fetchSavedTests();
            // Clear form for next test
            setUrl("");
            setInstructions("");
            setOutcome("");
            setIsScheduled(false);
            setScheduleInterval("1h");
            setSlackWebhookUrl("");
            setCurrentTestDefinitionId(undefined);
          } else if (statusData.status === "FAILED") {
            clearInterval(pollInterval);
            setError(statusData.error || "Test failed");
            setLoading(false);
            fetchSavedTests();
            // Clear form for next test
            setUrl("");
            setInstructions("");
            setOutcome("");
            setIsScheduled(false);
            setScheduleInterval("1h");
            setSlackWebhookUrl("");
            setCurrentTestDefinitionId(undefined);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test?")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) return;

      const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
      const response = await fetch(`${baseUrl}/test-definitions/${testId}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": user.id,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete test");
      }

      // Clear currentTestDefinitionId if we deleted the current test
      setCurrentTestDefinitionId(undefined);

      // Refresh the list immediately
      await fetchSavedTests();
    } catch (err) {
      console.error("Failed to delete test:", err);
      alert("Failed to delete test");
    }
  };


  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/signin" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-base text-slate-900">
              AutomateQA.ai
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden md:block">{user.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-slate-600 hover:text-slate-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COL: CONFIGURATION (5 cols) */}
          <div className="lg:col-span-5">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Test Configuration
                </CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  Define test parameters in natural language
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-medium text-slate-700">
                    Target URL
                  </Label>
                  <Input
                    id="url"
                    placeholder="https://app.example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions" className="text-sm font-medium text-slate-700">
                    Test Instructions
                  </Label>
                  <Textarea
                    id="instructions"
                    placeholder="Describe what the AI agent should do..."
                    className="min-h-[120px] resize-none"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outcome" className="text-sm font-medium text-slate-700">
                    Expected Outcome
                  </Label>
                  <Input
                    id="outcome"
                    placeholder="What should the agent verify?"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="h-10"
                  />
                </div>

                <Separator className="my-4" />

                {/* Scheduling Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="schedule-toggle" className="text-sm font-medium text-slate-700">
                        Schedule Test
                      </Label>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Run automatically at regular intervals
                      </p>
                    </div>
                    <Switch
                      id="schedule-toggle"
                      checked={isScheduled}
                      onCheckedChange={setIsScheduled}
                    />
                  </div>

                  {isScheduled && (
                    <div className="space-y-2 pl-4 border-l-2 border-indigo-200">
                      <Label htmlFor="interval" className="text-sm font-medium text-slate-700">
                        Frequency
                      </Label>
                      <Select
                        value={scheduleInterval}
                        onValueChange={(value: any) => setScheduleInterval(value)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15m">Every 15 minutes</SelectItem>
                          <SelectItem value="30m">Every 30 minutes</SelectItem>
                          <SelectItem value="1h">Every hour</SelectItem>
                          <SelectItem value="6h">Every 6 hours</SelectItem>
                          <SelectItem value="12h">Every 12 hours</SelectItem>
                          <SelectItem value="24h">Daily</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Slack Integration Section */}
                <div className="space-y-2">
                  <Label htmlFor="slack-webhook" className="text-sm font-medium text-slate-700">
                    Slack Webhook (Optional)
                  </Label>
                  <Input
                    id="slack-webhook"
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackWebhookUrl}
                    onChange={(e) => setSlackWebhookUrl(e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-slate-500">
                    Get notified when tests complete
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-4 pb-6 px-6">
                <Button
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                  onClick={handleRunTest}
                  disabled={loading || !url || !instructions}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Test...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Test
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

          </div>

          {/* RIGHT COL: EXECUTION & RESULTS (7 cols) */}
          <div className="lg:col-span-7">
            {/* ERROR STATE */}
            {error && (
              <Card className="border border-red-200 bg-white shadow-sm h-[800px] flex items-center justify-center">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-slate-900 mb-1">
                        Test Failed
                      </h3>
                      <p className="text-sm text-slate-600">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* EMPTY STATE */}
            {!loading && !result && !error && (
              <Card className="border border-slate-200 bg-white shadow-sm h-[800px] flex items-center justify-center">
                <div className="p-12 w-full">
                  {currentScreenshot ? (
                    <div className="w-full max-w-4xl mx-auto">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-sm text-slate-900">Previous Test</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Last execution result</p>
                        </div>
                      </div>
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <img
                          src={currentScreenshot}
                          alt="Test screenshot"
                          className="w-full h-auto max-h-[600px] object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                        <LayoutDashboard className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        No Tests Running
                      </h3>
                      <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        Configure your test on the left and click "Start Test" to begin
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* LOADING STATE */}
            {loading && (
              <Card className="border border-slate-200 bg-white shadow-sm h-[800px] flex flex-col overflow-hidden">
                {/* Screenshot Display */}
                {currentScreenshot ? (
                  <div className="border-b border-slate-200 flex-shrink-0">
                    <img
                      src={currentScreenshot}
                      alt="Live test execution"
                      className="w-full h-auto max-h-[400px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center bg-slate-50 border-b border-slate-200 flex-shrink-0">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
                      <p className="text-sm font-medium text-slate-900">Launching browser...</p>
                      <p className="text-xs text-slate-500 mt-1">Test execution starting</p>
                    </div>
                  </div>
                )}

                {/* Execution Steps - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        <span className="text-sm font-semibold text-slate-900">Running Test</span>
                      </div>
                      <Badge className="bg-indigo-50 text-indigo-700 border-0 text-xs">
                        In Progress
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {liveSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {step.status === "success" ? (
                              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              </div>
                            ) : step.status === "failed" ? (
                              <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="w-3 h-3 text-red-600" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700">{step.message}</p>
                            <span className="text-xs text-slate-400">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* RESULT STATE */}
            {result && (
              <Card className="border border-slate-200 bg-white shadow-sm h-[800px] flex flex-col overflow-hidden">
                {/* Success Header */}
                <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Test Passed</h3>
                        <p className="text-xs text-slate-600">All steps completed successfully</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                      Success
                    </Badge>
                  </div>
                </div>

                {/* Screenshot */}
                {result.screenshot ? (
                  <div className="border-b border-slate-200 flex-shrink-0">
                    <img
                      src={result.screenshot}
                      alt="Test Result"
                      className="w-full h-auto max-h-[400px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center bg-slate-50 border-b border-slate-200 flex-shrink-0">
                    <div className="text-center">
                      <Globe className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm text-slate-500">No screenshot available</p>
                    </div>
                  </div>
                )}

                {/* Result Details - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-3">
                      Test Result
                    </h4>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <p className="text-sm text-slate-700 leading-relaxed">{result.message}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Saved Tests Section */}
        <div className="mt-12">
          <SavedTestsTable
            tests={savedTests}
            onRunTest={handleRunSavedTest}
            onDeleteTest={handleDeleteTest}
            isLoading={loadingTests}
          />
        </div>
      </main>
    </div>
  );
}
