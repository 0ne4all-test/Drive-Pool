"use client";

import { useState } from "react";
import { useStorage } from "@/hooks/useStorage";

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + " GB";
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + " MB";
  return (bytes / 1e3).toFixed(0) + " KB";
}

export default function SettingsPage() {
  const { accounts, refreshStorage } = useStorage();
  const [connecting, setConnecting] = useState(false);

  const totalUsed = accounts.reduce((s, a) => s + a.used, 0);
  const totalLimit = accounts.reduce((s, a) => s + a.limit, 0);
  const connectedCount = accounts.filter((a) => a.is_connected).length;

  async function handleDisconnect(index: number) {
    await fetch(`/api/accounts/${index}`, { method: "DELETE", credentials: "include" });
    refreshStorage();
  }

  async function handleConnect(index: number) {
    const res = await fetch(`/api/auth/oauth/${index}`, { credentials: "include" });
    const data = await res.json();
    window.location.href = data.auth_url;
  }

  async function handleConnectNew() {
    if (connecting) return;
    setConnecting(true);
    const res = await fetch("/api/auth/oauth/new", { credentials: "include" });
    const data = await res.json();
    window.location.href = data.auth_url;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-dp-text">Settings</h1>
          <p className="mt-1 text-sm text-dp-text2">
            {connectedCount} of {accounts.length} accounts connected
          </p>
        </div>
        <button
          onClick={handleConnectNew}
          disabled={connecting}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-orange-400 disabled:opacity-60"
        >
          {connecting ? (
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          )}
          {connecting ? "Redirecting…" : "Connect another account"}
        </button>
      </div>

      {/* Storage pool overview */}
      <div className="rounded-xl border border-dp-border bg-dp-s1 p-5">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-dp-text3">Total Storage Pool</p>
            <p className="mt-1 text-3xl font-semibold text-dp-text">{formatBytes(totalLimit)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-dp-text2">{formatBytes(totalUsed)} used</p>
            <p className="text-sm text-dp-text3">{formatBytes(Math.max(0, totalLimit - totalUsed))} free</p>
          </div>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-dp-hover">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-700"
            style={{ width: `${totalLimit > 0 ? Math.min(100, (totalUsed / totalLimit) * 100) : 0}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {accounts.filter((a) => a.is_connected).map((a) => (
            <div key={a.account_index} className="flex items-center gap-2 rounded-lg border border-dp-border bg-dp-bg px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-500/80" />
              <span className="text-xs text-dp-text2">{a.email ?? `Account ${a.account_index}`}</span>
              <span className="text-xs text-dp-text3">{formatBytes(a.used)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Drive accounts section */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-dp-text">Google Drive Accounts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {accounts.map((account) => {
            const pct = account.limit > 0 ? Math.min(100, (account.used / account.limit) * 100) : 0;
            return (
              <div
                key={account.account_index}
                className={`rounded-xl border p-5 transition ${
                  account.is_connected
                    ? "border-dp-border bg-dp-s1"
                    : "border-dp-border/50 bg-dp-s1 opacity-60"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-dp-text">
                      {account.email ?? `Account ${account.account_index}`}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${account.is_connected ? "bg-emerald-400" : "bg-dp-text3"}`} />
                      <span className={`text-xs ${account.is_connected ? "text-emerald-400" : "text-dp-text3"}`}>
                        {account.is_connected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  </div>
                  <span className="flex-shrink-0 rounded-md border border-dp-border px-2 py-0.5 text-[10px] font-medium text-dp-text3">
                    #{account.account_index}
                  </span>
                </div>

                {account.is_connected && (
                  <div className="mb-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-dp-text3">
                      <span>{formatBytes(account.used)} used</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-dp-hover">
                      <div
                        className={`h-full rounded-full transition-all ${pct > 80 ? "bg-red-500" : "bg-orange-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-dp-text3">
                      <span>{formatBytes(account.free)} free</span>
                      <span>of {formatBytes(account.limit)}</span>
                    </div>
                  </div>
                )}

                {account.is_connected ? (
                  <button
                    onClick={() => handleDisconnect(account.account_index)}
                    className="w-full rounded-lg border border-dp-border py-2 text-xs text-dp-text2 transition hover:border-red-500/40 hover:text-red-400"
                  >
                    Disconnect
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConnect(account.account_index)}
                      className="flex-1 rounded-lg bg-orange-500/10 py-2 text-xs font-medium text-orange-400 transition hover:bg-orange-500/20"
                    >
                      Connect
                    </button>
                    <button
                      onClick={() => handleDisconnect(account.account_index)}
                      className="rounded-lg border border-dp-border px-3 py-2 text-xs text-dp-text3 transition hover:border-red-500/40 hover:text-red-400"
                      title="Remove account"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* About section */}
      <div className="rounded-xl border border-dp-border bg-dp-s1 p-5">
        <h2 className="mb-3 text-sm font-medium text-dp-text">About DrivePool</h2>
        <p className="text-sm text-dp-text2 leading-relaxed">
          DrivePool aggregates multiple Google Drive accounts into a unified storage pool. Files are automatically routed to the account with the most available space. All data is stored in your own Google Drive accounts — DrivePool never stores files on its own servers.
        </p>
        <div className="mt-4 flex gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-dp-border px-3 py-2 text-xs text-dp-text2 transition hover:border-orange-500/30 hover:text-orange-400"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
