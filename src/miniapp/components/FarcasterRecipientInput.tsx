/**
 * Farcaster Recipient Input
 * Input field with toggle: "UCARDS username" / "Farcaster user"
 * UCARDS mode: verifies username via /api/user/lookup (same as website)
 * Farcaster mode: resolves via /api/farcaster/resolve-fid (privacy-safe)
 */

import { useState, useEffect, useRef } from "react";
import { Search, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getApiUrl } from "@/utils/apiConfig";
import farcasterApi from "../services/farcasterApi";

const API_BASE = getApiUrl();

interface FarcasterRecipientInputProps {
  onRecipientResolved: (recipient: {
    type: "ucards" | "farcaster";
    username: string;
    ucardsUsername?: string;
    hasDeposited?: boolean;
  } | null) => void;
}

type InputMode = "ucards" | "farcaster";

export function FarcasterRecipientInput({
  onRecipientResolved,
}: FarcasterRecipientInputProps) {
  const [mode, setMode] = useState<InputMode>("ucards");
  const [inputValue, setInputValue] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [resolveResult, setResolveResult] = useState<{
    found: boolean;
    ucardsUsername?: string | null;
    hasDeposited?: boolean;
    walletHint?: string | null;
    error?: string;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setResolveResult(null);
    onRecipientResolved(null);

    if (!inputValue.trim() || inputValue.trim().length < 2) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const username = inputValue.trim().replace(/^@/, "");
      if (!username) return;

      setIsResolving(true);

      try {
        if (mode === "ucards") {
          // Verify UCARDS username via /api/user/lookup (same as website)
          const response = await fetch(
            `${API_BASE}/api/user/lookup?username=${encodeURIComponent(username)}`
          );
          const data = await response.json();

          if (data.success) {
            setResolveResult({
              found: true,
              hasDeposited: data.has_deposited !== false,
              walletHint: data.wallet_hint || null,
            });
            onRecipientResolved({
              type: "ucards",
              username,
              hasDeposited: data.has_deposited !== false,
            });
          } else {
            setResolveResult({ found: false, error: "Username not found" });
          }
        } else {
          // Farcaster mode
          const result = await farcasterApi.resolveFarcasterUser(username);
          setResolveResult({
            found: result.found,
            ucardsUsername: result.ucardsUsername,
            hasDeposited: result.hasDeposited,
          });

          if (result.found) {
            onRecipientResolved({
              type: "farcaster",
              username,
              ucardsUsername: result.ucardsUsername || undefined,
              hasDeposited: result.hasDeposited,
            });
          }
        }
      } catch {
        setResolveResult({ found: false, error: "Lookup failed" });
      } finally {
        setIsResolving(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, mode]);

  return (
    <div className="space-y-2">
      {/* Mode Toggle */}
      <div className="flex gap-1 p-0.5 bg-zinc-800 rounded-lg">
        <button
          onClick={() => {
            setMode("ucards");
            setInputValue("");
          }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === "ucards"
              ? "bg-indigo-600 text-white"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          UCARDS Username
        </button>
        <button
          onClick={() => {
            setMode("farcaster");
            setInputValue("");
          }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === "farcaster"
              ? "bg-purple-600 text-white"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          Farcaster User
        </button>
      </div>

      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            mode === "ucards" ? "Enter UCARDS username" : "Enter Farcaster username"
          }
          className="w-full pl-9 pr-10 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
        />

        {/* Status indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isResolving ? (
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
          ) : resolveResult?.found ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : resolveResult && !resolveResult.found ? (
            <XCircle className="w-4 h-4 text-red-400" />
          ) : null}
        </div>
      </div>

      {/* Resolution result */}
      {resolveResult && (
        <div
          className={`text-xs px-3 py-1.5 rounded-lg ${
            resolveResult.found
              ? resolveResult.hasDeposited === false
                ? "bg-amber-500/10 text-amber-400"
                : "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {resolveResult.found
            ? mode === "ucards"
              ? resolveResult.hasDeposited === false
                ? "User found but hasn't deposited yet"
                : `User verified${resolveResult.walletHint ? ` (${resolveResult.walletHint})` : ""}`
              : resolveResult.ucardsUsername
                ? `UCARDS user: ${resolveResult.ucardsUsername} (${resolveResult.hasDeposited ? "has funds" : "no deposits yet"})`
                : "Found on Farcaster (no UCARDS account yet)"
            : resolveResult.error || (mode === "ucards" ? "Username not found" : "Farcaster user not found")}
        </div>
      )}
    </div>
  );
}
