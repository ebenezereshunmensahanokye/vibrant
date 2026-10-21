const SUPABASE_URL = 'https://eexgkctbcrnfaruipqwq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QGpbgGCll0p9droRsBN--g_hskBD2mi';
const ADMIN_EMAILS = [
  'ebenezereshunmensahanokye@gmail.com',
  'frankdebrahdarko@gmail.com'
];
const COLUMN_NAMES = [
  ['NAME', 'name'],
  ['INVITE', 'invite'],
  ['SIGN UP', 'sign_up'],
  ['NAME OF SIGN UP', 'sign_up_name'],
  ['INVITE ACHIEVED', 'invite_achieved'],
  ['SIGN UP ACHIEVED', 'sign_up_achieved'],
  ['FORMS PURCHASED', 'forms_purchased'],
  ['FORMS FILLED', 'forms_filled'],
  ['WEEK', 'week'],
  ['DATE FOR REPORTING', 'report_date'],
  ['FEES TO PAY', 'fees_to_pay']
];

const form = document.getElementById('reportForm');
const defaultOrganizationName = 'PACE SETTERS DATABASE';
const nameInput = form.querySelector('input[name="NAME"]');
const databaseStatus = document.getElementById('recordsStatus');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginPanel = document.getElementById('adminLoginPanel');
const adminLoginStatus = document.getElementById('adminLoginStatus');
const adminRecordsPanel = document.getElementById('adminRecordsPanel');
const recordsBody = document.getElementById('recordsBody');
const supabaseConfigured = !SUPABASE_URL.startsWith('YOUR_') && !SUPABASE_ANON_KEY.startsWith('YOUR_');
const database = supabaseConfigured && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

form.addEventListener('reset', function () {
  window.setTimeout(() => {
    if (nameInput) {
      nameInput.value = defaultOrganizationName;
    }
  }, 0);
});

function setStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('error', isError);
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function recordToFormValues(record) {
  return COLUMN_NAMES.map(([, field]) => {
    if (field === 'week') return `Week ${record[field]}`;
    return record[field] ?? '';
  });
}

function renderRecords(records) {
  recordsBody.replaceChildren();

  if (records.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = COLUMN_NAMES.length;
    cell.textContent = 'No records saved yet.';
    row.appendChild(cell);
    recordsBody.appendChild(row);
    return;
  }

  records.forEach((record) => {
    const row = document.createElement('tr');
    recordToFormValues(record).forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    recordsBody.appendChild(row);
  });
}

async function loadRecords() {
  setStatus(databaseStatus, 'Loading saved records...');
  const { data, error } = await database
    .from('organization_reports')
    .select(COLUMN_NAMES.map(([, field]) => field).join(','))
    .order('created_at', { ascending: false });

  if (error) {
    setStatus(databaseStatus, 'Could not load records. Check the database configuration and access policies.', true);
    return;
  }

  renderRecords(data);
  setStatus(databaseStatus, `${data.length} record${data.length === 1 ? '' : 's'}`);
}

function handleSession(session) {
  const email = session?.user?.email?.toLowerCase();
  const isAdmin = email && ADMIN_EMAILS.includes(email);
  adminLoginPanel.hidden = Boolean(isAdmin);
  adminRecordsPanel.hidden = !isAdmin;

  if (isAdmin) {
    setStatus(adminLoginStatus, `Signed in as ${email}`);
    loadRecords();
  } else if (session) {
    database.auth.signOut();
    setStatus(adminLoginStatus, 'This account is not authorized to view records.', true);
  }
}

if (!database) {
  setStatus(databaseStatus, 'Database is not configured yet.');
  form.querySelector('button[type="submit"]').disabled = true;
  adminLoginForm.querySelector('button[type="submit"]').disabled = true;
} else {
  database.auth.getSession().then(({ data }) => handleSession(data.session));
  database.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => handleSession(session), 0);
  });
}

adminLoginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!database) return;

  const email = new FormData(adminLoginForm).get('ADMIN EMAIL').toString().trim().toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    setStatus(adminLoginStatus, 'This email is not authorized.', true);
    return;
  }

  setStatus(adminLoginStatus, 'Sending sign-in link...');
  const { error } = await database.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` }
  });
  setStatus(
    adminLoginStatus,
    error ? 'Could not send sign-in link.' : 'Check your email for the sign-in link.',
    Boolean(error)
  );
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!database) return;

  const formData = new FormData(form);
  const record = Object.fromEntries(COLUMN_NAMES.map(([label, field]) => {
    let value = formData.get(label);
    if (field === 'week') value = Number(value.replace('Week ', ''));
    else if (['invite', 'sign_up', 'invite_achieved', 'sign_up_achieved', 'forms_purchased', 'forms_filled'].includes(field)) value = Number(value);
    else if (field === 'fees_to_pay') value = value === '' ? null : Number(value);
    else if (field === 'report_date') value = value || null;
    return [field, value];
  }));

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setStatus(databaseStatus, 'Saving record...');
  const { error } = await database.from('organization_reports').insert(record);
  submitButton.disabled = false;

  if (error) {
    setStatus(databaseStatus, 'Record could not be saved. Please try again.', true);
    return;
  }

  setStatus(databaseStatus, 'Record saved successfully.');
  form.reset();
});

document.getElementById('downloadRecordsButton').addEventListener('click', async () => {
  if (!database) return;

  const { data, error } = await database
    .from('organization_reports')
    .select(COLUMN_NAMES.map(([, field]) => field).join(','))
    .order('created_at', { ascending: false });

  if (error) {
    setStatus(databaseStatus, 'Could not download records.', true);
    return;
  }

  const csv = [
    COLUMN_NAMES.map(([label]) => escapeCsv(label)).join(','),
    ...data.map((record) => recordToFormValues(record).map(escapeCsv).join(','))
  ].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pace-setters-records.csv';
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById('signOutButton').addEventListener('click', () => {
  database?.auth.signOut();
});
