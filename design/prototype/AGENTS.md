<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture

- Badzy is a design prototype: every screen is a route under the pathless `_stage` layout, which renders `<Outlet />` inside `src/badzy/Stage.tsx` (dark stage, fit-to-viewport scaling, screen index overlay, accent theme switching via `data-theme`).
- All Badzy colors, type, radii, and shadows are tokens in `src/styles.css` (`bg-panel`, `text-accent`, …). Components must never hardcode colors; accent themes and light mode are pure token swaps. The uploaded logo asset pointer lives at `src/assets/badzy-logo.png.asset.json` — never redraw the logo; reuse the asset.
