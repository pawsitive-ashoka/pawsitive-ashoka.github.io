/* ─── contact.js ─── contact form submission ─── */

function submitForm() {
  const el = document.getElementById('formSuccess');
  if (!el) return;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
