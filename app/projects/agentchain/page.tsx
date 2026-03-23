import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import ScrollReveal from "@/components/ScrollReveal";
import TechBadge from "@/components/TechBadge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AgentChain — Case Study | Osler Hutson",
  description:
    "Purpose-built L1 blockchain for AI agents — go-ethereum fork with RandomX PoW consensus, custom RPC namespace, and a cross-platform mobile wallet.",
};

const stats = [
  { label: "Commits", value: "3,951" },
  { label: "Go LOC", value: "12M+" },
  { label: "Repos", value: "3" },
  { label: "Chain ID", value: "7331" },
];

const features = [
  {
    tag: "Blockchain Core",
    title: "AgentChain L1 — go-ethereum Fork with RandomX PoW",
    items: [
      "Purpose-built Layer 1 blockchain forked from go-ethereum v1.11.6 — designed so AI agents can mine, transact, and deploy smart contracts without managing private keys",
      "Replaced Ethereum's Ethash consensus with RandomX — a CPU-friendly proof-of-work algorithm making it profitable for any VPS or cloud instance to mine CRD tokens",
      "Custom agent_* RPC namespace (agent_createWallet, agent_send, agent_startMining, agent_stopMining) — AI agents only need HTTP access to interact with the chain",
      "42 modified files from upstream go-ethereum (~630 insertions, ~220 deletions) covering consensus swap, chain parameters, transaction model, networking, and RPC layer",
      "Berlin EVM with legacy-only transaction model, dynamic gas limits (10M–60M), 1 Gwei minimum gas price, ~6 second block times, and 2 CRD block rewards",
      "Zero premine — fully decentralized from genesis with public bootnode infrastructure and block explorer at agentchain.org",
    ],
  },
  {
    tag: "Consensus Engine",
    title: "RandomX Integration & Difficulty Adjustment",
    items: [
      "Full RandomX consensus engine package: block sealing, header verification, difficulty adjustment, epoch/cache management, and VM pool",
      "CGo bindings to the RandomX C library with prebuilt static libraries for Linux, macOS, and Windows cross-compilation",
      "Custom LWMA (Linear Weighted Moving Average) difficulty algorithm targeting 6-second block times with smooth adjustments",
      "Company-scoped session variables for mining, integrated with the node's internal key management — no external wallet software needed",
    ],
  },
  {
    tag: "Mining & Distribution",
    title: "AgentChain Miner — Terminal Mining Client",
    items: [
      "Standalone terminal miner for CRD tokens — works on Linux, macOS, and Windows with automated wallet creation and one-command mining setup",
      "Helper scripts (mine.sh, mine.bat) for zero-config mining — handles node connection, wallet generation, and mining thread management",
      "Mining status monitoring via RPC: hashrate checks, balance queries, peer counts, and block height tracking through simple curl commands",
      "Designed for AI agent operation — no interactive prompts or manual key management, purely API-driven",
    ],
  },
  {
    tag: "AI Integration",
    title: "OpenClaw Skill — AI Agent Blockchain Interface",
    items: [
      "OpenClaw skill plugin enabling any AI agent framework to interact with AgentChain — balance checks, CRD transfers, wallet creation, contract deployment, and mining",
      "Installable via ClawHub (/install agentchain) or manual clone — follows the OpenClaw skill specification for plug-and-play AI agent integration",
      "Full suite of helper scripts: balance.sh, send.sh, status.sh, wallet.sh, mine.sh, snapshot.sh, and health.sh for programmatic blockchain operations",
      "Configurable via AGENTCHAIN_RPC environment variable — falls back to public RPC for read operations, local node for write operations",
    ],
  },
  {
    tag: "Mobile",
    title: "AgentChain Mobile Wallet — React Native / Expo",
    items: [
      "Cross-platform mobile wallet built with React Native 0.79, Expo 53, and TypeScript — targeting iOS, Android, and web",
      "File-based routing with Expo Router, tab navigation with React Navigation, and native haptic feedback integration",
      "WebView-based blockchain interaction for connecting to AgentChain RPC endpoints from mobile devices",
      "Parallax scroll views, themed components, and platform-native UI patterns for a polished user experience",
    ],
  },
  {
    tag: "Infrastructure",
    title: "Network Operations & Deployment",
    items: [
      "Live production network with public RPC endpoint (165.232.86.29:8545), P2P networking on port 30303, and persistent bootnode infrastructure",
      "Block explorer and documentation site at agentchain.org with API docs, mining guides, and network statistics",
      "Docker and Dockerfile configurations for containerized node deployment — both single-node and multi-node cluster setups",
      "Chain snapshot distribution for fast node synchronization, reducing initial sync from hours to minutes",
      "Comprehensive build system supporting Go 1.20+ with CGo cross-compilation for three major platforms",
    ],
  },
];

const techStack = [
  "Go",
  "C (RandomX)",
  "CGo",
  "Solidity",
  "JavaScript",
  "TypeScript",
  "React Native",
  "Expo 53",
  "EVM (Berlin)",
  "RandomX PoW",
  "JSON-RPC",
  "P2P Networking",
  "Docker",
  "Shell Scripts",
  "DigitalOcean",
  "Nginx",
  "WebView",
  "OpenClaw",
];

export default function AgentChainPage() {
  return (
    <div className="relative">
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <SectionHeading
          tag="Case Study"
          title="AgentChain"
          description="A purpose-built Layer 1 blockchain for AI agents — forked from go-ethereum with RandomX proof-of-work consensus, a custom key-free RPC namespace, a terminal mining client, an OpenClaw AI skill, and a cross-platform mobile wallet. Designed so AI agents can mine, transact, and deploy smart contracts autonomously."
        />
        <div className="mt-10">
          <div className="glass rounded-2xl p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text-blue">
                  {s.value}
                </div>
                <div className="text-xs text-white/40 mt-1 uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/30 px-3 py-1 text-xs text-green-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            LIVE NETWORK — Chain ID 7331
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/30 px-3 py-1 text-xs text-orange-400 font-mono">
            CRD Token — RandomX PoW
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs text-blue-400 font-mono">
            go-ethereum Fork
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <ScrollReveal>
          <div className="glass rounded-2xl p-8 md:p-10">
            <h3 className="text-xl font-bold mb-6">Ecosystem Architecture</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { name: "AgentChain L1", desc: "go-ethereum + RandomX", detail: "12M+ lines of Go" },
                { name: "AgentChain Miner", desc: "Terminal Mining Client", detail: "Linux / macOS / Windows" },
                { name: "OpenClaw Skill", desc: "AI Agent Interface", detail: "Plug-and-play blockchain" },
              ].map((pkg) => (
                <div
                  key={pkg.name}
                  className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4 text-center"
                >
                  <div className="text-sm font-semibold gradient-text-blue">
                    {pkg.name}
                  </div>
                  <div className="text-xs text-white/40 mt-1">{pkg.desc}</div>
                  <div className="text-[10px] text-white/25 mt-2 font-mono">{pkg.detail}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="text-xs text-white/30">&#9660;</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
                  <div className="text-sm font-semibold text-white/80">agent_* RPC Namespace</div>
                  <div className="text-xs text-white/40 mt-1">
                    createWallet &bull; send &bull; startMining &bull; stopMining
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
                  <div className="text-sm font-semibold text-white/80">Mobile Wallet</div>
                  <div className="text-xs text-white/40 mt-1">
                    React Native &bull; Expo 53 &bull; iOS / Android / Web
                  </div>
                </div>
              </div>
              <div className="text-xs text-white/30">&#9660;</div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 w-full max-w-md text-center">
                <div className="text-sm font-semibold text-white/80">AgentChain Network</div>
                <div className="text-xs text-white/40 mt-1">
                  EVM Berlin &bull; ~6s blocks &bull; 2 CRD rewards &bull; Dynamic gas
                </div>
              </div>
            </div>
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <div className="glass rounded-xl p-4">
                <div className="text-sm font-semibold text-accent-cyan">
                  Key-Free Operations
                </div>
                <p className="text-xs text-white/50 mt-1">
                  AI agents interact via HTTP RPC — no private key management, seed phrases, or wallet software required
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-sm font-semibold text-accent-cyan">
                  CPU-Friendly Mining
                </div>
                <p className="text-xs text-white/50 mt-1">
                  RandomX PoW is ASIC-resistant and GPU-resistant — any cloud VPS can mine profitably, ideal for AI agent fleets
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-sm font-semibold text-accent-cyan">
                  Full EVM Compatibility
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Deploy Solidity smart contracts, use existing Ethereum tooling — MetaMask, Hardhat, ethers.js all work out of the box
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {features.map((feature) => (
        <section key={feature.tag} className="mx-auto max-w-7xl px-6 py-12">
          <ScrollReveal delay={0.05}>
            <div className="glass rounded-2xl p-8 md:p-10">
              <span className="tag">{feature.tag}</span>
              <h3 className="mt-4 text-xl md:text-2xl font-bold">
                {feature.title}
              </h3>
              <ul className="mt-6 space-y-4">
                {feature.items.map((item) => (
                  <li
                    key={item.slice(0, 40)}
                    className="flex items-start gap-3 text-sm text-white/60 leading-relaxed"
                  >
                    <span className="text-accent mt-0.5 shrink-0">&#9654;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </section>
      ))}

      <section className="mx-auto max-w-7xl px-6 py-12">
        <ScrollReveal>
          <h3 className="text-xl font-bold mb-6">Technical Stack</h3>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <TechBadge key={tech} name={tech} />
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <ScrollReveal>
          <div className="glass rounded-3xl p-10 md:p-14 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">
              From Blockchain Architecture to SaaS Platforms
            </h2>
            <p className="mt-4 text-white/50 max-w-xl mx-auto">
              AgentChain shows the depth of my engineering — forking a major open-source blockchain, implementing a novel consensus algorithm in Go/C, and building an entire ecosystem around it. I don&apos;t just use frameworks — I build infrastructure.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/contact" className="btn">Get In Touch</Link>
              <Link href="/projects/forgedrive" className="btn-outline">ForgeDrive Case Study</Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
