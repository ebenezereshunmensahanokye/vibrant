const REPORT_EMAILS = [
  'ebenezereshunmensahanokye@gmail.com',
  'frankdebrahdarko@gmail.com'
];
const COLUMN_NAMES = [
  'NAME',
  'INVITE',
  'SIGN UP',
  'NAME OF SIGN UP',
  'INVITE ACHIEVED',
  'SIGN UP ACHIEVED',
  'FORMS PURCHASED',
  'FORMS FILLED',
  'WEEK',
  'DATE FOR REPORTING',
  'FEES TO PAY'
];

const form = document.getElementById('reportForm');
const defaultOrganizationName = 'PACE SETTERS DATABASE';
const orgLinkEl = document.getElementById('orgLink');
const orgQrCodeEl = document.getElementById('orgQrCode');

const nameInput = form.querySelector('input[name="NAME"]');
if (nameInput) {
  nameInput.value = defaultOrganizationName;
}

function updateOrgShareLink() {
  const currentUrl = window.location.href;
  const name = (nameInput && nameInput.value.trim()) || defaultOrganizationName;
  const encodedName = encodeURIComponent(name);
  const shareUrl = `${currentUrl.split('?')[0]}?org=${encodedName}`;

  if (orgLinkEl) {
    orgLinkEl.href = shareUrl;
    orgLinkEl.textContent = shareUrl;
  }

  if (orgQrCodeEl) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;
    orgQrCodeEl.src = qrUrl;
    orgQrCodeEl.alt = `${name} QR code`;
  }
}

nameInput?.addEventListener('input', updateOrgShareLink);
window.addEventListener('load', updateOrgShareLink);

form.addEventListener('reset', function () {
  window.setTimeout(() => {
    if (nameInput) {
      nameInput.value = defaultOrganizationName;
      updateOrgShareLink();
    }
  }, 0);
});

function toCsvValue(value) {
  const stringValue = String(value ?? '');
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }
  return stringValue;
}

function createCsvRow(values) {
  return values.map(toCsvValue).join(',');
}

function downloadCsv(data) {
  const csvContent = [createCsvRow(COLUMN_NAMES), createCsvRow(data)].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'organization-report.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function openGmailCompose(content) {
  const subject = encodeURIComponent('Organization Report');
  const body = encodeURIComponent(content);
  const recipients = encodeURIComponent(REPORT_EMAILS.join(','));
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipients}&su=${subject}&body=${body}`;

  window.open(gmailUrl, '_blank');
}

form.addEventListener('submit', function (event) {
  event.preventDefault();

  const formData = new FormData(form);
  const values = COLUMN_NAMES.map((column) => formData.get(column) || '');

  const emailBody = COLUMN_NAMES.map((column, index) => `${column}: ${values[index]}`).join('\n');

  downloadCsv(values);
  openGmailCompose(emailBody);

  alert('Record saved as CSV and prepared for Gmail delivery to both email addresses.');
  form.reset();
});
