/* ─── contact.js ─── contact form submission ─── */
const EMAILJS_PUBLIC_KEY  = 'wrHfloPerE2lOreVr';
const EMAILJS_SERVICE_ID  = 'service_t6uwwns';
const EMAILJS_TEMPLATE_ID = 'template_zwwhu2y';

function submitForm() {
  const el = document.getElementById('formSuccess');
  if (!el) return;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
