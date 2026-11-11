# Unified SOAR

A front-end prototype of a unified SOAR (Security Orchestration, Automation and Response) console. It pulls alerts from several security tools into one place for triage, investigation and team tracking.

> **Status: prototype.** Everything runs in the browser on mock data. Nothing connects to a real security product, and no state is saved: refreshing the page resets it.

## Features

- **Dashboard:** KPI cards, integration health and the active alerts table with filters, search and quick actions
- **Alerts / My Alerts:** filterable by source, severity, status and analyst
- **Alert detail:** sync status, ownership, escalate and close actions, a risk-score gauge, and 8 tabs (Overview, Investigation, Timeline, Evidence, Threat Intelligence, Related Alerts, Source Details, Audit History)
- **Team Activity:** analyst workload, Chart.js metrics (MTTA/MTTI/MTTR, alerts by source, false-positive rate) and an activity feed
- **Integrations, Playbooks, Threat Intel, Cases, Reports, Audit Logs and Settings** (role matrix)

## Running it

No install and no build step. Either:

- open `index.html` in a browser, or
- serve the folder: `python3 -m http.server 8000`, then go to http://localhost:8000

You need an internet connection for Google Fonts and Chart.js, which load from a CDN.

## Project structure

```
index.html              Entry point; loads the CSS and JS below in order
css/
  variables.css         Design tokens (colors, fonts, radius)
  base.css              Reset and global element styles
  layout.css            Sidebar, top bar, main area
  components.css        Cards, KPIs, badges, filter bar, tables, buttons
  views.css             Alert detail, team, playbooks, settings, responsive rules
js/
  icons.js              Inline SVG icon set
  data/                 Mock data, one file per entity (alerts, analysts, cases, ...)
  nav.js                Sidebar navigation structure
  state.js              Current view, selected alert, filters
  helpers.js            Formatting and risk-score helpers
  shell.js              App shell, navigation and view router
  views/                One file per page; each returns an HTML string
  actions.js            Event handlers and alert state changes
  main.js               Boot
```

The scripts are plain globals, not ES modules, so the app still works when opened straight from disk. **Load order in `index.html` matters.** If you add a file, put it after anything it depends on.

## Mock data

All hosts, users, IPs, domains, alert IDs and campaign names in `js/data/` are fictional. Keep it that way: don't commit real alerts, indicators, hostnames, usernames or configuration from any organization's environment.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Author

Created and maintained by **Sulaiman Al-Alawi**.

## License

[MIT](LICENSE) © 2026 Sulaiman Al-Alawi
