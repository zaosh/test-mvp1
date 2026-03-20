"use client";

interface GitHubRef {
  repoUrl: string;
  commitSha?: string | null;
  prNumber?: number | null;
  releaseTag?: string | null;
  branchName?: string | null;
}

interface GitHubRefBadgeProps {
  githubRef: GitHubRef;
}

export function GitHubRefBadge({ githubRef }: GitHubRefBadgeProps) {
  const { repoUrl, commitSha, prNumber, releaseTag, branchName } = githubRef;

  let href = repoUrl;
  let icon: React.ReactNode;
  let label: string;

  if (releaseTag) {
    href = `${repoUrl}/releases/tag/${releaseTag}`;
    icon = (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2.5 7.775V2.75a.25.25 0 01.25-.25h5.025a.25.25 0 01.177.073l6.25 6.25a.25.25 0 010 .354l-5.025 5.025a.25.25 0 01-.354 0l-6.25-6.25a.25.25 0 01-.073-.177zm-1.5 0V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 010 2.474l-5.026 5.026a1.75 1.75 0 01-2.474 0l-6.25-6.25A1.75 1.75 0 011 7.775zM6 5a1 1 0 100 2 1 1 0 000-2z" />
      </svg>
    );
    label = releaseTag;
  } else if (prNumber) {
    href = `${repoUrl}/pull/${prNumber}`;
    icon = (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1.5 3.25a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zm5.677-.177L9.573.677A.25.25 0 0110 .854V2.5h1A2.5 2.5 0 0113.5 5v5.628a2.251 2.251 0 11-1.5 0V5a1 1 0 00-1-1h-1v1.646a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354z" />
      </svg>
    );
    label = `#${prNumber}`;
  } else if (commitSha) {
    href = `${repoUrl}/commit/${commitSha}`;
    icon = (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M11.93 8.5a4.002 4.002 0 01-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 010 1.5zm-1.43-.75a2.5 2.5 0 10-5 0 2.5 2.5 0 005 0z" />
      </svg>
    );
    label = commitSha.slice(0, 7);
  } else if (branchName) {
    href = `${repoUrl}/tree/${branchName}`;
    icon = (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z" />
      </svg>
    );
    label = branchName;
  } else {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono-value hover:opacity-80 transition-opacity"
      style={{
        backgroundColor: "#1a1a24",
        border: "1px solid #2a2a38",
        color: "#8888a8",
      }}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
