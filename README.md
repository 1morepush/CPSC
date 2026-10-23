# Carolina Pulmonary & Sleep Clinic: website redesign

A modern, mobile-friendly redesign of [carysleep.com](https://carysleep.com/), the website of
Carolina Pulmonary & Sleep Clinic (Dr. Priyan Samarakoon, MD) in Cary, North Carolina.

It is a plain static site (HTML, one stylesheet and one script) with no build step and no dependencies.
Every page keeps its original file name, so links to the current site keep working once it is uploaded.

![The home page on a desktop browser](docs/screenshots/home-desktop.jpg)

![The home page, the COPD page and the menu on a phone](docs/screenshots/phones.jpg)

## Highlights

- **Same content.** Wording, links, forms and contact details come from the live site. Only proofreading
  fixes were made (spelling, spacing, punctuation, broken in-page links), and every one is listed in
  [docs/text-corrections.md](docs/text-corrections.md).
- **New look.** A night-sky hero with drifting stars and a glowing moon, the logo's purple carried through
  the whole site, and Fraunces and Plus Jakarta Sans type.
- **Motion with restraint.** Sections rise into view as you scroll, cards respond to the cursor, and pages
  cross-fade in browsers that support it. Motion switches off for visitors who turn on "reduce motion" on
  their device, and decorative loops pause while they are off screen.
- **Built for phones.** A full-screen menu, a call / directions / patient portal bar at the bottom of the
  screen, and swipeable section chips that follow along as you read. Nothing scrolls sideways, from 320 px
  phones up to tablets.
- **Fast and accessible.** WebP images, self-hosted fonts, and analytics that load after the page.
  Lighthouse (mobile, seven pages): Performance 96–98, Accessibility 100, Best Practices 96–100, SEO 100.

![The Patient Services section of the home page](docs/screenshots/services-desktop.jpg)

![The Sleep Apnea page](docs/screenshots/sleep-apnea-desktop.jpg)

## Pages

| Menu | Pages |
|---|---|
| Home | `index.html` |
| Meet The Doctor | `meet_the_doctor.html` |
| Patient Services | `patient_services.html` |
| Patient Education: Pulmonary | `pulmonolgist.html`, `pulmonary_medicine.html`, `asthma.html`, `COPD.html`, `sarcoidosis.html`, `lung_cancer.html`, `bronchoscopy.html` |
| Patient Education: Sleep | `sleep_medicine.html`, `insomnia.html`, `narcolepsy.html`, `restless-legs-syndrome.html`, `parasomnia.html`, `sleep_apnea.html` |
| New Patients | `new_patients.html` |
| Sleep Lab | `sleep_lab.html` |
| Directions | `directions.html` |
| Patient Forms (header button) | `patient_forms.html`, with the 14 PDF forms in `pdf/` |

`pulmonolgist.html` keeps the old site's spelling on purpose, so existing links to it don't break.

## Run it locally

Nothing to install; any static file server works. With Python:

```sh
cd carysleep-redesign
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Put it online

Upload the **contents** of `carysleep-redesign/` to the website's root folder, replacing the old files.
Because the file names match the current site, bookmarks, Google results and links from other sites keep
working.

For a preview link before going live, the folder also works as-is on GitHub Pages, Netlify or Cloudflare
Pages (publish directory: `carysleep-redesign`).

## Editing

- Each page is a self-contained HTML file. The header, menu and footer are repeated in every page, so a
  change there (a new phone number, say) is a find-and-replace across the 20 files.
- Styles are in `css/site.css`, with the colors and fonts defined as variables at the top. Menus, scroll
  effects and animations are in `js/site.js`.
- Each photo in `images/` has a `.webp` copy next to it; replace both when swapping a photo.

## Before going live

- **Analytics:** every page still loads the old site's Google Analytics ID (`UA-135206279-1`), in the
  `<head>`. Universal Analytics stopped collecting data in July 2023, so replace it with a GA4 measurement
  ID or remove the snippet.
- **Search box:** the search field in the menu came from the old site's template and, like on the current
  site, doesn't search anything. Connect it to a site search or remove it.
- **Patient forms password:** some forms open after a password prompt carried over from the old site. The
  check runs in the browser and the password is visible in the page source, so it only deters casual
  visitors.
- **Content to review:** a few medical statements look out of date (lung cancer screening, COPD
  statistics). They are listed at the end of [docs/text-corrections.md](docs/text-corrections.md).

## Project layout

```text
carysleep-redesign/
├── *.html            20 pages, named as on carysleep.com
├── css/site.css      all styles
├── js/site.js        menu, scroll effects and animations
├── fonts/            Fraunces and Plus Jakarta Sans, with their licenses
├── images/           photos and icons, each with a WebP copy
└── pdf/              patient forms
docs/
├── screenshots/      images used in this README
└── text-corrections.md
```

## Credits

- Text, photos, logo and forms: Carolina Pulmonary & Sleep Clinic, from carysleep.com.
- Fonts: [Fraunces](https://github.com/undercasetype/Fraunces) and
  [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans), under the SIL Open Font License 1.1
  (license files in `carysleep-redesign/fonts/`).
