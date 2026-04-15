import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { PageLayout } from "@/components/layout/PageLayout";
import Home from "@/pages/Home";
import Algorithm from "@/pages/Algorithm";
import Aphasia from "@/pages/Aphasia";
import Topology from "@/pages/Topology";
import Atlas from "@/pages/Atlas";
import Appendix from "@/pages/Appendix";
import FAQ from "@/pages/FAQ";
import Disfasia from "@/pages/Disfasia";
import DisfasiaAtlas from "@/pages/DisfasiaAtlas";
import NounAtlas from "@/pages/NounAtlas";
import CAAAtlas from "@/pages/CAAAtlas";
import CompareAtlas from "@/pages/CompareAtlas";
import FlowPage from "@/pages/FlowPage";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/algorithm" component={Algorithm} />
      <Route path="/afasia" component={Aphasia} />
      <Route path="/topology" component={Topology} />
      <Route path="/atlas" component={Atlas} />
      <Route path="/appendice" component={Appendix} />
      <Route path="/faq" component={FAQ} />
      <Route path="/disfasia" component={Disfasia} />
      <Route path="/disfasia-atlas" component={DisfasiaAtlas} />
      <Route path="/noun-atlas" component={NounAtlas} />
      <Route path="/caa-atlas" component={CAAAtlas} />
      <Route path="/compare-atlas" component={CompareAtlas} />
      <Route path="/fluxo" component={FlowPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <PageLayout>
            <Router />
          </PageLayout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
