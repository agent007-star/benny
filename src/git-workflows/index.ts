import { simpleGit, SimpleGit } from "simple-git";
import { reviewCode } from "../optimizers/chinese-code.js";

export interface GitWorkflowOptions {
  autoCommit: boolean;
  commitPrefix: string;
  branch?: string;
}

export interface CommitAnalysis {
  files: string[];
  additions: number;
  deletions: number;
  summary: string;
  risks: string[];
}

export async function analyzeChanges(git: SimpleGit): Promise<CommitAnalysis> {
  const status = await git.status();
  const diff = await git.diff(["--staged"]);

  const lines = diff.split("\n");
  let additions = 0;
  let deletions = 0;
  for (const line of lines) {
    if (line.startsWith("+") && !line.startsWith("+++")) additions++;
    if (line.startsWith("-") && !line.startsWith("---")) deletions++;
  }

  const risks = await analyzeRisks(diff);

  return {
    files: [...status.modified, ...status.created, ...status.not_added],
    additions,
    deletions,
    summary: status.current ?? "detached",
    risks,
  };
}

async function analyzeRisks(diff: string): Promise<string[]> {
  const risks: string[] = [];
  const patterns = [
    { regex: /password\s*=|secret\s*=|api[_-]?key\s*=/gi, msg: "可能包含敏感信息" },
    { regex: /\bconsole\.(log|debug)\s*\(/g, msg: "发现console.log调用" },
    { regex: /\/\/\s*TODO|\/\/\s*FIXME/g, msg: "存在未完成的TODO/FIXME" },
    { regex: /\bawait\s+\w+\(.*\)\s*;?\s*$/gm, msg: "发现未处理的async调用" },
    { regex: /\.env\b|\.pem\b|\.key\b|\.cer\b/gi, msg: "可能包含密钥文件" },
  ];

  for (const { regex, msg } of patterns) {
    if (regex.test(diff)) risks.push(msg);
    regex.lastIndex = 0;
  }

  return risks;
}

export async function reviewChanges(git: SimpleGit): Promise<string> {
  const diff = await git.diff(["--staged"]);
  if (!diff) return "没有暂存的更改可供审查。";

  const analysis = await analyzeChanges(git);
  const aiReview = await reviewCode(diff, "diff");

  let report = `## Git 变更分析\n\n`;
  report += `- 分支: \`${analysis.summary}\`\n`;
  report += `- 文件: ${analysis.files.join(", ") || "无"}\n`;
  report += `- 增行: ${analysis.additions} | 删行: ${analysis.deletions}\n\n`;

  if (analysis.risks.length > 0) {
    report += `## 风险提示\n`;
    for (const risk of analysis.risks) {
      report += `- ⚠️ ${risk}\n`;
    }
    report += "\n";
  }

  report += `## AI 代码审查\n\n${aiReview}`;
  return report;
}

export async function smartCommit(
  git: SimpleGit,
  message: string,
  options: Partial<GitWorkflowOptions> = {}
): Promise<void> {
  const opts: GitWorkflowOptions = {
    autoCommit: false,
    commitPrefix: "feat:",
    ...options,
  };

  await git.commit(`${opts.commitPrefix} ${message}`);
}

export function createGitWorkflow(gitDir?: string) {
  return simpleGit(gitDir);
}
