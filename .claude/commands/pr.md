Prepare the current work for a pull request into main (main is protected; never push to it directly).

1. Run `cd frontend && npm run build` and stop if it fails.
2. Show me `git status` and a short summary of the diff.
3. Propose a branch name and a commit message, then wait for my OK.
4. After I approve: create the branch, commit, push, and print the `gh pr create` command
   (or the GitHub compare URL if gh isn't installed). Fill the PR body from .github/pull_request_template.md.
