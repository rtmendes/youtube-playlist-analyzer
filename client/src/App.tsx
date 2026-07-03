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
import HistoryDetail from "./pages/HistoryDetail";
import HistoryLocal from "./pages/HistoryLocal";
import Intelligence from "./pages/Intelligence";
import AnalysisDashboard from "./pages/AnalysisDashboard";
import Canvas from "./pages/Canvas";
import Projects from "./pages/Projects";
import Videos from "./pages/Videos";
import Channels from "./pages/Channels";
import Comments from "./pages/Comments";
import Help from "./pages/Help";
import Channel from "./pages/Channel";
import AmazonIntelligence from "./pages/AmazonIntelligence";
import RedditResearch from "./pages/RedditResearch";
import CompetitorAnalysis from "./pages/CompetitorAnalysis";
import SavedPlaylist from "./pages/SavedPlaylist";
import TikTokIntelligence from "./pages/TikTokIntelligence";
import SavedComments from "./pages/SavedComments";
import SharedCollection from "./pages/SharedCollection";
import ContentGenerator from "./pages/ContentGenerator";
import CompetitorCalendar from "./pages/CompetitorCalendar";
import ContentGapAnalysis from "./pages/ContentGapAnalysis";
import Playlists from "./pages/Playlists";
import Trash from "./pages/Trash";
import PODDashboard from "./pages/PODDashboard";
import DataSync from "./pages/DataSync";
import PODOpportunities from "./pages/PODOpportunities";
import Marketplace from "./pages/Marketplace";
import GrokAnalysis from "./pages/GrokAnalysis";
import LLMAssistant from "./pages/LLMAssistant";
import MockupGenerator from "./pages/MockupGenerator";
import SystemArchitecture from "./pages/SystemArchitecture";
import YouTubeChannelPOD from "./pages/YouTubeChannelPOD";
import YouTubeDataPOD from "./pages/YouTubeDataPOD";
import CommentAnalysisPOD from "./pages/CommentAnalysisPOD";
import Settings from "./pages/Settings";
import DataManager from "./pages/DataManager";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/pod-dashboard"} component={PODDashboard} />
      <Route path={"/data-sync"} component={DataSync} />
      <Route path={"/pod-opportunities"} component={PODOpportunities} />
      <Route path={"/marketplace"} component={Marketplace} />
      <Route path={"/grok-analysis"} component={GrokAnalysis} />
      <Route path={"/llm-assistant"} component={LLMAssistant} />
      <Route path={"/mockup-generator"} component={MockupGenerator} />
      <Route path={"/system-architecture"} component={SystemArchitecture} />
      <Route path={"/youtube-channel"} component={YouTubeChannelPOD} />
      <Route path={"/youtube-data"} component={YouTubeDataPOD} />
      <Route path={"/comment-analysis"} component={CommentAnalysisPOD} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/analyze"} component={Analyze} />
      <Route path={"/video"} component={Video} />
      <Route path={"/bulk-analyze"} component={BulkAnalyze} />
      <Route path={"/history/local"} component={HistoryLocal} />
      <Route path={"/history/:id"} component={HistoryDetail} />
      <Route path={"/history"} component={History} />
      <Route path={"/intelligence"} component={Intelligence} />
      <Route path={"/analysis"} component={AnalysisDashboard} />
      <Route path={"/canvas"} component={Canvas} />
      <Route path={"/projects"} component={Projects} />
      <Route path={"/videos"} component={Videos} />
      <Route path={"/channels"} component={Channels} />
      <Route path={"/channel/:channelId"} component={Channel} />
      <Route path={"/comments"} component={Comments} />
      <Route path={"/help/:topic"} component={Help} />
      <Route path={"/amazon"} component={AmazonIntelligence} />
      <Route path={"/reddit"} component={RedditResearch} />
     <Route path={"/competitor-analysis"} component={CompetitorAnalysis} />
      <Route path={"/tiktok"} component={TikTokIntelligence} />
      <Route path={"/playlist/:id"} component={SavedPlaylist} />
      <Route path={"/saved-comments"} component={SavedComments} />
      <Route path={"/shared-collection/:shareToken"} component={SharedCollection} />
      <Route path={"/content-generator"} component={ContentGenerator} />
      <Route path={"/competitor-calendar"} component={CompetitorCalendar} />
      <Route path={"/content-gap-analysis"} component={ContentGapAnalysis} />
      <Route path={"/data-manager"} component={DataManager} />
      <Route path={"/playlists"} component={Playlists} />
      <Route path={"/trash"} component={Trash} />
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
