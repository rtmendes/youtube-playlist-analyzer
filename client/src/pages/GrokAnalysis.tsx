import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Zap, Lightbulb, TrendingUp } from "lucide-react";

export default function GrokAnalysis() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Grok-Powered Analysis</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 p-1 rounded">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Advanced AI Analysis</CardTitle>
            </div>
            <CardDescription>
              Grok 2 provides deeper insights into buyer intent by understanding context, emotions, and cultural references.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 p-1 rounded">
                <Zap className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Enhanced Accuracy</CardTitle>
            </div>
            <CardDescription>
              Improved detection of purchase intent with 15–20% higher accuracy compared to traditional methods.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 p-1 rounded">
                <TrendingUp className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Market Insights</CardTitle>
            </div>
            <CardDescription>
              Extracts valuable market trends and audience preferences from comment analysis.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run Grok analysis</CardTitle>
          <CardDescription>
            Use Grok 2 to analyze comments for POD opportunities. Connect your xAI API key in settings to enable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Analysis results will appear here once you run analysis on a playlist or video from the main analysis flow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
