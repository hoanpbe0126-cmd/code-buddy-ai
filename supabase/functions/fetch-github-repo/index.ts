import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
  size: number;
}

const IGNORED_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.cache',
  'coverage',
  '.env',
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
  '.DS_Store',
  '*.min.js',
  '*.min.css',
  '*.map',
  '*.ico',
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.gif',
  '*.svg',
  '*.woff',
  '*.woff2',
  '*.ttf',
  '*.eot',
];

const CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte',
  '.py', '.java', '.go', '.rs', '.rb', '.php',
  '.css', '.scss', '.sass', '.less',
  '.html', '.htm',
  '.json', '.yaml', '.yml', '.toml',
  '.md', '.mdx',
  '.sql',
  '.sh', '.bash',
  '.dockerfile', 'Dockerfile',
];

function shouldIgnore(path: string): boolean {
  const lowerPath = path.toLowerCase();
  return IGNORED_PATTERNS.some(pattern => {
    if (pattern.startsWith('*')) {
      return lowerPath.endsWith(pattern.slice(1));
    }
    return lowerPath.includes(pattern.toLowerCase());
  });
}

function isCodeFile(name: string): boolean {
  const lowerName = name.toLowerCase();
  return CODE_EXTENSIONS.some(ext => lowerName.endsWith(ext)) ||
    lowerName === 'dockerfile' ||
    lowerName === 'makefile' ||
    lowerName === '.gitignore' ||
    lowerName === '.eslintrc' ||
    lowerName === '.prettierrc';
}

async function fetchRepoContents(owner: string, repo: string, path: string = '', branch: string = 'main'): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  console.log(`Fetching: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Code-Review-AI',
    },
  });

  if (!response.ok) {
    if (response.status === 404 && branch === 'main') {
      // Try 'master' branch
      return fetchRepoContents(owner, repo, path, 'master');
    }
    throw new Error(`GitHub API error: ${response.status} - ${await response.text()}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

async function fetchFileContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Code-Review-AI',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }
  
  return response.text();
}

async function getProjectFiles(
  owner: string, 
  repo: string, 
  path: string = '', 
  files: Map<string, string> = new Map(),
  maxFiles: number = 50,
  maxSizePerFile: number = 10000
): Promise<Map<string, string>> {
  if (files.size >= maxFiles) return files;

  const contents = await fetchRepoContents(owner, repo, path);

  for (const item of contents) {
    if (files.size >= maxFiles) break;
    if (shouldIgnore(item.path)) continue;

    if (item.type === 'dir') {
      await getProjectFiles(owner, repo, item.path, files, maxFiles, maxSizePerFile);
    } else if (item.type === 'file' && isCodeFile(item.name) && item.download_url) {
      if (item.size <= maxSizePerFile * 2) {
        try {
          let content = await fetchFileContent(item.download_url);
          if (content.length > maxSizePerFile) {
            content = content.slice(0, maxSizePerFile) + '\n// ... truncated';
          }
          files.set(item.path, content);
          console.log(`Added file: ${item.path} (${content.length} chars)`);
        } catch (err) {
          console.error(`Error fetching ${item.path}:`, err);
        }
      }
    }
  }

  return files;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Support formats:
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // github.com/owner/repo
  // owner/repo
  
  const cleaned = url.replace(/\.git$/, '').trim();
  
  // Full URL
  const urlMatch = cleaned.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }
  
  // Short format: owner/repo
  const shortMatch = cleaned.match(/^([^\/]+)\/([^\/]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { githubUrl } = await req.json();
    
    if (!githubUrl) {
      return new Response(
        JSON.stringify({ error: 'GitHub URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: 'Invalid GitHub URL format. Use: https://github.com/owner/repo or owner/repo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching repo: ${parsed.owner}/${parsed.repo}`);
    
    const files = await getProjectFiles(parsed.owner, parsed.repo);
    
    if (files.size === 0) {
      return new Response(
        JSON.stringify({ error: 'No code files found in repository' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format files for review
    const fileContents: { path: string; content: string }[] = [];
    files.forEach((content, path) => {
      fileContents.push({ path, content });
    });

    console.log(`Successfully fetched ${fileContents.length} files`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        owner: parsed.owner,
        repo: parsed.repo,
        files: fileContents,
        totalFiles: fileContents.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching GitHub repo:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch repository' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
