# Routine integration

The "Hot Reload newsletter" routine (daily 07:20 Sofia) adds each issue here. The routine prompt already contains the block below (it was added on 2026-11-13). It runs in a session with no git access to this repo, so it writes through the GitHub connector that is attached to the routine. For reference, the block sits between step 4 (Save to Drive) and the final "Finish with…" line.

```markdown
## 5. Publish to the hub site (only after the Drive save succeeded)
The public GitHub repo zhpenkov-vibe/hotreload holds every issue for the hub site (https://zhpenkov-vibe.github.io/hotreload/); a commit to main redeploys it automatically. Add today's issue with the GitHub CONNECTOR. Do NOT clone, and do not use git, gh or add_repo: this session has no git access to the repo, only the connector. This step must never delay, change or replace the Drive delivery.
- Load the tools with ToolSearch: "select:mcp__github__create_or_update_file,mcp__github__get_file_contents" (if not found, search "github create_or_update_file").
- Call mcp__github__create_or_update_file with owner "zhpenkov-vibe", repo "hotreload", branch "main", path "issues/<YYYY-MM-DD>.html" (Sofia date, e.g. issues/2026-11-14.html), message "issue: <YYYY-MM-DD>", and content = the full text of issue.html exactly as uploaded to Drive (plain text, not base64; do not edit it).
- If it fails because the file already exists, call mcp__github__get_file_contents for that path with ref "main". If its content is identical, the hub is already up to date. Otherwise call create_or_update_file once more with the sha it reported.
- Only ever write issues/<date>.html. Never touch any other file, never open a PR.
- If anything here fails, stop retrying and add one line "Hub not updated: <exact error>" to your final summary.

Finish with a 2–3 line summary of today's top three so the push notification is useful. Add "Hub updated" or the "Hub not updated" line at the end.
```
