# GAS minimal template

The smallest useful setup: five source files plus clasp. What’s in the repo is what runs in Apps Script, so there’s nothing to build or debug. Choose this for small internal tools, quick prototypes, or if you edit code in the Apps Script editor. Want real `.ts`/`.css` files and a local dev server? See [`gas-sheets-vite`](https://github.com/lucas-rollin/gas-sheets-vite).

| File | Role |
|---|---|
| `Code.gs` | `doGet`, `include`, and the functions the browser can call |
| `SheetsDB.gs` | Sheets-backed storage (`SCHEMA` + `dbList_/dbGet_/dbInsert_/dbUpdate_/dbRemove_`) |
| `index.html` | Markup; pulls in the other two via `include()` |
| `StyleSheet.html` | `<style>…</style>` |
| `JavaScript.html` | `<script>…</script>`, with a `server()` Promise wrapper around `google.script.run` |

## Setup
```bash
npm install
npm run login
npx clasp create-script --type standalone --title "My App"   # or: copy .clasp.json.example -> .clasp.json and set scriptId
npm run push
```
Then in the Apps Script editor: **Project Settings > Script properties** → add `SPREADSHEET_ID`, and **Deploy > New deployment > Web app**.
(Tabs are created automatically from `SCHEMA` on first use.)

## Conventions
- Functions in `Code.gs` without a trailing `_` are callable from any browser that can open the app. Validate input there.
- Functions ending in `_` are private and blocked from `google.script.run`. Keep helpers like the DB layer private.
- Return only JSON-safe values (no `Date` objects) from client-callable functions.
- Add a table: add it to `SCHEMA`, then write functions in `Code.gs` that call the `db*_` helpers.
