# Client content & configuration checklist

Everything the client needs to review, rewrite or supply before launch. Line numbers
refer to commit `17c2da2`; if a line has moved, search the file for the quoted text.

**Where a value lives decides how it changes:**

| Kind | Where | Change takes effect |
|---|---|---|
| Page copy | the `.tsx` file listed | code change + deploy |
| Brand, contact, company facts | `src/lib/siteConfig.ts` | code change + deploy |
| Secrets, per-environment settings | Vercel env vars (`.env.example`) | Vercel setting + redeploy |
| Payment details, legal texts, courses, categories | database, edited in `/admin` | immediately, no deploy |

---

## 0. Fix first: copy that promises things the platform does not do

Review these before anything else. Publishing them would mislead students.

| Claim | Where | Reality |
|---|---|---|
| "Kartično plaćanje ili uplatnica… izdajemo fakturu — placeholder" | `src/components/landing/Faq.tsx:56` | Only bank transfer with a payment reference exists. No card payment, no invoicing. |
| "Certifikat s provjerom" | `src/components/landing/Hero.tsx:43` | Certificates are private now. Only the student, admins and the course's teacher can open one. Nobody else can check it. |
| "Svaki certifikat nosi jedinstveni broj i stranicu za provjeru, tako da ga poslodavac može potvrditi." | `src/components/landing/WhyUs.tsx:39` | Same: there is no public verification page. |
| "certifikat je odmah dostupan za preuzimanje i dijeljenje" | `src/components/landing/HowItWorks.tsx:54` | Students can download it, but there's no way to share it. |
| "završni ispit" (final exam) | `HowItWorks.tsx:54`, `WhyUs.tsx:56`, `Faq.tsx:51` | No final exam exists. Modules have quizzes and tasks; the certificate is issued when the last module is completed. |
| "Kratki kvizovi nakon lekcija… završni ispit koji se ocjenjuje ručno" | `WhyUs.tsx:56` | Quizzes are graded automatically; tasks are reviewed by hand. |
| "dobijaš pristup pregledu… uvodnih lekcija" | `HowItWorks.tsx:36` | Visitors see only module titles. There are no free introductory lessons. |
| "Akreditacije i partneri — Programi su rađeni s partnerskim firmama i institucijama" | `WhyUs.tsx:49–50` | Only keep this if accreditations and partners actually exist. If they do, name them. |
| "Povratnu informaciju… u roku od 48 sati" / "48h rok za pregled" | `Faq.tsx:46`, `StatsBar.tsx:28` | A promise teachers must keep. Confirm the number; both places must agree. |
| All four figures in the stats band (42 kursa, 6.800 studenata, 48h, 91%) | `src/components/landing/StatsBar.tsx:26–29` | Invented placeholders. Supply real figures or remove the band. |
| Footer course categories (IT / programiranje, Marketing, …) | `src/components/layout/PublicFooter.tsx:29–35` | Hard-coded and don't match the real categories. The client should confirm the final category list. |
| Footer link "O nama" → `/o-nama` | `PublicFooter.tsx:43` | The page doesn't exist (404). Either supply About-us copy or remove the link. |

**Untranslated pages.** `/register`, `/forgot-password` and `/reset-password` are still
**in English** (§1.9). That's a code fix rather than content work, but the Bosnian
wording needs approving.

**Inconsistent form of address.** The marketing copy uses the informal **ti** ("Uči svojim tempom"),
but the course pages, purchase panel, blog excerpts and auth pages use the formal
**vi** ("Izaberite kurs", "Saznajte"). The client should pick one for the whole public site.

---

## 1. Public page texts

### 1.1 Site-wide facts — `src/lib/siteConfig.ts`

Used in the header logo, footer, page titles, emails, the certificate PDF and search
results.

| Field | Current value | Line |
|---|---|---|
| Brand name | Katedra | 46 |
| Tagline (home page title, share image) | online kursevi sa certifikatom | 49 |
| One-line description (footer, default search snippet, share image) | Platforma za online kurseve s pregledom zadataka i certifikatom po završetku. | 52 |

### 1.2 Header — `src/components/layout/PublicHeader.tsx`

| Text | Line |
|---|---|
| Početna · Kursevi · Kako funkcioniše · Blog · Kontakt | 49–61 |
| Prijavi se | 72 |
| Registruj se | 75 |

### 1.3 Footer — `src/components/layout/PublicFooter.tsx`

| Text | Line |
|---|---|
| Column "Kursevi": IT / programiranje · Poslovanje i menadžment · Marketing · Finansije i računovodstvo · Zanati i praktične vještine | 27–35 |
| Column "Platforma": O nama · Blog · Kontakt · Uvjeti korištenja · Politika privatnosti | 41–47 |
| Column "Kontakt": email, phone, social links | from `siteConfig.ts` |
| © {godina} Katedra. Sva prava zadržana. + company line | 113 (company line from `siteConfig.ts`) |

### 1.4 Home page `/`

**Hero — `src/components/landing/Hero.tsx`**

| Text | Line |
|---|---|
| Online kursevi · Certifikat · Povratna informacija predavača | 108 |
| Uči svojim tempom. **Napreduj** uz stvarnu povratnu informaciju. *(headline)* | 115–119 |
| Registruj se, odaberi kurs iz naše ponude i prolazi materijale kada tebi odgovara. Zadatke pregleda predavač, a po završetku dobijaš certifikat. | 128–129 |
| Buttons: Registruj se · Pregledaj kurseve | 139, 147 |
| Badges: Trajan pristup materijalima · Bez fiksnih rokova · Certifikat s provjerom | 41–43 |
| Image alt text: Učenici u učionici podižu ruke | 67 |

**Stats band — `src/components/landing/StatsBar.tsx:26–29`.** See §0.

**Featured courses — `src/components/landing/FeaturedCourses.tsx`**

| Text | Line |
|---|---|
| Istaknuti kursevi | 52 |
| Šta trenutno možeš upisati | 55 |
| Svi kursevi | 65 |

**How it works — `src/components/landing/HowItWorks.tsx`**

| Text | Line |
|---|---|
| Kako funkcioniše / Četiri koraka od registracije do certifikata | 64, 67 |
| 01 Registracija — Otvoriš račun u minuti i dobijaš pristup pregledu svih objavljenih kurseva, programa i uvodnih lekcija. | 34–36 |
| 02 Odabir kursa — Upisuješ pojedinačne kurseve, bez obaveze i bez roka. Materijali ostaju dostupni i nakon što završiš. | 40–42 |
| 03 Učenje i zadaci — Prolaziš lekcije svojim tempom i predaješ zadatke kada ti odgovara. Predavač ih pregleda i piše konkretnu povratnu informaciju. | 46–48 |
| 04 Certifikat — Kada su svi zadaci ocijenjeni i završni ispit položen, certifikat je odmah dostupan za preuzimanje i dijeljenje. | 52–54 |

**Why us — `src/components/landing/WhyUs.tsx`**

| Text | Line |
|---|---|
| Zašto Katedra | 84 |
| Znanje koje se provjerava, ne samo gleda | 88 |
| Snimljene lekcije su početak. Ono što odvaja završen kurs od odgledanog kursa je zadatak koji je neko pročitao i ocijenio. | 92–93 |
| Certifikat po završetku — Svaki certifikat nosi jedinstveni broj i stranicu za provjeru, tako da ga poslodavac može potvrditi. | 37–39 |
| Povratna informacija predavača — Zadatke pregleda čovjek iz struke i piše šta je dobro, šta nije i šta konkretno uraditi drugačije. | 43–45 |
| Akreditacije i partneri — Programi su rađeni s partnerskim firmama i institucijama iz svake oblasti. | 49–50 |
| Kako se provjerava znanje — Kratki kvizovi nakon lekcija, praktični zadaci po modulima i završni ispit koji se ocjenjuje ručno. | 54–56 |

**FAQ — `src/components/landing/Faq.tsx`**

| Question — answer | Line |
|---|---|
| Česta pitanja / Pitanja koja dobijamo najčešće | 70, 73 |
| Koliko traje pristup materijalima? — Pristup je trajan. Nakon što upišeš kurs, lekcije i materijali ostaju u tvom računu i poslije završetka. | 35–37 |
| Da li postoje fiksni rokovi i predavanja u realnom vremenu? — Ne. Kursevi su asinhroni — učiš kada možeš. Jedini rokovi su oni koje sam postaviš. | 40–41 |
| Ko pregleda moje zadatke? — Predavač kursa ili njegov asistent. Povratnu informaciju u pravilu dobijaš u roku od 48 sati od predaje. | 44–46 |
| Šta je potrebno da dobijem certifikat? — Pregledani i prihvaćeni svi praktični zadaci i položen završni ispit. Certifikat se generiše automatski. | 49–51 |
| Kako se plaća? — Kartično plaćanje ili uplatnica, po kursu. Za firme i grupne upise izdajemo fakturu — placeholder, uvjeti se dopunjuju. | 54–56 |
| Nema odgovora na tvoje pitanje? Javi nam se — odgovaramo u toku radnog dana. | 78 |
| Button: Kontaktiraj nas | 87 |

**Closing banner — `src/components/landing/CtaBanner.tsx`**

| Text | Line |
|---|---|
| Prvi korak je račun. Ostalo ide tvojim tempom. | 52 |
| Registracija traje minutu i ne obavezuje ni na šta — kurseve upisuješ kada odlučiš. | 55 |
| Buttons: Registruj se · Kontaktiraj nas | 71, 86 |

### 1.5 Courses `/courses` and `/courses/{slug}`

Course names, descriptions, prices, thumbnails and module titles are **database content**,
entered in `/admin/courses`. The client supplies them per course; see §3.

Static interface text:

| Text | File:line |
|---|---|
| Kursevi — Izaberite kurs i pošaljite zahtjev za pristup. | `src/components/courses/CourseCatalogue.tsx:46` |
| Pretraži kurseve… · Kategorija · Sve kategorije | `CourseCatalogue.tsx:57, 62, 66` |
| Nema rezultata — Nijedan kurs ne odgovara zadatoj pretrazi. Pokušajte sa drugim pojmom ili kategorijom. | `CourseCatalogue.tsx:79–80` |
| Još nema objavljenih kurseva — Uskoro dodajemo sadržaj — svratite ponovo. | `CourseCatalogue.tsx:84–85` |
| Sadržaj kursa — Pregled modula. Sadržaj postaje dostupan nakon odobrenog pristupa. / Moduli se otključavaju redom, kako ih završavate. | `src/components/courses/CoursePageView.tsx:280–284` |
| Kurs još nema module — Sadržaj se uskoro dodaje. | `CoursePageView.tsx:295–296` |
| Kurs nije pronađen — Kurs ne postoji ili trenutno nije objavljen. | `CoursePageView.tsx:158–159` |
| Cijena kursa · Zatraži pristup | `src/components/courses/CoursePurchasePanel.tsx:91, 136` |
| Pristup kursu odobrava administrator nakon potvrde uplate. / Za slanje zahtjeva potrebno je da budete prijavljeni. | `CoursePurchasePanel.tsx:141–142` |
| Vaš zahtjev čeka odobrenje. Čim uplata bude potvrđena, kurs će vam biti dostupan. | `CoursePurchasePanel.tsx:101` |
| Prethodni zahtjev za ovaj kurs je odbijen. Možete poslati novi. | `CoursePurchasePanel.tsx:125` |
| Zahtjev je poslat. Obavijestit ćemo vas kada bude odobren. *(toast)* | `CoursePurchasePanel.tsx:80` |
| Vaš napredak · Završili ste sve module. Certifikat je izdat na vaše ime. | `src/components/courses/CourseProgressSummary.tsx:40, 79` |

### 1.6 Blog `/blog`

| Text | File:line |
|---|---|
| Savjeti za učenje i teme iz struke | `src/app/(marketing)/blog/page.tsx:27` |
| Kratki tekstovi o tome kako učiti, šta se traži na tržištu i kako izgleda rad u pojedinim oblastima. | `blog/page.tsx:28` |
| Sve teme · Pretraži članke · Pročitaj članak · Nema rezultata za zadanu pretragu. | `src/components/blog/BlogList.tsx:38, 82, 184, 93` |
| Još nema objavljenih tekstova — Prvi tekstovi stižu uskoro. | `blog/page.tsx:35–36` |

**The 15 posts** live in `src/lib/blog.ts`. Each one's full body is the `content` field just
below the line listed. The excerpt is also the search-result snippet, so keep it at
120–160 characters. Slugs (URLs) must not change once published. Each image is in
`public/images/blog/`; the client must confirm usage rights.

| Line | Slug | Title | Excerpt |
|---|---|---|---|
| 129 | sta-je-projekt-menadzment | Šta je projekt menadžment? Vodič za početnike | Saznajte šta je projekt menadžment, koje su njegove osnovne faze i zašto je ova vještina danas tražena u gotovo svakoj industriji. |
| 166 | tehnike-upravljanja-vremenom | Tehnike upravljanja vremenom koje zaista djeluju | Pregled provjerenih tehnika za upravljanje vremenom – od Pomodoro tehnike do metode "pojedi žabu" – koje pomažu u borbi protiv prokrastinacije. |
| 202 | kako-napisati-biznis-plan | Kako napisati biznis plan: osnove za početnike | Jednostavan vodič kroz ključne dijelove biznis plana – od analize tržišta do finansijske projekcije – za sve koji planiraju pokrenuti posao. |
| 240 | liderstvo-vs-menadzment | Liderstvo vs menadžment: koja je razlika? | Iako se često koriste kao sinonimi, liderstvo i menadžment nisu isto. Otkrijte ključne razlike i zašto je oboje bitno za uspješan tim. |
| 273 | uvod-u-agile-i-scrum | Uvod u agilnu metodologiju i Scrum | Osnove Agile metodologije i Scrum okvira – kako timovi rade u sprintovima, ko su ključne uloge i zašto je ovaj pristup toliko popularan u IT industriji. |
| 306 | sta-je-git | Šta je Git i zašto ga svaki programer treba znati | Git je alat koji koristi gotovo svaki programer na svijetu. Saznajte šta je verzionisanje koda, kako Git funkcioniše i zašto je nezaobilazan u IT industriji. |
| 340 | html-css-javascript-osnove | HTML vs CSS vs JavaScript: osnove web razvoja | Tri osnovna gradivna elementa svake web stranice – HTML, CSS i JavaScript. Jednostavno objašnjenje razlika i uloge svakog od njih. |
| 375 | sta-je-cloud-computing | Šta je cloud computing? Jednostavno objašnjenje | Cloud computing je promijenio način na koji koristimo tehnologiju. Saznajte šta znači "rad u oblaku" i koje su njegove najveće prednosti. |
| 408 | osnove-kiberneticke-sigurnosti | Osnove kibernetičke sigurnosti: kako se zaštititi online | Jednostavan vodič kroz osnovne pojmove kibernetičke sigurnosti i praktični savjeti kako zaštititi svoje podatke i naloge na internetu. |
| 441 | sta-je-api | Šta je API? Objašnjeno za početnike | API je pojam koji se često spominje u IT svijetu. Saznajte šta zapravo znači, kako funkcioniše i zašto je ključan dio moderne tehnologije. |
| 472 | kako-brze-nauciti-novu-vjestinu | Kako brže naučiti bilo koju novu vještinu | Provjerene tehnike učenja koje ubrzavaju usvajanje novih vještina – od aktivnog ponavljanja do metode podučavanja drugih. |
| 503 | savjeti-za-javni-govor | Savjeti za javni govor za početnike | Javni govor je vještina koja se uči i vježba. Evo praktičnih savjeta za savladavanje treme i pripremu uspješnog nastupa pred publikom. |
| 534 | kako-izgraditi-licni-brend | Kako izgraditi lični brend online | Lični brend nije rezervisan samo za influensere. Saznajte kako izgraditi prepoznatljivo online prisustvo koje otvara poslovne prilike. |
| 568 | freelancing-101-kako-poceti | Freelancing 101: kako početi | Sve što trebate znati za početak freelance karijere – od izbora niše i platformi do prvih klijenata i postavljanja cijena. |
| 599 | osnove-excela | Osnove Excela koje bi svako trebao znati | Excel je jedan od najkorisnijih alata u poslovnom svijetu. Pregled osnovnih funkcija i formula koje olakšavaju svakodnevni rad sa podacima. |

The publish dates in the file (`publishedAt`, June–August 2026) are invented. Each post
shows its date on its page, so they should be set to the real dates.

### 1.7 Contact `/kontakt`

Page: `src/app/(marketing)/kontakt/page.tsx`. Form: `src/components/contact/ContactForm.tsx`.

| Text | File:line |
|---|---|
| Kontakt / Pitaj nas prije nego se upišeš | page `33, 36` |
| Odgovaramo radnim danima, u pravilu u toku istog dana. Za pitanja o pojedinom kursu navedi njegov naziv da odgovor stigne od predavača. | page `39–40` |
| Direktan kontakt · Opšti upiti · Podrška studentima · Telefon | page `55, 60, 69, 78` |
| Emails, phone, working hours | `siteConfig.ts` (§2.2) |
| Prije nego pišeš: Kako funkcioniše upis i učenje · Pregled objavljenih kurseva · Česta pitanja o certifikatu · Uslovi korištenja i plaćanje · Politika privatnosti | page `93–110` |
| Form: Pošalji upit · Ime i prezime · Email adresa · Tema upita · Poruka | form `63, 68, 76, 87, 96` |
| Placeholders: Amina Hodžić · amina@primjer.ba · Npr. Uvod u web razvoj - pitanje o zadacima · Napiši nam u nekoliko rečenica šta te zanima. | form `69, 78, 88, 97` |
| Consent: Pročitao/la sam politiku privatnosti i pristajem na obradu podataka radi odgovora na upit. | form `110–114` |
| Pošalji email direktno | form `129` |
| Success: Upit je poslan. odgovaramo vam uskoro na navedeni email. *(lowercase "odgovaramo" after a full stop)* | form `47` |
| Error: Trenutno ne možemo poslati upit ovim putem — koristite „Pošalji email direktno" ispod. | form `52` |

Note "Uslovi korištenja" (page line 107) is the Serbian form; elsewhere the site says "Uvjeti".

### 1.8 Legal pages `/uvjeti-koristenja`, `/politika-privatnosti`

**Not in code.** The texts are stored in the database and edited at
`/admin/settings/legal` (Markdown). Both are currently empty and show a "not written yet"
notice. A lawyer should write them (BiH data-protection law). They must cover payment by
bank transfer, refunds, how long access lasts, certificates, and the newsletter as
marketing mail. The privacy policy's search snippet (§1.11) promises it explains
retention and how to request access or deletion, so the text needs to cover both.

### 1.9 Sign-in pages

| Page | File | Status |
|---|---|---|
| `/login` | `src/app/(auth)/login/page.tsx` | Bosnian: Prijava · Dobrodošli nazad. (60) · Email · Lozinka (66, 74) · Prijavi se (83) · Kreiraj nalog (88) · Zaboravljena lozinka? (91) · unconfirmed-email message (39) |
| `/register` | `src/app/(auth)/register/page.tsx` | **English.** Create account · Start learning in a couple of minutes. (78) · Full name · Email · Password · Confirm password (84–108) · At least 8 characters. (104) · Passwords do not match. (30, 114) · Password must be at least 8 characters. (34) · Already have an account? Sign in (123) · Check your email / We sent a confirmation link to … Click it to activate your account, then sign in. / Back to sign in (63–70) |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | **English.** Reset password · We'll email you a link to set a new password. (51) · Send reset link (63) · Check your email / If an account exists for …, we have sent a password reset link. (37–40) · Back to sign in (43, 66) |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | **English.** Set a new password (76) · New password · Confirm new password (82, 91) · Update password (102) · Link expired / This password reset link is invalid or has expired… (66–69) · validation messages (39, 43, 97) |
| Google button | `src/components/auth/GoogleSignInButton.tsx` | Nastavi sa Google nalogom (39) · Prijavi se / Registruj se sa Google nalogom (login 98, register 129) · ili (78) |

The confirmation and password-reset **emails** are not in this repo. They're edited in the
Supabase dashboard (Authentication → Email Templates) and are still Supabase's English
defaults.

### 1.10 Error pages

| Text | File:line |
|---|---|
| Stranica nije pronađena — Adresa koju ste otvorili ne postoji, ili je sadržaj u međuvremenu uklonjen. · Početna · Pogledaj kurseve | `src/app/not-found.tsx:27–35` |
| Nešto je pošlo naopako — Stranicu nije bilo moguće prikazati. Pokušajte ponovo — ako se greška ponavlja, javite se timu koji održava aplikaciju. · Pokušaj ponovo | `src/components/feedback/RouteError.tsx:50–55` |

### 1.11 Search-result titles and descriptions

What Google shows and what appears when a link is shared. Descriptions should be 120–160
characters. Titles get " — Katedra" appended automatically.

| Page | Title | Description | File:line |
|---|---|---|---|
| `/` | Katedra — online kursevi sa certifikatom | Online kursevi s video lekcijama, materijalima i zadacima koje pregleda predavač. Uči svojim tempom i dobij certifikat po završetku. | `src/app/(marketing)/page.tsx:13–16` |
| `/courses` | Online kursevi | Pregled svih kurseva na platformi Katedra: video lekcije, materijali, zadaci s povratnom informacijom predavača i certifikat po završetku. | `src/app/(marketing)/courses/page.tsx:10–11` |
| `/courses/{slug}` | *course name* | first 160 characters of the course description (database) | `src/app/(marketing)/courses/[slug]/page.tsx:41–44` |
| `/blog` | Blog — savjeti za učenje i teme iz struke | Kratki tekstovi o tome kako učiti, šta se traži na tržištu rada i kako izgleda posao u IT-u, menadžmentu, marketingu i drugim oblastima. | `src/app/(marketing)/blog/page.tsx:11–13` |
| `/blog/{slug}` | *post title* | *post excerpt* | `src/lib/blog.ts` |
| `/kontakt` | Kontakt | Pitanja o kursevima, upisu, plaćanju ili certifikatu? Piši timu platforme Katedra ili nazovi radnim danima — u pravilu odgovaramo istog dana. | `src/app/(marketing)/kontakt/page.tsx:13–14` |
| `/uvjeti-koristenja` | Uvjeti korištenja | Uvjeti korištenja platforme Katedra: upis na kurs, plaćanje, pristup materijalima, certifikati i prava i obaveze korisnika. | `src/app/(marketing)/uvjeti-koristenja/page.tsx:6–7` |
| `/politika-privatnosti` | Politika privatnosti | Koje podatke platforma Katedra prikuplja, zašto ih koristi, koliko dugo ih čuva i kako se može zatražiti uvid ili brisanje. | `src/app/(marketing)/politika-privatnosti/page.tsx:6–7` |
| `/login` | Prijava | Prijavi se na platformu Katedra i nastavi s učenjem: lekcije, zadaci, napredak i certifikati na jednom mjestu. | `src/app/(auth)/login/layout.tsx:9–10` |
| `/register` | Registracija | Napravi besplatan nalog na platformi Katedra i pošalji zahtjev za upis na kurs. Uči svojim tempom i dobij certifikat po završetku. | `src/app/(auth)/register/layout.tsx:9–10` |

### 1.12 Images

| Image | Location | Needed |
|---|---|---|
| Hero photo | `public/hero-illustration.jpg` | Real photo, or confirmed licence for the current one |
| Blog covers (15) | `public/images/blog/*.jpg` | Confirmed usage rights, or replacements |
| Logo | `src/components/layout/Logo.tsx` (currently the word "Katedra" as text) | SVG/PNG logo |
| Favicon | `src/app/favicon.ico` (Next.js default) | Favicon from the logo |
| Default share image | generated by `src/app/og/route.tsx` (blue card with name + tagline) | Optional: a designed 1200×630 image |
| Course thumbnails | uploaded per course in `/admin/courses` | One per course |

---

## 2. Values to request from the client

### 2.1 Environment variables (Vercel)

Full descriptions are in `.env.example`. Ask the client to **create or give access to
the accounts**; the values are then copied out of those accounts. Not all of them are
things the client types in.

| Variable | What to ask the client for | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project for production (account owned by the client, or access to it) | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from that Supabase project | All |
| `SUPABASE_SERVICE_ROLE_KEY` | from that Supabase project (secret) | All |
| `NEXT_PUBLIC_SITE_URL` | **The production domain**, e.g. `https://katedra.ba`, and DNS access for it | Production only |
| `RESEND_API_KEY` | Resend account (or approval to create one) + DNS access to verify the domain | Production |
| `EMAIL_FROM` | Sender name and address for system mail, e.g. `Katedra <obavijesti@katedra.ba>` | Production |
| `CONTACT_EMAIL_TO` | Inbox that should receive contact-form messages | Production |
| `NEXT_PUBLIC_FEATURE_*` (11 flags) | Decision: which features are live at launch and the order the rest are switched on (see the roadmap) | Production |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | Decision: offer Google sign-in? If yes: a Google Cloud project/OAuth consent screen under the client's Google account | Production |
| `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` | Developer-only (migrations); from the same Supabase project | Local only |

Also needed, though not env vars:
- **Vercel**: the account or team the project is hosted under, and who pays for it.
- **Domain registrar / DNS**: access, or someone who can add records (domain → Vercel;
  SPF, DKIM, DMARC → Resend).
- **Supabase auth settings**: Site URL and redirect URLs (set by the developer once the
  domain is known).

### 2.2 Site facts — `src/lib/siteConfig.ts`

| Field | Current (placeholder) | Line |
|---|---|---|
| Brand name | Katedra (confirm) | 46 |
| Tagline | online kursevi sa certifikatom | 49 |
| One-line description | Platforma za online kurseve s pregledom zadataka i certifikatom po završetku. | 52 |
| General email | info@katedra.ba | 56 |
| Student support email | podrska@katedra.ba | 58 |
| Phone (display + dialable form) | +387 33 000 000 | 64 |
| Working hours | Ponedjeljak – petak, 09:00 – 17:00 | 66 |
| Instagram / LinkedIn / Facebook profile URLs (or "none") | network home pages | 75–77 |
| Registered company name | *(empty)* | 87 |
| Registered address | *(empty)* | 89 |
| ID number (JIB) | *(empty)* | 91 |

### 2.3 Payment details — entered at `/admin/settings/payment` (database)

Shown to students next to their payment reference. At minimum a recipient name and
account number are required; without them students see a notice instead.

| Field (admin label) | Needed |
|---|---|
| Naziv primaoca | Recipient name as the bank knows it |
| Adresa · Poštanski broj · Grad · Država | Recipient address |
| ID broj / PDV broj | Tax / ID number |
| Banka | Bank name |
| Broj računa | Account number |
| SWIFT / BIC | Only if foreign payments are expected |
| Šablon svrhe uplate | Wording for the payment-purpose field; `{reference}` and `{course}` are filled in |
| Napomena studentu | Optional note, e.g. "Pristup odobravamo u roku od 1 radnog dana" |

Also ask: does the client's bank accept letters in the reference field ("poziv na broj")?
References look like `UPL-2026-0001`. If it doesn't, the format is a one-line change.

### 2.4 Content and accounts

| Item | Where it goes |
|---|---|
| Terms of use and privacy policy texts | `/admin/settings/legal` |
| Final list of course categories | `/admin/categories` (and the footer list, §1.3) |
| Each course: name, description (first 160 characters double as the search snippet), price in KM, thumbnail, modules (title, Vimeo link, PDF materials), quizzes, tasks | `/admin/courses` |
| Vimeo account and video privacy settings (unlisted links) | Vimeo |
| Names and emails of admins and teachers | `/admin/users` after they register |
| "O nama" page copy, or a decision to drop the link | new page / `PublicFooter.tsx:43` |
| Real statistics for the stats band, or a decision to remove it | `StatsBar.tsx:26–29` |
| Confirmed review-time promise (currently 48 h) | `Faq.tsx:46`, `StatsBar.tsx:28` |
| Wording on the certificate PDF ("Izdavalac certifikata", issuer name) | `src/lib/pdf/certificate.ts:259–260` |
| Who posts printed certificates, and from what address | process decision |
| Who answers support requests and reviews purchases, and the response time | process decision |
| Bosnian wording for Supabase's confirmation and password-reset emails | Supabase dashboard |
