#!/usr/bin/env node

/**
 * pre-commit-review.js - PreToolUse hook (Bash)
 *
 * Blocks `git commit` commands until a code review flag exists.
 * Workflow:
 *   1. Claude attempts `git commit` -> hook blocks with review reminder
 *   2. Claude runs /code-review or /presubmit on staged changes
 *   3. Claude creates the flag: touch .claude/.review-passed
 *   4. Claude retries `git commit` -> hook allows and consumes the flag
 *
 * Flag expires after 10 minutes to prevent stale approvals.
 * Fail-open: parse errors or unexpected issues allow the commit through.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const FLAG_FILE = path.join(PROJECT_ROOT, '.claude', '.review-passed');
const SKIP_FILE = path.join(PROJECT_ROOT, '.claude', '.skip-commit-review');
const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      run(input);
    } catch {
      process.exit(0); // fail open on unexpected errors
    }
  });
}

function run(input) {
  let event;
  try {
    event = JSON.parse(input);
  } catch {
    process.exit(0); // fail open on parse errors
  }

  const cmd = event.tool_input?.command || '';

  // Only intercept git commit commands
  if (!isGitCommit(cmd)) {
    process.exit(0);
  }

  // Skip review for non-code repos (opt-out via .claude/.skip-commit-review)
  if (fs.existsSync(SKIP_FILE)) {
    process.exit(0);
  }

  // Check for review flag
  if (fs.existsSync(FLAG_FILE)) {
    try {
      const stat = fs.statSync(FLAG_FILE);
      const age = Date.now() - stat.mtimeMs;
      if (age < MAX_AGE_MS) {
        fs.unlinkSync(FLAG_FILE); // consume the flag
        process.exit(0); // allow commit
      }
      // Stale flag - remove and block
      fs.unlinkSync(FLAG_FILE);
    } catch {
      // If we can't read/delete the flag, fall through to block
    }
  }

  // Block - no recent review
  process.stdout.write(
    '[pre-commit-review] Code review required before committing.\n' +
    'Steps:\n' +
    '  1. Run /code-review on the staged changes\n' +
    '  2. Create the review flag: touch .claude/.review-passed\n' +
    '  3. Retry the commit\n' +
    'Flag expires after 10 minutes.'
  );
  process.exit(2);
}

function isGitCommit(cmd) {
  // Match: git commit, git commit -m, git commit -am, etc.
  // Skip: git commit --amend (checkpoint workflows)
  return /\bgit\s+commit\b/.test(cmd);
}

main();
