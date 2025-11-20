"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  Sparkles,
  Terminal,
  Target,
  ChevronRight,
  LayoutDashboard,
  History,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BrowserFrame } from "@/components/BrowserFrame";

interface TestHistoryStep {
  message: string;
  status: "success" | "failed" | "pending";
}

export default function Home() {
  const [url, setUrl] = useState("https://resumi.cv");
  const [instructions, setInstructions] = useState("Go to sign in page");
  const [outcome, setOutcome] = useState("User is redirected to login");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // Mock live steps for visualization (Real app would stream this)
  const [liveSteps, setLiveSteps] = useState<TestHistoryStep[]>([]);

  const handleRunTest = async () => {
    if (!url || !instructions) return;

    setLoading(true);
    setResult(null);
    setError("");
    setLiveSteps([{ message: "Initializing Agent...", status: "pending" }]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("API URL not configured");

      const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;

      const startResponse = await fetch(`${baseUrl}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, instructions, outcome }),
      });

      if (!startResponse.ok) {
        const err = await startResponse.json();
        throw new Error(err.error || "Failed to start test");
      }

      const { testId } = await startResponse.json();

      // Poll for Status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${baseUrl}/tests/${testId}`);
          const statusData = await statusResponse.json();

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
          } else if (statusData.status === "FAILED") {
            clearInterval(pollInterval);
            setError(statusData.error || "Test failed");
            setLoading(false);
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              FlowTest<span className="text-blue-600">.ai</span>
            </span>
            <Badge
              variant="secondary"
              className="ml-2 bg-slate-100 text-slate-600 border-slate-200"
            >
              MVP
            </Badge>
          </div>
          <div className="flex gap-4 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">
              Documentation
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              History
            </a>
            <div className="w-px h-4 bg-slate-300 my-auto"></div>
            <span className="text-slate-400">Deepesh Rijal</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Automated Quality Assurance
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            Describe your test case in natural language. Our AI Agent will
            navigate, interact, and verify your application logic automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COL: CONFIGURATION (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LayoutDashboard className="w-5 h-5 text-blue-600" />
                  Test Configuration
                </CardTitle>
                <CardDescription>
                  Define the parameters for your E2E test.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="url"
                    className="text-slate-700 font-semibold flex items-center gap-1.5"
                  >
                    <Globe className="w-4 h-4" /> Target URL
                  </Label>
                  <Input
                    id="url"
                    placeholder="https://app.example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="instructions"
                    className="text-slate-700 font-semibold flex items-center gap-1.5"
                  >
                    <Terminal className="w-4 h-4" /> Instructions
                  </Label>
                  <Textarea
                    id="instructions"
                    placeholder="e.g. Log in with user 'demo' and password '123', then navigate to settings."
                    className="min-h-[120px] bg-slate-50 border-slate-200 focus:bg-white resize-none leading-relaxed transition-all"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="outcome"
                    className="text-slate-700 font-semibold flex items-center gap-1.5"
                  >
                    <Target className="w-4 h-4" /> Desired Outcome
                  </Label>
                  <Input
                    id="outcome"
                    placeholder="e.g. The 'Dashboard' header should be visible."
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-6">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 h-11 text-base font-medium transition-all active:scale-95"
                  onClick={handleRunTest}
                  disabled={loading || !url || !instructions}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Agent Running...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5 fill-white/20" />
                      Start Test Run
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Helper Tips */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                Pro Tips
              </h4>
              <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                <li>Be specific about button names (e.g., "Click 'Save'").</li>
                <li>Mentions credentials clearly in the instructions.</li>
                <li>Ensure the Outcome describes a visible text change.</li>
              </ul>
            </div>
          </div>

          {/* RIGHT COL: EXECUTION & RESULTS (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* ERROR STATE */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900">
                    Execution Failed
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* EMPTY STATE */}
            {!loading && !result && !error && (
              <div className="h-full min-h-[500px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <LayoutDashboard className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="font-medium text-slate-900">Ready to Test</h3>
                <p className="text-sm">
                  Enter your test parameters on the left to begin.
                </p>
              </div>
            )}

            {/* LOADING / RUNNING STATE - TIMELINE */}
            {loading && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      Live Execution Log
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="animate-pulse text-blue-600 border-blue-200 bg-blue-50"
                    >
                      Running
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] p-6">
                    <div className="space-y-6">
                      {liveSteps.map((step, i) => (
                        <div key={i} className="flex gap-4 group">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                                step.status === "success"
                                  ? "bg-emerald-500"
                                  : step.status === "failed"
                                  ? "bg-red-500"
                                  : "bg-blue-500 animate-pulse"
                              }`}
                            />
                            {i !== liveSteps.length - 1 && (
                              <div className="w-px h-full bg-slate-200 my-1" />
                            )}
                          </div>
                          <div className="pb-2">
                            <p className="text-sm font-medium text-slate-800">
                              {step.message}
                            </p>
                            <span className="text-xs text-slate-400 font-mono">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* RESULT STATE */}
            {result && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Status Banner */}
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-full">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-900">
                        Test Passed Successfully
                      </h3>
                      <p className="text-sm text-emerald-700">
                        Verification confirmed by Agent.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                  >
                    Run New Test
                  </Button>
                </div>

                {/* Browser View */}
                <BrowserFrame url={url}>
                  {result.screenshot ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.screenshot}
                      alt="Test Result"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <Globe className="w-12 h-12 mb-2 opacity-20" />
                      <p>No screenshot captured</p>
                    </div>
                  )}
                </BrowserFrame>

                {/* Detailed Logs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Agent Decision History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                      {/* We display the final message from backend */}
                      <p className="text-emerald-400">
                        $ agent report --status=success
                      </p>
                      <p className="mt-2">{result.message}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
