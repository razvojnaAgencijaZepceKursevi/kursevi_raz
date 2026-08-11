/**
 * Development seed.
 *
 *   npm run db:seed
 *
 * Creates a small but complete slice of the platform: an admin, two teachers
 * who each own their own courses, two students, and enough purchases, progress
 * and submissions that every screen has something real to render.
 *
 * **Two teachers is the point.** One teacher proves nothing — the whole reason
 * ownership exists is that Ana must not be able to touch Marko's course, and
 * you can only test that with both present.
 *
 * Re-runnable: it deletes the accounts it owns (by email) and the content it
 * created (by name) before inserting, so running it twice is safe.
 *
 * Uses the service-role key, so it bypasses RLS entirely — that is what lets it
 * write `published`, `owner_id` and progress rows directly. Never import
 * anything from this file into the app.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

/* -------------------------------------------------------------------------- */
/* Setup                                                                       */
/* -------------------------------------------------------------------------- */

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Every seeded account shares this password. Development only. */
const PASSWORD = 'Test1234!';

const log = (...args) => console.log(...args);

/** Throws on a Postgrest error instead of silently continuing with null data. */
function unwrap(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

/* -------------------------------------------------------------------------- */
/* Accounts                                                                    */
/* -------------------------------------------------------------------------- */

const ACCOUNTS = [
  { key: 'admin', email: 'admin@kursevi.test', name: 'Milica Petrović', role: 'admin' },
  { key: 'ana', email: 'ana@kursevi.test', name: 'Ana Anić', role: 'teacher' },
  { key: 'marko', email: 'marko@kursevi.test', name: 'Marko Marković', role: 'teacher' },
  { key: 'jovana', email: 'jovana@kursevi.test', name: 'Jovana Jovanović', role: 'student' },
  { key: 'nikola', email: 'nikola@kursevi.test', name: 'Nikola Nikolić', role: 'student' },
];

async function resetAccounts() {
  // listUsers is paginated; one page is plenty for a dev project.
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`listUsers: ${error.message}`);

  const seedEmails = new Set(ACCOUNTS.map((a) => a.email));
  for (const user of data.users) {
    if (seedEmails.has(user.email)) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) throw new Error(`deleteUser ${user.email}: ${deleteError.message}`);
      log(`  removed existing ${user.email}`);
    }
  }
}

async function createAccounts() {
  const byKey = {};

  for (const account of ACCOUNTS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: PASSWORD,
      // Skips the confirmation email — these accounts must be usable immediately.
      email_confirm: true,
      user_metadata: { full_name: account.name },
    });
    if (error) throw new Error(`createUser ${account.email}: ${error.message}`);

    // `handle_new_user` already inserted the profile with the default 'student'
    // role; only the role itself needs correcting.
    if (account.role !== 'student') {
      unwrap(
        await supabase.from('profiles').update({ role: account.role }).eq('id', data.user.id),
        `set role ${account.email}`,
      );
    }

    byKey[account.key] = data.user.id;
    log(`  ${account.role.padEnd(7)} ${account.email}`);
  }

  return byKey;
}

/* -------------------------------------------------------------------------- */
/* Content                                                                     */
/* -------------------------------------------------------------------------- */

const CATEGORY_NAMES = ['Programiranje', 'Dizajn'];
const COURSE_NAMES = [
  'Uvod u web programiranje',
  'Napredni JavaScript',
  'Osnove grafičkog dizajna',
  'Brzi kurs: Git za početnike',
];

async function resetContent() {
  unwrap(await supabase.from('courses').delete().in('name', COURSE_NAMES), 'delete courses');
  unwrap(
    await supabase.from('categories').delete().in('name', CATEGORY_NAMES),
    'delete categories',
  );
}

async function seedContent(users) {
  const categories = unwrap(
    await supabase
      .from('categories')
      .insert(CATEGORY_NAMES.map((name) => ({ name })))
      .select(),
    'insert categories',
  );
  const categoryId = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  const courses = unwrap(
    await supabase
      .from('courses')
      .insert([
        {
          name: COURSE_NAMES[0],
          description:
            'Od nule do prve stranice na internetu. Kroz kurs gradimo HTML, CSS i osnovni JavaScript, korak po korak, bez pretpostavke o prethodnom znanju.',
          price: 12000,
          published: true,
          category_id: categoryId['Programiranje'],
          owner_id: users.ana,
        },
        {
          name: COURSE_NAMES[1],
          description: 'Nastavak za one koji već pišu JavaScript. Još u pripremi.',
          price: 18000,
          // Draft on purpose: proves the courses list "Nacrti" filter and that a
          // teacher can see their own unpublished work.
          published: false,
          category_id: categoryId['Programiranje'],
          owner_id: users.ana,
        },
        {
          name: COURSE_NAMES[2],
          description: 'Teorija boja, tipografija i kompozicija kroz praktične primere.',
          price: 9000,
          published: true,
          category_id: categoryId['Dizajn'],
          owner_id: users.marko,
        },
        {
          name: COURSE_NAMES[3],
          description: 'Kratak kurs sa jednim modulom — dovoljno da naučite osnovne komande.',
          price: 0,
          published: true,
          category_id: categoryId['Programiranje'],
          owner_id: users.marko,
        },
      ])
      .select(),
    'insert courses',
  );
  const courseId = Object.fromEntries(courses.map((c) => [c.name, c.id]));

  const modules = unwrap(
    await supabase
      .from('modules')
      .insert([
        { course_id: courseId[COURSE_NAMES[0]], title: 'Kako radi internet', order: 0 },
        { course_id: courseId[COURSE_NAMES[0]], title: 'HTML i CSS osnove', order: 1 },
        { course_id: courseId[COURSE_NAMES[0]], title: 'Prvi koraci u JavaScriptu', order: 2 },
        { course_id: courseId[COURSE_NAMES[2]], title: 'Teorija boja', order: 0 },
        { course_id: courseId[COURSE_NAMES[2]], title: 'Tipografija', order: 1 },
        // Single module, no quiz and no task — so a progress row makes it
        // complete, which is what lets the certificate below exist.
        { course_id: courseId[COURSE_NAMES[3]], title: 'Osnovne Git komande', order: 0 },
      ])
      .select(),
    'insert modules',
  );
  const moduleByTitle = Object.fromEntries(modules.map((m) => [m.title, m]));

  return { categoryId, courseId, moduleByTitle };
}

/* -------------------------------------------------------------------------- */
/* Quiz                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * A quiz on module 1 of Ana's course.
 *
 * Worth seeding because the quiz is the most awkward shape in the schema: a
 * quiz owns questions, a question owns answers, and which answer is correct
 * lives in a *separate* `answer_keys` table that students are denied SELECT on.
 * That separation is the whole reason the quiz endpoint can't leak its own
 * answers — so having a real example to build the UI against matters.
 */
async function seedQuiz({ moduleByTitle }) {
  const quiz = unwrap(
    await supabase
      .from('quizzes')
      .insert({ module_id: moduleByTitle['Kako radi internet'].id, passing_score: 60 })
      .select()
      .single(),
    'insert quiz',
  );

  const questions = [
    {
      text: 'Šta znači skraćenica HTTP?',
      answers: [
        { text: 'HyperText Transfer Protocol', correct: true },
        { text: 'HighTicket Transfer Process', correct: false },
        { text: 'Hyperlink Text Protocol', correct: false },
      ],
    },
    {
      text: 'Čemu služi DNS?',
      answers: [
        { text: 'Prevodi domen u IP adresu', correct: true },
        { text: 'Šifruje saobraćaj', correct: false },
        { text: 'Čuva kolačiće u pregledaču', correct: false },
      ],
    },
    {
      text: 'Koji port se podrazumevano koristi za HTTPS?',
      answers: [
        { text: '443', correct: true },
        { text: '80', correct: false },
        { text: '8080', correct: false },
      ],
    },
  ];

  for (const q of questions) {
    const question = unwrap(
      await supabase.from('questions').insert({ quiz_id: quiz.id, text: q.text }).select().single(),
      'insert question',
    );

    const answers = unwrap(
      await supabase
        .from('answers')
        .insert(q.answers.map((a) => ({ question_id: question.id, text: a.text })))
        .select(),
      'insert answers',
    );

    // Do NOT insert answer_keys here. The `answers_ensure_answer_key` trigger
    // (migration 0007) already created one row per answer with
    // `is_correct = false`, precisely so that callers only ever have to flip a
    // flag rather than manage a second table. Inserting again violates the
    // unique index on answer_id.
    //
    // Note the partial unique index `one_correct_answer_per_question` enforces
    // the single-correct-answer rule in the database, so flipping a second
    // answer to true would be rejected — the radio buttons in the quiz editor
    // are a mirror of that constraint, not the source of it.
    const correctAnswer = answers[q.answers.findIndex((a) => a.correct)];
    unwrap(
      await supabase
        .from('answer_keys')
        .update({ is_correct: true })
        .eq('answer_id', correctAnswer.id),
      'mark correct answer',
    );
  }

  return quiz;
}

/* -------------------------------------------------------------------------- */
/* Files                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Uploads a real object and records the row that points at it.
 *
 * Seeding only the table row would give you a file list whose downloads 404.
 * The path shape is what the storage RLS policies parse for access, so it is
 * built exactly as `storagePath()` would: `{course_id}/{module_id}/{name}`.
 */
async function uploadAndRecord({ bucket, folders, fileName, body, table, row }) {
  const path = `${folders.join('/')}/${Date.now()}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, new Blob([body], { type: 'text/plain' }), {
      contentType: 'text/plain',
      upsert: true,
    });
  if (uploadError) throw new Error(`upload ${bucket}/${path}: ${uploadError.message}`);

  unwrap(
    await supabase.from(table).insert({ ...row, file_path: path, file_name: fileName }),
    `insert ${table}`,
  );

  return path;
}

async function seedFiles({ courseId, moduleByTitle }, task) {
  const htmlModule = moduleByTitle['HTML i CSS osnove'];

  await uploadAndRecord({
    bucket: 'module-files',
    folders: [courseId[COURSE_NAMES[0]], htmlModule.id],
    fileName: 'html-cheatsheet.txt',
    body: 'Osnovni HTML tagovi:\n<h1>-<h6> naslovi\n<p> pasus\n<a href> link\n<img src alt> slika\n',
    table: 'module_files',
    row: { module_id: htmlModule.id },
  });

  await uploadAndRecord({
    bucket: 'task-files',
    folders: [courseId[COURSE_NAMES[0]], htmlModule.id],
    fileName: 'zadatak-primer.txt',
    body: 'Primer strukture koju treba da napravite:\nindex.html\nstyle.css\n',
    table: 'task_files',
    row: { task_id: task.id },
  });
}

/* -------------------------------------------------------------------------- */
/* Student activity                                                            */
/* -------------------------------------------------------------------------- */

async function seedActivity(users, { courseId, moduleByTitle }) {
  const purchases = unwrap(
    await supabase
      .from('purchases')
      .insert([
        // Approved: Jovana can actually open Ana's course.
        {
          student_id: users.jovana,
          course_id: courseId[COURSE_NAMES[0]],
          price: 12000,
          status: 'approved',
        },
        // Pending: gives the admin purchases queue a row needing a decision.
        {
          student_id: users.nikola,
          course_id: courseId[COURSE_NAMES[0]],
          price: 12000,
          status: 'requested',
        },
        // Pending on Marko's course, so each teacher has something of their own.
        {
          student_id: users.jovana,
          course_id: courseId[COURSE_NAMES[2]],
          price: 9000,
          status: 'requested',
        },
        // Approved on the one-module course, so a certificate can be earned.
        {
          student_id: users.jovana,
          course_id: courseId[COURSE_NAMES[3]],
          price: 0,
          status: 'approved',
        },
      ])
      .select(),
    'insert purchases',
  );

  // A task on module 2 of Ana's course, plus a submission thread for her to review.
  const task = unwrap(
    await supabase
      .from('tasks')
      .insert({
        module_id: moduleByTitle['HTML i CSS osnove'].id,
        text: 'Napravite jednostavnu HTML stranicu sa naslovom, pasusom i slikom, i stilizujte je pomoću CSS-a. Pošaljite kod kao prilog.',
      })
      .select()
      .single(),
    'insert task',
  );

  const submission = unwrap(
    await supabase
      .from('task_submissions')
      .insert({ task_id: task.id, student_id: users.jovana, status: 'pending' })
      .select()
      .single(),
    'insert submission',
  );

  unwrap(
    await supabase.from('task_messages').insert([
      {
        submission_id: submission.id,
        sender_id: users.jovana,
        body: 'Poslala sam prvu verziju zadatka. Nisam sigurna da li sam dobro postavila slike.',
      },
    ]),
    'insert messages',
  );

  // A second thread, already bounced back, so the review UI has more than one
  // status to render.
  const revisionSubmission = unwrap(
    await supabase
      .from('task_submissions')
      .insert({ task_id: task.id, student_id: users.nikola, status: 'needs_revision' })
      .select()
      .single(),
    'insert second submission',
  );

  unwrap(
    await supabase.from('task_messages').insert([
      {
        submission_id: revisionSubmission.id,
        sender_id: users.nikola,
        body: 'Evo mog resenja zadatka.',
      },
      {
        submission_id: revisionSubmission.id,
        sender_id: users.ana,
        body: 'Dobar pocetak, ali nedostaje CSS fajl. Dopunite i posaljite ponovo.',
      },
    ]),
    'insert revision messages',
  );

  // Progress: first module of Ana's course done, so the course page shows the
  // sequential unlock (module 1 complete, module 2 open, module 3 locked).
  unwrap(
    await supabase.from('module_progress').insert([
      // `quiz_done` matters: this module has a quiz, and the
      // `recompute_module_progress_completed` trigger only marks a module
      // complete once every piece it contains is done. Without the flag the row
      // would insert as incomplete and the student's unlock would not advance.
      {
        module_id: moduleByTitle['Kako radi internet'].id,
        student_id: users.jovana,
        quiz_done: true,
      },
      // Same keys as the row above, deliberately. In a multi-row insert
      // PostgREST unifies the columns across all objects and sends NULL for any
      // key a row omits — it does NOT fall back to the column default. Omitting
      // `quiz_done` here therefore fails the NOT NULL constraint rather than
      // defaulting to false.
      //
      // This module has neither quiz nor task, so the completion trigger marks
      // it done regardless, which is what makes the certificate below real.
      {
        module_id: moduleByTitle['Osnovne Git komande'].id,
        student_id: users.jovana,
        quiz_done: false,
      },
    ]),
    'insert module_progress',
  );

  // The Git course has exactly one module and it is now complete, so the
  // certificate is legitimate rather than invented.
  const certificate = unwrap(
    await supabase
      .from('certificates')
      .insert({
        course_id: courseId[COURSE_NAMES[3]],
        student_id: users.jovana,
        requested_delivery: true,
      })
      .select()
      .single(),
    'insert certificate',
  );

  return { purchases, submission, certificate, task };
}

/* -------------------------------------------------------------------------- */

async function main() {
  log('\nResetting seed accounts…');
  await resetAccounts();

  log('\nCreating accounts…');
  const users = await createAccounts();

  log('\nResetting seed content…');
  await resetContent();

  log('\nCreating courses and modules…');
  const content = await seedContent(users);

  log('\nCreating purchases, submissions and progress…');
  await seedQuiz(content);
  const activity = await seedActivity(users, content);
  await seedFiles(content, activity.task);

  log('\nDone.\n');
  log('  Sign in with any of these — password for all: ' + PASSWORD);
  for (const account of ACCOUNTS) {
    log(`    ${account.role.padEnd(7)}  ${account.email}`);
  }
  log('');
  log(`  Ana owns:   ${COURSE_NAMES[0]} (published), ${COURSE_NAMES[1]} (draft)`);
  log(`  Marko owns: ${COURSE_NAMES[2]}, ${COURSE_NAMES[3]}`);
  log(`  Certificate: ${activity.certificate.readable_id} (delivery requested)`);
  log('');
}

main().catch((error) => {
  console.error('\nSeed failed:', error.message, '\n');
  process.exit(1);
});
