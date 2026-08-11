# Changelog

## [1.1.1](https://github.com/rncantos/dora-metrics/compare/v1.1.0...v1.1.1) (2026-08-11)


### Bug Fixes

* prevent generic interruption alert on backend errors ([#14](https://github.com/rncantos/dora-metrics/issues/14)) ([#15](https://github.com/rncantos/dora-metrics/issues/15)) ([611df32](https://github.com/rncantos/dora-metrics/commit/611df3292f8a7063cafb3d849e0a3fdf1ad8c9b4))

## [1.1.0](https://github.com/rncantos/dora-metrics/compare/v1.0.0...v1.1.0) (2026-07-05)


### Features

* add AI Actionable Insights, Historical PR Trend Chart, and Elite Benchmarking Chart ([b858b99](https://github.com/rncantos/dora-metrics/commit/b858b99e42f30f202e4adba631dbab4e6e9c9e74))
* AI Actionable Insights & UI improvements ([31e0d16](https://github.com/rncantos/dora-metrics/commit/31e0d1699e620189a4a502f08e7bfec1856a8dae))
* **backend:** implement real GitHub API calculator using httpx ([1c86256](https://github.com/rncantos/dora-metrics/commit/1c862568c4a9bfcc38572b74b19718c2a3df3c75))
* **docs:** add LICENSE and CONTRIBUTING.md ([eeba5b5](https://github.com/rncantos/dora-metrics/commit/eeba5b5ead390fef001539e890be78f497cdffa4))
* **integrations:** add Slack Block Kit alerts for DORA metrics ([298410a](https://github.com/rncantos/dora-metrics/commit/298410a1efb86bb242bf8291cca33f4e11e1901c))
* **pdf:** add corporate headers, footers, logo and fix pagination cuts ([d7313c2](https://github.com/rncantos/dora-metrics/commit/d7313c218c04c9401f97e0dd75d1242a9686e91b))
* **pdf:** add cover page, enforce english, justify text, and calibrate A4 margins ([dfdb4f7](https://github.com/rncantos/dora-metrics/commit/dfdb4f758004a0b223f16bac9ae5f158839cc6ef))
* **pdf:** inject true vector headers and footers on every page via jsPDF hooks ([cf63a85](https://github.com/rncantos/dora-metrics/commit/cf63a851bf0f8eabbb7d4961eac3908b2fefbbc2))
* **pdf:** redesign pdf export to enterprise corporate template ([dbbec1f](https://github.com/rncantos/dora-metrics/commit/dbbec1f1991b6f0197e20b23fa75bb1e48be88d0))
* **ui:** add date and team filter controls ([07a97ec](https://github.com/rncantos/dora-metrics/commit/07a97eca78148117e90e4c5b1cef6518ff0c6222))
* **ui:** add drill-down analytics modal with interactive charts ([5e00452](https://github.com/rncantos/dora-metrics/commit/5e00452a0a6747ec18d250f806d277214483a25e))
* **ui:** add verbose mode for terminal logs showing tool inputs ([667543a](https://github.com/rncantos/dora-metrics/commit/667543a466f9a04f0260e401197b0d9a056dfa4e))
* **ui:** add wow effect success overlay when analysis finishes ([1175792](https://github.com/rncantos/dora-metrics/commit/11757923fc5b0f4097bfdad6444c88391b9be01d))
* **ui:** add wow effect to PDF generation and prevent layout jumping ([21965a4](https://github.com/rncantos/dora-metrics/commit/21965a4fbf58162bd2135a4da178becec9dda5bd))
* **ui:** implement light/dark mode theme toggle system ([6e80dc5](https://github.com/rncantos/dora-metrics/commit/6e80dc5e01a0f5a278944a0da7871c55b7a783aa))
* **ui:** redesign app with modern minimalist glassmorphism style ([d32c3dd](https://github.com/rncantos/dora-metrics/commit/d32c3dd6ce72ae35f4d244b776ba64892ba9485d))


### Bug Fixes

* **agent:** escape curly braces in prompt template to prevent KeyError crash ([859c744](https://github.com/rncantos/dora-metrics/commit/859c744987e38fb6f1662c081d532d7a7e0a67ca))
* **ci:** change release-please type to simple to support full repo without root package.json ([5b8e2ed](https://github.com/rncantos/dora-metrics/commit/5b8e2ed473639bd738b1e3de408b92942a74570a))
* **ci:** remove github pages deployment ([2156c88](https://github.com/rncantos/dora-metrics/commit/2156c8861c3930236c6738b632e2586a750a3d3f))
* **deps:** add fastapi to requirements.txt ([9734523](https://github.com/rncantos/dora-metrics/commit/9734523f7af697411d343e61695bcf32ad3221ba))
* **frontend:** remove trailing brace causing build failure ([74bc030](https://github.com/rncantos/dora-metrics/commit/74bc03055014808cd290ebe360c15f76e240823c))
* **frontend:** remove unused CountUp variable to fix ESLint CI error ([88a497a](https://github.com/rncantos/dora-metrics/commit/88a497a69c9f3a7150e0ba6ff8f83a7c3c8a7ffa))
* **pdf:** enforce exact DOM pagination to prevent text and charts from being sliced mid-page ([e79dee9](https://github.com/rncantos/dora-metrics/commit/e79dee908bc9741f13e9e03dbaebcfa3c8c0f8f8))
* **pdf:** fix blank pdf by bringing element into view temporarily during render ([090f726](https://github.com/rncantos/dora-metrics/commit/090f7260527350230f19f61cf64472feac084ca8))
* **pdf:** restore original fluid layout and use continuous page generation to prevent slicing ([281f946](https://github.com/rncantos/dora-metrics/commit/281f94645a7cc72e50fe5c483011bbf5afc842b7))
* **pdf:** robust PDF generation with dom-to-image-more and jspdf for Safari/Mac compatibility ([3441121](https://github.com/rncantos/dora-metrics/commit/3441121bb2daafd9346586123f88ca8f4d33b1d2))
* PyGithub list index out of range on paginated lists ([eeba5b5](https://github.com/rncantos/dora-metrics/commit/eeba5b5ead390fef001539e890be78f497cdffa4))
* resolve streaming errors and update to gemini-2.5-flash ([c56a5dc](https://github.com/rncantos/dora-metrics/commit/c56a5dcc6f0fbed9491f51dda7efbdccef3c9877))
* **ui:** ensure verbose terminal appears and fix PDF layout cutting off new charts ([5d4d7f8](https://github.com/rncantos/dora-metrics/commit/5d4d7f853be730b8779521f7777bd67457dee8fb))
* **ui:** fix empty catch block lint error ([7051c89](https://github.com/rncantos/dora-metrics/commit/7051c89799b2792a9b0b89a9aa606f5de5330a16))
* **ui:** fix react component import crashes ([47f387e](https://github.com/rncantos/dora-metrics/commit/47f387e8058368ba039be11c938b4eda28780d32))
* **ui:** resolve ReferenceError on handleAnalyze ([4e5783c](https://github.com/rncantos/dora-metrics/commit/4e5783ccd07b9497882451e6edabf7b2329e4c20))
* **ui:** restore missing state variable that caused crash ([39e1050](https://github.com/rncantos/dora-metrics/commit/39e10504ea4c05b67cc1e9132ad2237978e90e9d))
