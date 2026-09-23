# Toolshop Automation

[![Playwright Tests](https://github.com/sharonrodriguez22/toolshop-automation/actions/workflows/playwright.yml/badge.svg)](https://github.com/sharonrodriguez22/toolshop-automation/actions/workflows/playwright.yml)

UI and API test automation framework built with Playwright and TypeScript, running
on GitHub Actions against a containerised instance of the application under test.

**[Latest test report](https://sharonrodriguez22.github.io/toolshop-automation/)** —
published automatically on every run.

The application under test is [Toolshop](https://practicesoftwaretesting.com)
(sprint5), the demo shop from the
[practice-software-testing](https://github.com/testsmith-io/practice-software-testing)
project: an Angular front end on a Laravel REST API.

This repository is a portfolio project. It is written to be read, so the
reasoning behind each structural decision is documented below rather than left
implicit in the code.

---

## What is covered

Ten tests across two layers, plus an authentication setup project.

**UI (`ui-chromium`)**

| Test | What it proves |
| --- | --- |
| the home page loads and shows the catalog | The app boots and renders products |
| searching filters the catalog and every result matches | Search narrows the list *and* every result is relevant — not just that the count changed |
| a search with no results shows the empty state | The negative path renders `no-results`, and the grid is genuinely empty |

**API (`api`)**

| Test | What it proves |
| --- | --- |
| GET /products returns a page of the catalog | Pagination envelope is coherent: `current_page`, `per_page`, `total` |
| every product carries a price, a category and a brand | Contract check over every item in the page, including nested objects |
| the API search filters the catalog | Search returns a strict subset of the catalog |
| a nonexistent product returns 404 | Error handling, not just happy paths |
| an authenticated user can read their own profile | Bearer token flow works end to end |
| the profile endpoint returns 401 without a token | The endpoint is actually protected |

The last two are a pair on purpose. A test that only checks the authenticated
case cannot tell a working guard from a missing one.

---

## Stack

| | |
| --- | --- |
| Test runner | Playwright `^1.63` |
| Language | TypeScript `^7` (strict, `noUnusedLocals`, `noUnusedParameters`) |
| CI | GitHub Actions — on push, on pull request, and weekly on Mondays |
| Reporting | Playwright HTML report, published to GitHub Pages |
| Test data | `@faker-js/faker` for generated users |

---

## Getting started

Requires Node 22 or newer.

```bash
git clone https://github.com/sharonrodriguez22/toolshop-automation.git
cd toolshop-automation
npm ci
npx playwright install
cp .env.example .env
npm test
```

`.env` is gitignored; `.env.example` holds every variable the suite needs and is
safe to copy as-is. The credentials in it are demo accounts seeded and publicly
documented by the Toolshop project, not private secrets:

| Account | Password | Role |
| --- | --- | --- |
| `admin@practicesoftwaretesting.com` | `welcome01` | admin |
| `customer@practicesoftwaretesting.com` | `welcome01` | customer |
| `customer2@practicesoftwaretesting.com` | `welcome01` | customer |
| `customer3@practicesoftwaretesting.com` | `pass123` | customer |

### Scripts

| Command | What it runs |
| --- | --- |
| `npm test` | UI and API suites — the same selection CI runs |
| `npm run test:ui` | UI only |
| `npm run test:api` | API only |
| `npm run test:bugs` | The API specs against the intentionally defective build (see below) |
| `npm run test:headed` | UI with a visible browser |
| `npm run test:debug` | Playwright UI mode |
| `npm run report` | Opens the last HTML report |
| `npm run typecheck` | `tsc --noEmit` |

---

## Layout

```
src/
  api/        ProductsClient, response types
  pages/      Page Objects
  fixtures/   Composed Playwright fixtures
  data/       Test-data factories
tests/
  api/        API specs
  ui/         UI specs
  auth.setup.ts   Logs in once, saves the session
```

---

## Design decisions

### Page Objects expose locators, not values

`ProductsPage` exposes `readonly productCards: Locator` rather than a
`visibleProductCount(): Promise<number>` method. The method version looks
tidier and is a trap: it resolves to whatever the number happens to be in that
microsecond and throws away Playwright's auto-waiting. Handing the `Locator` to
the test lets `expect()` retry.

Page Objects also carry no assertions. Assertions live in the test, which is
where the intent is readable.

### Waiting on the application's own render signal

The first version of `searchFor()` awaited the network response. It was flaky,
and the reason is worth recording. Measured against the live app, searching
`hammer` then `pliers` without reloading:

```
                  marker   cards
initial             no       9
hammer, on click    no       9     ← the API response has already arrived here
hammer, +1200ms     YES      6
pliers, on click    no       6     ← the marker is removed by the click itself
pliers, +1200ms     YES      4
```

The response lands while the list still shows the previous results. A test
reading at that point gets the unfiltered catalog and fails with a baffling
message: *expected fewer than 9, received 9*.

The app adds a `search_completed` marker to the DOM when it has finished
rendering, and removes it when a new search starts. Both halves matter: without
the removal, a second search would find a stale marker and skip the wait
entirely. When an application exposes a signal like this, waiting on it beats
inferring the moment from network traffic.

### Worker-scoped authentication for the API

`POST /users/login` returns a token with `expires_in: 300`. Logging in per test
would waste five seconds of every run on an endpoint already covered by its own
test; caching the token globally would risk it expiring mid-run on a slow
suite. The `authedRequest` fixture is therefore **worker-scoped**: one login per
worker, well inside the five-minute window.

The UI takes a different route — `auth.setup.ts` logs in through the browser
once and saves `storageState`, which the `ui-chromium` project loads. The login
form is exercised for real, exactly once.

### `testIdAttribute: 'data-test'`

Toolshop marks its elements with `data-test`, not Playwright's default
`data-testid`. Setting this once in the config means every `getByTestId()` call
in the suite works; without it they all silently match nothing.

### `locale: 'en-US'`

The app ships in seven languages and picks one from the browser. Pinning the
locale is what keeps `toHaveTitle(/Practice Software Testing/)` from depending
on where the test happens to run.

### Fixtures compose in a chain

`src/fixtures/api.ts` defines the worker-scoped `authedRequest`;
`src/fixtures/test.ts` extends *that* with the test-scoped `productsPage` and
`productsClient`. Every spec imports from a single place, and the two scopes
stay separate.

### Retries only in CI

`retries: 2` and `workers: 1` apply under `CI` alone. Locally, retries are off:
a flaky test should be visible while it is being written, not smoothed over.

---

## Running against the intentionally broken build

The Toolshop project publishes the same API with deliberate defects. The
`api-bugs` project points the API specs at it:

```bash
npm run test:bugs
```

The purpose is to check that the suite fails when the application is broken — a
suite that passes against a defective build is not testing anything. This
project is deliberately excluded from the CI run, since its expected outcome is
failure.

---

## CI: the application under test runs inside the pipeline

The pipeline does not test the public site. It clones the Toolshop repository,
starts it with Docker Compose, seeds the database, waits for both tiers to
answer, and only then runs the tests. A full run takes about two minutes.

That choice was forced by a failure, and so were two of the steps:

**The public site blocks CI runners.** GitHub's runners come from datacenter IP
ranges. The site's bot protection served a security-verification page instead
of the application, and every UI test failed on a page that was not the app.
Working around bot detection was never an option — it is fragile and it is not
the right answer. Bringing the application into the pipeline removes the
dependency altogether.

**The containers start with an empty database.** `migrate:fresh --seed` is a
manual step in the Toolshop project; its Docker instructions do not mention it.
Without it the API answers correctly and returns zero products, so the suite
fails on assertions that look like test bugs. The pipeline runs the seed in a
retry loop, because MariaDB needs a few seconds after `up -d` before it accepts
connections.

**Two of the prebuilt images are arm64-only.** `practice-software-testing-web`
and `-cron` on Docker Hub were last pushed in July 2025 from an ARM machine.
On an amd64 runner both die with `exec format error`, so nginx never starts and
nothing listens on port 8091. The sprint-tagged API and UI images are amd64 and
current. `web` is nginx plus a vhost config, so the pipeline builds it from the
official multi-arch base image instead, and parks `cron` behind a Compose
profile — no test needs it.

### Every wait explains itself

Two pipeline runs were lost to a five-minute timeout whose only output was
*"the API did not become ready"*. The cause was in the container logs the whole
time. Each wait loop now prints `docker compose ps -a`, the logs of the
container it was waiting on, and a verbose `curl` before it exits:

```yaml
echo "The API did not become ready within 2 minutes"
docker compose ps -a
docker compose logs web --tail=40
curl -sv "$API_BASE_URL/status" 2>&1 | tail -20
exit 1
```

A timeout that does not say why it timed out is a bad test, in a pipeline
exactly as much as in an assertion.

---

## Findings in the application under test

Three defects surfaced while building this suite. None were the goal of a test;
all three came out of debugging.

**The result counter briefly shows a wrong number.** Searching `hammer` renders
*"45 products found for 'hammer'"* for under half a second before settling on
the correct *"6 products found"*. A user on a slow connection sees it. Found
while diagnosing the flaky search test.

**The Docker setup in the project's README does not mention seeding.** Following
the production instructions verbatim yields a running application with an empty
catalog and no indication that a step is missing. `init-data.sh` exists, but the
README's Docker section does not reference it.

**Two published Docker images are arm64-only and 14 months stale.**
`practice-software-testing-web` and `-cron` cannot run on amd64 hosts, which
includes every standard CI runner. The project's own pipeline builds from source
rather than using these images, so the documented production path appears to be
untested on amd64.

---

## Not covered yet

- **Cart and checkout.** The most valuable untested flow, at both layers. The
  user factory in `src/data/` is in place for the registration path it needs.
- **Cross-browser.** Only Chromium runs today; Firefox and WebKit are a config
  change away but would triple the run time for little signal at this size.
- **Accessibility and visual regression.** Out of scope for now, deliberately.

---

## License

MIT — see [LICENSE](LICENSE).
