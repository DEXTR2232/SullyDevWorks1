# Contributing

## Workflow

1. Never commit straight to `main`. Create a branch: `feature/<short-name>` or `fix/<short-name>`.
2. Keep each pull request to one change, such as one view, one fix or one data update.
3. Open a pull request into `main`. The other person reviews it before it's merged.
4. Before opening the PR, open `index.html` and click through the pages you touched. Make sure the browser console shows no errors.

## Where things go

- **New page:** add `js/views/<name>.js` with a `view<Name>()` function that returns an HTML string. Then:
  - add a `<script>` tag for it in `index.html`, in the Views section
  - add a `case` in `renderView()` in `js/shell.js`
  - add a nav entry in `js/nav.js`
- **New mock data:** add or edit a file in `js/data/` and load it in `index.html` before anything that uses it.
- **Styles:** use the CSS variables in `css/variables.css` instead of hardcoded colors. Put the rule in the file that matches its scope (layout, components or views).

## Rules

- **No real data.** No real alerts, IOCs, hostnames, usernames, IPs, or internal configuration from any employer or client. Everything in `js/data/` must be invented.
- **No secrets.** No API keys, tokens or credentials, not even for testing.
- **Escape user input.** Anything a user types, such as notes or search text, must be escaped before it's inserted with `innerHTML`.
