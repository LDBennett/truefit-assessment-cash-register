import { Code2, ExternalLink, GitBranch, Terminal } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Code2 size={13} className="text-emerald-500" />
            <span>Trufit Cash Register Assessment</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Terminal size={13} className="text-slate-400" />
            <span>
              CLI: <code className="text-slate-400">pnpm run cli &lt;file&gt;</code>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/TrueFit/CashRegister"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-slate-300 transition-colors"
          >
            <GitBranch size={13} />
            <span>Truefit Assessment</span>
            <ExternalLink size={11} className="text-slate-500" />
          </a>
        </div>
      </div>
    </footer>
  );
}
