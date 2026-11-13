# Routine integration

The **Hot Reload newsletter** scheduled task runs daily at 07:20 Europe/Sofia. It fires into a dedicated Claude Code session ("Hot Reload newsletter (daily)") that was started from this repo, so it has a checkout of `main` with push access.

Each run:

1. Researches, fills the email template and saves `hot-reload-YYYY-MM-DD.html` to the "Hot Reload" Google Drive folder. An Apps Script emails it at about 08:00.
2. Copies the same file to `issues/YYYY-MM-DD.html`, commits it and pushes to `main`.
3. The push starts `.github/workflows/pages.yml`, which rebuilds and redeploys https://zhpenkov-vibe.github.io/hotreload/.

If today's file is already in Drive, the run treats itself as a rerun: it skips research, Drive and email, and only publishes that file to the hub. Firing the task by hand is therefore safe and won't send a second email.

The run's push notification ends with "Hub updated", "Hub already up to date" or "Hub not updated: <error>".

Only `issues/` is written by the routine; `site/`, `scripts/` and the workflow are never touched by it.
