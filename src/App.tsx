import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { sdk as miniAppSdk } from "@farcaster/miniapp-sdk";
import { WalletProvider } from "@/contexts/WalletContext";
import { XMTPProvider } from "@/contexts/XMTPContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { VeilProvider } from "@/contexts/VeilContext";
import { Icon } from "@iconify/react";
import { FloatingNav } from "@/components/ui/floating-navbar";
import WalletConnectButton from "@/components/WalletConnectButton";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import PaymentPage from "./pages/PaymentPage";
import Pay from "./pages/Pay";
import Tip from "./pages/Tip";
import X402Deposit from "./pages/X402Deposit";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import Docs from "./pages/Docs";
import Whitepaper from "./pages/Whitepaper";
import MiniApp from "./miniapp/MiniApp";
import SmsClaim from "./pages/SmsClaim";
import NotFound from "./pages/NotFound";
import {
  Shield,
  AlertTriangle,
  Lightbulb,
  Briefcase,
  Map,
  LayoutDashboard,
  FileText,
} from "lucide-react";

const queryClient = new QueryClient();

const NO_NAV_ROUTES = ["/dashboard", "/miniapp", "/claim", "/pay", "/tip"];

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
};

function AppNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideNav = NO_NAV_ROUTES.some((r) => location.pathname.startsWith(r));
  const isHome = location.pathname === "/";

  if (hideNav) return null;

  const sectionNav = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isHome) {
      navigate("/");
      setTimeout(() => scrollTo(id), 400);
    } else {
      scrollTo(id);
    }
  };

  const navItems = [
    { name: "About", link: "#about", icon: <Shield className="h-4 w-4" />, onClick: sectionNav("about") },
    { name: "Problem", link: "#problem", icon: <AlertTriangle className="h-4 w-4" />, onClick: sectionNav("problem") },
    { name: "Solution", link: "#features", icon: <Lightbulb className="h-4 w-4" />, onClick: sectionNav("features") },
    { name: "Use Cases", link: "#use-cases", icon: <Briefcase className="h-4 w-4" />, onClick: sectionNav("use-cases") },
    { name: "Roadmap", link: "#roadmap", icon: <Map className="h-4 w-4" />, onClick: sectionNav("roadmap") },
    { name: "Whitepaper", link: "/whitepaper", icon: <FileText className="h-4 w-4" /> },
    { name: "Dashboard", link: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  ];

  return (
    <FloatingNav
      navItems={navItems}
      rightElement={
        <div className="flex items-center gap-1 pl-1">
          <a
            href="https://x.com/uCards_"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X / Twitter"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Icon icon="simple-icons:x" className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://t.me/useucards"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Icon icon="simple-icons:telegram" className="w-4 h-4" />
          </a>
          <WalletConnectButton variant="navbar" />
        </div>
      }
    />
  );
}

function AppRoutes() {
  return (
    <>
      <AppNav />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pay" element={<Pay />} />
        <Route path="/pay/:id" element={<PaymentPage />} />
        <Route path="/tip/:handle" element={<Tip />} />
        <Route path="/card-issuance-deposit" element={<X402Deposit />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/whitepaper" element={<Whitepaper />} />
        <Route path="/miniapp/*" element={<MiniApp />} />
        <Route path="/claim/:token" element={<SmsClaim />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => {
  useEffect(() => {
    miniAppSdk.actions.ready().catch(() => {
      // Outside a Mini App container; safe to ignore.
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WalletProvider>
            <XMTPProvider>
              <VeilProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </VeilProvider>
            </XMTPProvider>
          </WalletProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
