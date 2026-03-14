"use client";

import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

const steps = [
  {
    id: "clone",
    num: "01",
    title: "Clone the Repository",
    color: "text-orange-400",
    accent: "border-orange-500/40",
    glow: "bg-orange-500/5",
  },
  {
    id: "credentials",
    num: "02",
    title: "Create Google Cloud Credentials",
    color: "text-blue-400",
    accent: "border-blue-500/40",
    glow: "bg-blue-500/5",
  },
  {
    id: "config",
    num: "03",
    title: "Place Credentials in /config",
    color: "text-emerald-400",
    accent: "border-emerald-500/40",
    glow: "bg-emerald-500/5",
  },
  {
    id: "secrets",
    num: "04",
    title: "Generate Secrets",
    color: "text-violet-400",
    accent: "border-violet-500/40",
    glow: "bg-violet-500/5",
  },
  {
    id: "backend",
    num: "05",
    title: "Start the Backend",
    color: "text-sky-400",
    accent: "border-sky-500/40",
    glow: "bg-sky-500/5",
  },
  {
    id: "frontend",
    num: "06",
    title: "Start the Frontend",
    color: "text-pink-400",
    accent: "border-pink-500/40",
    glow: "bg-pink-500/5",
  },
  {
    id: "connect",
    num: "07",
    title: "Connect Drive Accounts",
    color: "text-yellow-400",
    accent: "border-yellow-500/40",
    glow: "bg-yellow-500/5",
  },
  {
    id: "scale",
    num: "08",
    title: "Add More Accounts",
    color: "text-emerald-400",
    accent: "border-emerald-500/40",
    glow: "bg-emerald-500/5",
  },
];

function Code({ children }: { children: string }) {
  return (
    <code className="rounded bg-dp-s2 px-1.5 py-0.5 text-xs text-orange-400 font-mono">
      {children}
    </code>
  );
}

function Block({ label, children }: { label?: string; children: string }) {
  return (
    <div className="rounded-xl border border-dp-border bg-black/20 overflow-hidden">
      {label && (
        <div className="border-b border-dp-border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-dp-text3">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-4 text-sm text-emerald-400 font-mono leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Note({ type, children }: { type: "info" | "warn" | "tip"; children: React.ReactNode }) {
  const styles = {
    info: { border: "border-blue-500/20", bg: "bg-blue-500/5", text: "text-blue-400", label: "Note" },
    warn: { border: "border-amber-500/20", bg: "bg-amber-500/5", text: "text-amber-400", label: "Important" },
    tip: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "text-emerald-400", label: "Tip" },
  }[type];
  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4`}>
      <span className={`text-xs font-bold ${styles.text}`}>{styles.label} — </span>
      <span className="text-xs text-dp-text2 leading-relaxed">{children}</span>
    </div>
  );
}

function NumberedList({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm text-dp-text2">
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-dp-s2 text-[10px] font-bold text-dp-text3">
            {i + 1}
          </span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export default function DocsPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-dp-bg text-dp-text">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-dp-border bg-dp-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10">
              <svg className="h-3.5 w-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold">DrivePool</span>
            <span className="rounded-full border border-dp-border px-2 py-0.5 text-[10px] text-dp-text3">Docs</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-dp-text3 transition hover:bg-dp-hover hover:text-dp-text"
            >
              {theme === "dark" ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </button>
            <Link
              href="/login"
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-400"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="mb-16 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            <span className="text-xs font-medium text-orange-400">Setup Guide</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-dp-text md:text-5xl">
            Get up and running
            <br />
            <span className="gradient-text">in 15 minutes</span>
          </h1>
          <p className="text-lg leading-relaxed text-dp-text2">
            From zero to a fully working multi-account Google Drive dashboard. No cloud accounts, no paid services — just your machine and your Google credentials.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Python 3.10+", "Node.js 18+", "Google Account(s)", "Git"].map((p) => (
              <span key={p} className="rounded-lg border border-dp-border bg-dp-s1 px-3 py-1.5 text-xs text-dp-text2">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* ── Two-column layout ──────────────────────────────── */}
        <div className="flex gap-12">
          {/* Left — sticky nav */}
          <aside className="hidden w-48 flex-shrink-0 lg:block">
            <div className="sticky top-20">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-dp-text3">Steps</p>
              <nav className="space-y-1">
                {steps.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-dp-text2 transition hover:bg-dp-hover hover:text-dp-text"
                  >
                    <span className={`text-[10px] font-bold tabular-nums ${s.color}`}>{s.num}</span>
                    <span>{s.title}</span>
                  </a>
                ))}
                <div className="my-3 border-t border-dp-border" />
                <a href="#faq" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-dp-text2 transition hover:bg-dp-hover hover:text-dp-text">
                  <span className="text-[10px] font-bold tabular-nums text-dp-text3">—</span>
                  <span>FAQ</span>
                </a>
                <a href="#troubleshooting" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-dp-text2 transition hover:bg-dp-hover hover:text-dp-text">
                  <span className="text-[10px] font-bold tabular-nums text-dp-text3">—</span>
                  <span>Troubleshooting</span>
                </a>
              </nav>
            </div>
          </aside>

          {/* Right — content */}
          <div className="min-w-0 flex-1 space-y-16">

            {/* ── Step 01 ── */}
            <section id="clone">
              <StepHeader num="01" color="text-orange-400" accent="border-orange-500/40" title="Clone the Repository" />
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-dp-text2">
                  Fork the repository on GitHub to get your own copy, then clone it locally.
                </p>
                <Block label="Terminal">
{`git clone https://github.com/saimon4u/Drive-Pool.git
cd Drive-Pool`}
                </Block>
              </div>
            </section>

            {/* ── Step 02 ── */}
            <section id="credentials">
              <StepHeader num="02" color="text-blue-400" accent="border-blue-500/40" title="Create Google Cloud Credentials" />
              <div className="space-y-5">
                <p className="text-sm leading-relaxed text-dp-text2">
                  Each Google Drive account needs its own OAuth credentials. Repeat this entire process for every account you want to add.
                </p>
                <NumberedList items={[
                  <>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline underline-offset-2">console.cloud.google.com</a> and create a <strong className="text-dp-text">new project</strong>.</>,
                  <>Navigate to <strong className="text-dp-text">APIs &amp; Services → Library</strong>, search for <strong className="text-dp-text">Google Drive API</strong>, and enable it.</>,
                  <>Go to <strong className="text-dp-text">APIs &amp; Services → OAuth consent screen</strong>. Choose <strong className="text-dp-text">External</strong>, fill in any app name, and add your own Google account as a <strong className="text-dp-text">test user</strong>.</>,
                  <>Go to <strong className="text-dp-text">Credentials → Create Credentials → OAuth client ID</strong>. Choose <strong className="text-dp-text">Desktop app</strong> as the application type.</>,
                  <>Download the JSON file. You&apos;ll place it in the next step.</>,
                ]} />
                <Note type="warn">
                  Create a separate Google Cloud project for each Drive account. Using the same project for multiple accounts causes OAuth conflicts.
                </Note>
              </div>
            </section>

            {/* ── Step 03 ── */}
            <section id="config">
              <StepHeader num="03" color="text-emerald-400" accent="border-emerald-500/40" title="Place Credentials in /config" />
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-dp-text2">
                  Place all downloaded credential files in the <Code>config/</Code> folder at the project root. DrivePool auto-discovers them by number on startup.
                </p>
                <Block label="config/ folder — example with 3 accounts">
{`config/
├── credentials_1.json   ← Account #1
├── credentials_2.json   ← Account #2
└── credentials_3.json   ← Account #3`}
                </Block>
                <Note type="tip">
                  Adding more accounts later is just as simple — drop in another <Code>credentials_N.json</Code> and restart the backend.
                </Note>
              </div>
            </section>

            {/* ── Step 04 ── */}
            <section id="secrets">
              <StepHeader num="04" color="text-violet-400" accent="border-violet-500/40" title="Generate Secrets" />
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-dp-text2">
                  Install Python dependencies, then run the setup script. It will prompt you for a dashboard PIN and write all secrets directly into the local database — no <Code>.env</Code> file needed.
                </p>
                <Block label="Install dependencies">
{`pip install -r backend/requirements.txt`}
                </Block>
                <Block label="Generate secrets">
{`python backend/scripts/generate_secrets.py`}
                </Block>
                <div className="rounded-xl border border-dp-border bg-dp-s1 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-dp-text3">What the script does</p>
                  <ul className="space-y-2">
                    {[
                      ["PIN hash", "Hashes your PIN with bcrypt and stores it as dashboard_pin_hash"],
                      ["JWT secret", "Generates a cryptographically random 32-byte secret for signing session tokens"],
                      ["Encryption key", "Generates a Fernet key (AES-128-CBC) for encrypting OAuth refresh tokens at rest"],
                    ].map(([k, v]) => (
                      <li key={k} className="flex gap-3 text-xs">
                        <span className="flex-shrink-0 font-semibold text-dp-text">{k}</span>
                        <span className="text-dp-text2">{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Note type="info">
                  All three secrets are stored in the <Code>app_config</Code> table inside <Code>backend/drivepool.db</Code>. Re-run the script at any time to change your PIN — it will ask before overwriting.
                </Note>
              </div>
            </section>

            {/* ── Step 05 ── */}
            <section id="backend">
              <StepHeader num="05" color="text-sky-400" accent="border-sky-500/40" title="Start the Backend" />
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-dp-text2">
                  The backend is a FastAPI app served by Uvicorn. On startup it creates the database tables, runs migrations, discovers your credential files, and syncs file metadata from all connected Drive accounts.
                </p>
                <Block label="From the project root">
{`uvicorn backend.main:app --reload --port 8000`}
                </Block>
                <Note type="tip">
                  Verify it works by opening <span className="font-mono text-orange-400">http://localhost:8000/docs</span> — you should see the Swagger UI with all API routes.
                </Note>
              </div>
            </section>

            {/* ── Step 06 ── */}
            <section id="frontend">
              <StepHeader num="06" color="text-pink-400" accent="border-pink-500/40" title="Start the Frontend" />
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-dp-text2">
                  The frontend is a Next.js (App Router) app. Install dependencies and start the dev server. It must run alongside the backend simultaneously.
                </p>
                <Block label="Terminal 2">
{`cd frontend
npm install
npm run dev`}
                </Block>
                <p className="text-sm text-dp-text2">
                  Open <span className="font-mono text-orange-400">http://localhost:3000</span>. The Next.js config rewrites all <Code>/api/*</Code> requests to <Code>http://localhost:8000/api/*</Code> automatically.
                </p>
              </div>
            </section>

            {/* ── Step 07 ── */}
            <section id="connect">
              <StepHeader num="07" color="text-yellow-400" accent="border-yellow-500/40" title="Connect Your Drive Accounts" />
              <div className="space-y-5">
                <p className="text-sm leading-relaxed text-dp-text2">
                  Each account must be authorized via Google OAuth once before DrivePool can access it.
                </p>
                <NumberedList items={[
                  <>Navigate to <span className="font-mono text-orange-400">http://localhost:3000/login</span> and enter your PIN.</>,
                  <>Click <strong className="text-dp-text">Settings</strong> in the left sidebar. You&apos;ll see one card per credentials file.</>,
                  <>Click <strong className="text-dp-text">Connect Account</strong> on each disconnected card. You&apos;ll be redirected to Google&apos;s OAuth consent screen.</>,
                  <>Sign in with the matching Google account and grant Drive access. You&apos;ll be redirected back automatically.</>,
                  <>The card turns green and shows the account&apos;s storage quota. You&apos;re ready to upload.</>,
                ]} />
                <Note type="info">
                  OAuth refresh tokens are encrypted with Fernet before being stored in the database — they are never saved in plain text.
                </Note>
              </div>
            </section>

            {/* ── Step 08 ── */}
            <section id="scale">
              <StepHeader num="08" color="text-emerald-400" accent="border-emerald-500/40" title="Add More Accounts Later" />
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-dp-text2">
                  Expanding your storage pool is a one-minute operation. No config changes needed.
                </p>
                <NumberedList items={[
                  "Create a new Google Cloud project and repeat Step 02.",
                  <>Save the credentials JSON as <Code>credentials_N.json</Code> in the <Code>config/</Code> folder (next number in sequence).</>,
                  "Restart the backend — the new account appears in Settings as Disconnected.",
                  "Click Connect Account and authorize via OAuth.",
                  "Done — your pool just grew by 15 GB.",
                ]} />
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
                  <p className="text-2xl font-bold text-dp-text">N × 15 GB</p>
                  <p className="mt-1 text-xs text-dp-text2">No hard limit on accounts. 10 accounts = 150 GB free.</p>
                </div>
              </div>
            </section>

            {/* ── Dashboard Features ──────────────────────────── */}
            <section>
              <div className="mb-8">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-dp-text3">Feature Reference</p>
                <h2 className="text-2xl font-bold text-dp-text">What&apos;s inside the dashboard</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    label: "Overview", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20",
                    items: ["Stats cards — files, folders, storage, free space", "Per-account storage bars", "File type distribution", "Recent files with thumbnails"],
                  },
                  {
                    label: "Files", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20",
                    items: ["Upload (drag & drop or click)", "Grid and list view toggle", "Sort, filter, search", "Folder navigation with breadcrumb", "Inline rename, download, trash", "Drag-to-folder side panel"],
                  },
                  {
                    label: "Shared with Me", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20",
                    items: ["Files others shared with your accounts", "Navigate into shared folders", "Grid and list view", "Sort by date / name / size", "Download directly"],
                  },
                  {
                    label: "Trash", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20",
                    items: ["All trashed files across accounts", "Restore to Drive", "Permanently delete", "Grid and list view, search, sort"],
                  },
                  {
                    label: "Analytics", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20",
                    items: ["Weekly upload activity chart", "Storage by account (used vs free)", "Files by type (donut chart)", "Storage by type (horizontal bars)"],
                  },
                  {
                    label: "Settings", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
                    items: ["Total pool summary", "Per-account quota bars", "Connect / Disconnect accounts", "Profile: display name, bio, avatar"],
                  },
                ].map((page) => (
                  <div key={page.label} className={`rounded-2xl border ${page.border} bg-dp-s1 p-5`}>
                    <div className={`mb-3 inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${page.color} ${page.bg}`}>{page.label}</div>
                    <ul className="space-y-1.5">
                      {page.items.map((item) => (
                        <li key={item} className={`flex items-start gap-2 text-xs text-dp-text2`}>
                          <span className={`mt-0.5 flex-shrink-0 ${page.color}`}>›</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────── */}
            <section id="faq">
              <div className="mb-8">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-dp-text3">FAQ</p>
                <h2 className="text-2xl font-bold text-dp-text">Frequently Asked Questions</h2>
              </div>
              <div className="divide-y divide-dp-border rounded-2xl border border-dp-border bg-dp-s1 overflow-hidden">
                {[
                  {
                    q: "Is my data safe?",
                    a: "Yes. DrivePool runs entirely on your local machine. Files are stored in your own Google Drive accounts. OAuth tokens are encrypted with AES-128 (Fernet) before being written to the local database.",
                  },
                  {
                    q: "How many accounts can I add?",
                    a: "There is no limit. Each account adds its full storage quota to the pool. 10 free accounts = 150 GB.",
                  },
                  {
                    q: "What happens if an account is full?",
                    a: "DrivePool always routes to the account with the most free space. If all accounts are full, the upload fails with a 503 error. Add another account to fix it.",
                  },
                  {
                    q: "Can I access files I added directly in Google Drive?",
                    a: "Yes. Click Sync in the Files page. DrivePool syncs only metadata — not file content — so it's fast.",
                  },
                  {
                    q: "Can I move files between accounts?",
                    a: "Within one account, drag any file and drop it into a folder from the slide-in panel. Cross-account moves are not supported — the Drive API does not allow transferring file ownership.",
                  },
                  {
                    q: "Does it work on Windows / Mac / Linux?",
                    a: "Yes. Python and Node.js are both cross-platform.",
                  },
                  {
                    q: "Can I expose it on the internet?",
                    a: "DrivePool is designed for local/self-hosted use. You can put it behind a reverse proxy (nginx, Caddy) with HTTPS, but you're responsible for securing the OAuth callback and setting FRONTEND_URL accordingly.",
                  },
                ].map((faq) => (
                  <div key={faq.q} className="p-5">
                    <p className="mb-1.5 text-sm font-semibold text-dp-text">{faq.q}</p>
                    <p className="text-sm leading-relaxed text-dp-text2">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Troubleshooting ──────────────────────────────── */}
            <section id="troubleshooting">
              <div className="mb-8">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-dp-text3">Troubleshooting</p>
                <h2 className="text-2xl font-bold text-dp-text">Common Issues</h2>
              </div>
              <div className="space-y-3">
                {[
                  {
                    q: "Backend fails to start — config key missing",
                    a: "Run python backend/scripts/generate_secrets.py. The script creates the app_config table and inserts the three required keys.",
                  },
                  {
                    q: "OAuth callback returns an error",
                    a: "Check that the authorized redirect URI in Google Cloud Console is exactly http://localhost:8000/api/auth/callback. Also confirm your account is added as a test user on the consent screen.",
                  },
                  {
                    q: "Files don't appear after uploading directly in Drive",
                    a: "DrivePool doesn't watch Drive in real time. Click the Sync button in the Files page to pull in new files.",
                  },
                  {
                    q: "Upload fails with 503",
                    a: "All connected accounts are full. Add another Google account (Step 08).",
                  },
                  {
                    q: "Account shows Disconnected after restart",
                    a: "The refresh token may have been revoked by Google. Go to Settings and reconnect via OAuth.",
                  },
                  {
                    q: "CORS error in the browser",
                    a: "Ensure both servers are running — backend on :8000, frontend on :3000. The Next.js dev proxy handles /api/* rewrites automatically.",
                  },
                ].map((item) => (
                  <div key={item.q} className="rounded-xl border border-dp-border bg-dp-s1 p-5">
                    <p className="mb-1.5 flex items-start gap-2 text-sm font-semibold text-dp-text">
                      <span className="mt-0.5 flex-shrink-0 text-amber-400">!</span>
                      {item.q}
                    </p>
                    <p className="pl-5 text-sm leading-relaxed text-dp-text2">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────── */}
            <section>
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-10 text-center">
                <h2 className="text-2xl font-bold text-dp-text">Ready?</h2>
                <p className="mt-2 text-dp-text2">Open the dashboard and start managing your storage pool.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/login" className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white shadow shadow-orange-500/25 transition hover:bg-orange-400">
                    Open Dashboard
                  </Link>
                  <Link href="/" className="rounded-xl border border-dp-border bg-dp-s1 px-6 py-3 font-semibold text-dp-text transition hover:border-orange-500/30">
                    Back to Home
                  </Link>
                </div>
              </div>
              <p className="mt-8 text-center text-xs text-dp-text3">
                DrivePool is free and open source.{" "}
                <a href="https://github.com/saimon4u/Drive-Pool" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">View on GitHub.</a>
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ num, color, accent, title }: { num: string; color: string; accent: string; title: string }) {
  return (
    <div className={`mb-6 flex items-center gap-4 border-l-2 ${accent} pl-5`}>
      <span className={`text-xs font-bold tabular-nums ${color}`}>{num}</span>
      <h2 className="text-xl font-bold text-dp-text">{title}</h2>
    </div>
  );
}
