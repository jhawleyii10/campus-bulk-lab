# Campus Bulk Lab — automated free starter site

## Posting frequency

The site is configured to publish **one queued article every 3 days**.

The first queued article is dated **September 12, 2026**, so after setup you can publish it tonight by manually running:

GitHub → your repository → Actions → **Auto publish queued posts** → Run workflow.

After that, GitHub checks the queue automatically once per day.

## Auto-refill

Yes. This version automatically refills its active queue.

- When fewer than 6 scheduled posts remain, the script pulls more posts from `queue/reserve.json`.
- It refills the active queue up to 12 posts.
- New posts are scheduled 3 days apart.
- A reserve of prewritten articles is already included.
- The reserve is finite; when it eventually runs out, you will need to add another batch. This version does not call a paid AI API.

## Email alerts

The workflow supports automatic email notices through Resend.

Set these GitHub repository secrets:

- `RESEND_API_KEY`
- `NOTIFY_EMAIL`
- `FROM_EMAIL`

When an article publishes, the email includes the title and the current queue/reserve count.

## Free hosting

Use GitHub Pages:

Repository → Settings → Pages → Source → GitHub Actions.

The included `pages.yml` workflow deploys the site after changes are pushed.

## First-night setup

1. Create a free GitHub account.
2. Create a repository such as `campus-bulk-lab`.
3. Upload the contents of this project, preserving folders.
4. Enable GitHub Pages with GitHub Actions.
5. Add the three Resend email secrets.
6. Open Actions → Auto publish queued posts → Run workflow.
7. The September 12 post will publish immediately because it is due.
8. GitHub Pages will redeploy the site automatically.
9. You should receive the publication email if Resend is configured correctly.

## Monetization

The starter site does not contain paid affiliate IDs yet.

You will still need to apply to affiliate programs, provide your own payout/tax information, and insert your approved affiliate links.

No earnings are guaranteed. The automation reduces maintenance, but useful content, traffic, search visibility, and reader trust determine whether the site makes money.
