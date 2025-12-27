import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NavigationHistoryProvider } from "./contexts/NavigationHistory";
import { AppLayout } from "./components/AppLayout";
import Home from "./pages/Home";
import Analyze from "./pages/Analyze";
import Video from "./pages/Video";
import BulkAnalyze from "./pages/BulkAnalyze";
import History from "./pages/History";
import Intelligence from "./pages/Intelligence";
import Canvas from "./pages/Canvas";
import Projects from "./pages/Projects";
import Videos from "./pages/Videos";
import Channels from "./pages/Channels";
import Comments from "./pages/Comments";
import Help from "./pages/Help";
import Channel from "./pages/Channel";
import AmazonIntelligence from "./pages/AmazonIntelligence";
import RedditResearch from "./pages/RedditResearch";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/analyze"} component={Analyze} />
      <Route path={"/video"} component={Video} />
      <Route path={"/bulk-analyze"} component={BulkAnalyze} />
      <Route path={"/history"} component={History} />
      <Route path={"/intelligence"} component={Intelligence} />
      <Route path={"/canvas"} component={Canvas} />
      <Route path={"/projects"} component={Projects} />
      <Route path={"/videos"} component={Videos} />
      <Route path={"/channels"} component={Channels} />
      <Route path={"/channel/:channelId"} component={Channel} />
      <Route path={"/comments"} component={Comments} />
      <Route path={"/help/:topic"} component={Help} />
      <Route path={"/amazon"} component={AmazonIntelligence} />
      <Route path={"/reddit"} component={RedditResearch} />
      <Route path={"/trash"} component={NotFound} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <NavigationHistoryProvider>
          <TooltipProvider>
            <Toaster />
            <AppLayout>
              <Router />
            </AppLayout>
          </TooltipProvider>
        </NavigationHistoryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
