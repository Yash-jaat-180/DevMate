import axios from 'axios';

const github = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
});

/**
 * Parse a GitHub URL into owner and repo
 * Supports: https://github.com/owner/repo, https://github.com/owner/repo.git
 */
export function parseRepoUrl(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (!match) throw new Error('Invalid GitHub repository URL.');
  return { owner: match[1], repo: match[2] };
}

/**
 * Fetch repository metadata
 */
export async function getRepoInfo(owner, repo) {
  const { data } = await github.get(`/repos/${owner}/${repo}`);
  return {
    name: data.name,
    owner: data.owner.login,
    description: data.description || '',
    defaultBranch: data.default_branch,
    language: data.language || '',
    stars: data.stargazers_count,
    forks: data.forks_count,
    url: data.html_url,
  };
}

/**
 * Fetch the full repository tree recursively
 */
export async function getRepoTree(owner, repo, branch = 'main') {
  try {
    const { data } = await github.get(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    );

    // Filter out irrelevant files and dirs
    const filtered = data.tree.filter((item) => {
      const path = item.path.toLowerCase();
      return (
        !path.startsWith('node_modules/') &&
        !path.startsWith('.git/') &&
        !path.startsWith('vendor/') &&
        !path.startsWith('dist/') &&
        !path.startsWith('build/') &&
        !path.includes('package-lock.json') &&
        !path.includes('yarn.lock') &&
        !path.includes('pnpm-lock.yaml') &&
        !path.includes('.min.js') &&
        !path.includes('.min.css')
      );
    });

    return filtered.map((item) => ({
      path: item.path,
      type: item.type === 'tree' ? 'directory' : 'file',
      size: item.size || 0,
    }));
  } catch (error) {
    if (error.response?.status === 409) {
      // Empty repository
      return [];
    }
    throw error;
  }
}

/**
 * Fetch a single file's content from the repository
 */
export async function getFileContent(owner, repo, path, branch = 'main') {
  try {
    const { data } = await github.get(
      `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    );

    if (data.encoding === 'base64' && data.content) {
      return {
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
        size: data.size,
        path: data.path,
      };
    }

    return { content: '', size: data.size, path: data.path };
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetch language breakdown for a repository
 */
export async function getLanguages(owner, repo) {
  const { data } = await github.get(`/repos/${owner}/${repo}/languages`);
  return data;
}

/**
 * Fetch README content
 */
export async function getReadme(owner, repo) {
  try {
    const { data } = await github.get(`/repos/${owner}/${repo}/readme`);
    if (data.encoding === 'base64' && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return '';
  } catch (error) {
    // No README found
    return '';
  }
}
