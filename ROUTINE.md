# Routine integration

The "Hot Reload newsletter" routine (daily 07:20 Sofia) adds each issue here. Paste the block below into the routine prompt, between step 4 (Save to Drive) and the final "Finish with…" line.

```markdown
## 5. Publish to the hub archive (only after the Drive save succeeded)
The private GitHub repo zhpenkov-vibe/hotreload keeps every issue for the hub site. Add today's issue to it. This step must never delay, change or replace the Drive delivery.
- Load the tool with ToolSearch: "select:mcp__claude-code-remote__add_repo" (if not found, search "add_repo"). Call add_repo with owner "zhpenkov-vibe", repo "hotreload", access "push", and follow its instructions: ONE inline clone, e.g. `git clone --depth 1 https://github.com/zhpenkov-vibe/hotreload /home/claude/hotreload` (if that directory exists and is not a clone, use /home/claude/hotreload-repo). On HTTP 429 wait 5s and retry once. Then call register_repo_root with the path if it accepts it (ignore a failure).
- In the clone: `git config user.name "zhpenkov-vibe"` and `git config user.email "zkpenkov@gmail.com"`. Never use another email in commits.
- Copy the exact file you uploaded: `cp issue.html issues/<YYYY-MM-DD>.html` (Sofia date, e.g. issues/2026-11-12.html). Do not edit it. If that file already exists with identical content, skip the rest of this step.
- `git add issues && git commit -m "issue: <YYYY-MM-DD>"` (end the message with the attribution lines your system context asks for, if any), then `git push origin main`. If the push is rejected as non-fast-forward, `git pull --rebase origin main` and push once more.
- If pushing to main is refused by the proxy or permissions, fall back once to the contents API: `gh api -X PUT repos/zhpenkov-vibe/hotreload/contents/issues/<YYYY-MM-DD>.html -f message="issue: <YYYY-MM-DD>" -f branch=main -f content="$(base64 -w0 issue.html)"`.
- Only touch issues/. Never change site/, scripts/ or workflows, never force-push, never open a PR for this.
- If anything here fails, stop retrying and add one line "Hub not updated: <exact error>" to your final summary.

Finish with a 2–3 line summary of today's top three so the push notification is useful. Add "Hub updated" or the "Hub not updated" line at the end.
```
