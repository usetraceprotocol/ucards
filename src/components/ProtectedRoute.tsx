import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useWallet } from "@/contexts/WalletContext";
import WalletConnectPrompt from "@/components/dashboard/WalletConnectPrompt";
import dashboardPreviewBg from "@/assets/dashboard-preview.png";
import { Button } from "@/components/ui/button";
import { checkUCardsBalance, type GateResult } from "@/lib/ucardsGate";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

type GateState = "loading" | "unconnected" | "checking" | "denied" | "granted";

const WALLET_RECONNECT_GRACE_PERIOD = 1500;

const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { isConnected, isConnecting, fullWalletAddress } = useWallet();
  const [gateState, setGateState] = useState<GateState>("loading");
  const [gateResult, setGateResult] = useState<GateResult | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoadComplete(true), WALLET_RECONNECT_GRACE_PERIOD);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (isConnecting) {
        setGateState("loading");
        return;
      }
      if (!isConnected || !fullWalletAddress) {
        if (!initialLoadComplete) {
          setGateState("loading");
          return;
        }
        setGateState("unconnected");
        return;
      }
      if (!requireAuth) {
        setGateState("granted");
        return;
      }

      setGateState("checking");
      const result = await checkUCardsBalance(fullWalletAddress);
      if (cancelled) return;
      setGateResult(result);
      setGateState(result.hasAccess ? "granted" : "denied");
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isConnected, isConnecting, requireAuth, fullWalletAddress, initialLoadComplete]);

  if (gateState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Icon icon="ph:spinner" className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-neutral-400">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (gateState === "unconnected") {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center blur-md scale-105 opacity-30"
          style={{ backgroundImage: `url(${dashboardPreviewBg})` }}
        />
        <div className="absolute inset-0 bg-background/60" />
        <div className="relative z-10">
          <WalletConnectPrompt />
        </div>
      </div>
    );
  }

  if (gateState === "checking") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Icon icon="ph:spinner" className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-neutral-400">Checking $UCARD balance on-chain…</p>
        </motion.div>
      </div>
    );
  }

  if (gateState === "denied" && gateResult) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center">
              <Icon icon="ph:lock-key-bold" className="w-8 h-8 text-sky-500" />
            </div>

            <h2 className="text-2xl font-semibold mb-2 text-foreground">Membership Required</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Hold at least <strong className="text-foreground">{gateResult.required} ${gateResult.symbol}</strong> to unlock the dashboard and mint your virtual cards.
            </p>

            <div className="bg-muted rounded-lg p-4 mb-6 space-y-2 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your balance</span>
                <span className="font-mono text-foreground">{gateResult.balance} ${gateResult.symbol}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Required</span>
                <span className="font-mono text-foreground">{gateResult.required} ${gateResult.symbol}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                <span className="text-muted-foreground">Wallet</span>
                <span className="font-mono text-muted-foreground">
                  {fullWalletAddress.slice(0, 6)}…{fullWalletAddress.slice(-4)}
                </span>
              </div>
            </div>

            {gateResult.reason && (
              <p className="text-xs text-muted-foreground mb-4">{gateResult.reason}</p>
            )}

            <Button
              onClick={() => {
                if (gateResult.tokenAddress) {
                  window.open(
                    `https://app.uniswap.org/swap?outputCurrency=${gateResult.tokenAddress}`,
                    "_blank",
                  );
                }
              }}
              disabled={!gateResult.tokenAddress}
              className="w-full bg-foreground text-background hover:bg-foreground/90 py-6"
            >
              <Icon icon="ph:arrow-square-out-bold" className="w-5 h-5 mr-2" />
              Buy $UCARD on Uniswap
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              Membership is non-custodial — we read your balance on-chain. No signature, no database.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
