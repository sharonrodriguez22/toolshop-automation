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

Twenty-two tests across two layers, plus an authentication setup project.

### UI (`ui-chromium`)

| Test | What it proves |
| --- | --- |
| the home page loads and shows the catalog | The app boots and renders products |
| searching filters the catalog and every result matches | Search narrows the list *and* every result is relevant — not just that the count changed |
| a search with no results shows the empty state | The negative path renders `no-results`, and the grid is genuinely empty |
| adding a product from its detail page puts it in the cart | The add-to-cart path works end to end, through two chained requests |
| the header badge shows the quantity added | The cart count is shared state, updated outside the page that changed it |
| changing the quantity updates the line price | The line total is recalculated, not just the stored quantity |
| removing the only product leaves the cart empty | Removal actually clears the row |
| a signed-in customer can check out and the order reaches the API | The whole four-step wizard — **currently an expected failure, see Findings** |

### API (`api`)

| Test | What it proves |
| --- | --- |
| GET /products returns a page of the catalog | Pagination envelope is coherent: `current_page`, `per_page`, `total` |
| every product carries a price, a category and a brand | Contract check over every item in the page, including nested objects |
| the API search filters the catalog | Search returns a strict subset of the catalog |
| a nonexistent product returns 404 | Error handling, not just happy paths |
| an authenticated user can read their own profile | Bearer token flow works end to end |
| the profile endpoint returns 401 without a token | The endpoint is actually protected |
| a new cart is created empty | `POST /carts` returns a usable, empty cart |
| adding a product stores it with the requested quantity | The item and its quantity survive the round trip |
| updating the quantity replaces the previous value | An update replaces rather than accumulates |
| removing the product empties the cart | `DELETE` on an item returns 204 and the cart is empty |
| deleting the cart makes it unreachable | 204, and the next read is a 404 |
| a cart that does not exist returns 404 | Message: *Requested item not found* |
| adding to a cart that does not exist returns 404 | Message: *Cart not found* |
| a quantity outside the allowed range is rejected | 422 below 1 and above 99 |

Some of these pair up on purpose. A test that only checks the authenticated
profile cannot tell a working guard from a missing one. The two 404s carry
*different* messages, so asserting the message is what tells the read path and
the write path apart.

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
| `npm run test:bugs` | The API specs against the intentionally defective build |
| `npm run test:headed` | UI with a visible browser |
| `npm run test:debug` | Playwright UI mode |
| `npm run report` | Opens the last HTML report |
| `npm run typecheck` | `tsc --noEmit` |

---

## Layout

```
src/
  api/        ProductsClient, CartClient, InvoiceClient, response types
  pages/      Page Objects, plus a Header component object
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

### Wait for the application's own signal, not for something that resembles it

This suite got the same lesson three times, in three different places, and each
one produced a different kind of wrong answer. They are worth recording
together.

**Searching.** The first version of `searchFor()` awaited the network response.
Measured against the live app, searching `hammer` then `pliers` without
reloading:

```
                  marker   cards
initial             no       9
hammer, on click    no       9     ← the API response has already arrived here
hammer, +1200ms     YES      6
pliers, on click    no       6     ← the marker is removed by the click itself
pliers, +1200ms     YES      4
```

The response lands while the list still shows the previous results, so a test
reading there gets the unfiltered catalog and fails with *expected fewer than 9,
received 9*. The app adds a `search_completed` marker when it has finished
rendering, and removes it when a new search starts. Both halves matter: without
the removal, a second search would find a stale marker and skip the wait.

**Adding to the cart.** `add()` waited for the first `POST` whose URL contained
`/carts`. The application makes two: `POST /carts` to create the cart, then
`POST /carts/{id}` to put the item in it. The wait matched the creation and
returned too early, the item request was cancelled by the next navigation, and
the cart came up empty — intermittently, because whether it was cancelled
depended on timing. Matching on the shape of the path is what tells them apart.

**Entering the billing step.** Waiting for the `GET /users/me` response was not
enough either. Playwright sees the response arrive before the application's own
subscriber has written it into the form, so the test still typed too early and
was overwritten. The fix waits on the *effect* — the street field holding a
value — not on the response that causes it.

The general form: a proxy for the signal is not the signal. Network traffic,
in particular, arrives before the UI has reacted to it.

### `Accept: application/json` is not optional

The API projects and every request context set it explicitly. Without it,
Laravel answers a failed validation with `redirect()->back()` instead of a 422,
and Playwright follows the redirect — turning a validation error into a
bewildering 404 from the API root. The real front end sends this header, so a
client that omits it is not exercising the same code path as the application's
own consumer.

### Worker-scoped authentication for the API

`POST /users/login` returns a token with `expires_in: 300`. Logging in per test
would waste five seconds of every run on an endpoint already covered by its own
test; caching the token globally would risk it expiring mid-run on a slow
suite. The `authedRequest` fixture is therefore **worker-scoped**: one login per
worker, well inside the five-minute window.

The UI takes a different route — `auth.setup.ts` logs in through the browser
once and saves `storageState`, which the `ui-chromium` project loads. The login
form is exercised for real, exactly once.

### The subject under test and the data source are different clients

`productsClient` and `cartClient` are built on Playwright's `request` fixture,
which follows the project's `baseURL`. That is what lets the `api-bugs` project
aim the same specs at the intentionally defective build.

Setup data must not move with them. A UI test that needs a product id before it
can start uses the `catalog` fixture, pinned to the real API whatever project is
running, and never the subject of an assertion.

### Cart isolation comes free, and it is worth knowing why

The cart id lives in `sessionStorage`, and Playwright's `storageState` persists
cookies and `localStorage` only. Every test starts from the same snapshot with
an empty `sessionStorage`, so each one creates its own cart with no help from
the suite. Worth stating explicitly, because the obvious assumption — that a
shared signed-in session means a shared cart — is what would send you building
an isolation mechanism the application does not need.

### `testIdAttribute: 'data-test'`

Toolshop marks its elements with `data-test`, not Playwright's default
`data-testid`. Setting this once in the config means every `getByTestId()` call
in the suite works; without it they all silently match nothing.

### `locale: 'en-US'`

The app ships in seven languages and picks one from the browser. Pinning the
locale is what keeps `toHaveTitle(/Practice Software Testing/)` from depending
on where the test happens to run.

### Retries only in CI

`retries: 2` and `workers: 1` apply under `CI` alone. Locally, retries are off:
a flaky test should be visible while it is being written, not smoothed over.

### One test is expected to fail

`tests/ui/checkout.spec.ts` is annotated with `test.fail()`. It documents a
defect that loses real orders (finding 6 below). Playwright reports an expected
failure as a pass, so the pipeline stays green and the defect stays visible in
the report; if the application is fixed, the run reports an *unexpected pass*
and the annotation comes off.

Making it green by clicking confirm twice would have worked. It would also have
hidden the defect, which is the opposite of the job.

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

Six defects surfaced while building this suite. None were the goal of a test;
all six came out of debugging.

**1 — The checkout confirms an order that was never created.** The most serious
one. `PaymentComponent.checkPayment()` returns `of(this.state)` synchronously,
while `this.state` is only assigned inside the subscriber of the validation
request it depends on:

```ts
checkPayment(paymentPayload: any): Observable<boolean> {
  if (!this.state) {
    this.paymentService.validate(endpoint, paymentPayload).subscribe({
      next: (res) => { this.paymentMessage = res.message; this.state = true; },
      ...
    });
  }
  return of(this.state);   // read before the response that sets it
}
```

On the first confirm the returned value is still `undefined`, so the
`if (result === true)` guard is false and `createInvoice` never fires. The
customer is shown **"Payment was successful"** regardless, because that banner
is bound to the payment-check message rather than to the order existing. A
second confirm does create the invoice, since `this.state` is true by then.

Reproducible by hand: check out, confirm once, and look for the invoice —
there is none. Compounding it, the `createInvoice` error branch is empty
(`error: () => { // handle error if needed }`), so a genuine failure would be
swallowed the same way.

The suite catches this only because the checkout test confirms through
`GET /invoices` instead of trusting the banner. A test that ended at
`expect(successMessage).toBeVisible()` would be green right now, over a lost
order.

**2 — A saved address never loads back into the checkout form.** `GET /users/me`
returns the country as a display name (`"country": "Austria"`), while the form's
country `<select>` is built from ISO codes (`value="AT"`). Patching a select
with a value no option carries resolves to empty, so the saved country silently
disappears — along with `house_number` and `postal_code`, which the record
stores as `null`. All three are required, leaving "proceed to checkout"
permanently disabled until the customer fills them in by hand.

**3 — The result counter briefly shows a wrong number.** Searching `hammer`
renders *"45 products found for 'hammer'"* for under half a second before
settling on the correct *"6 products found"*. A user on a slow connection sees
it.

**4 — The cart's remove control has no test hook.** Every other element in the
cart and checkout flow carries a `data-test` attribute. The remove button is
`<a class="btn btn-danger">` with an icon inside, so it can only be located
structurally, by its class within the product's row — a selector that breaks on
any markup change. A testability defect rather than a user-facing one.

**5 — The Docker setup in the project's README does not mention seeding.**
Following the production instructions verbatim yields a running application with
an empty catalog and no indication that a step is missing. `init-data.sh`
exists, but the README's Docker section does not reference it.

**6 — Two published Docker images are arm64-only and 14 months stale.**
`practice-software-testing-web` and `-cron` cannot run on amd64 hosts, which
includes every standard CI runner. The project's own pipeline builds from source
rather than using these images, so the documented production path appears to be
untested on amd64.

---

## Not covered yet

- **Guest checkout.** The wizard has a separate guest path (`proceed-2-guest`)
  that this suite does not exercise.
- **Registration.** The user factory in `src/data/` is in place for it.
- **Cross-browser.** Only Chromium runs today; Firefox and WebKit are a config
  change away but would triple the run time for little signal at this size.
- **Accessibility and visual regression.** Out of scope for now, deliberately.

---

## License

MIT — see [LICENSE](LICENSE).
