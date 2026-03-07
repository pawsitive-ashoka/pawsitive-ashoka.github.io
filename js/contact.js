/* ─── contact.js ─── contact form submission ─── */
const EMAILJS_PUBLIC_KEY  = 'wrHfloPerE2lOreVr';
const EMAILJS_SERVICE_ID  = 'service_t6uwwns';
const EMAILJS_TEMPLATE_ID = 'template_zwwhu2y';

emailjs.init(EMAILJS_PUBLIC_KEY);

document.addEventListener('change', (e) => {
  if (e.target?.id !== 'cf-topic') return;
  const customSubjectGrp   = document.getElementById('custom-subject-group');
  const customSubjectInput = document.getElementById('cf-custom-subject');
  const isSomethingElse    = e.target.value === 'Something Else';
  if (customSubjectGrp)   customSubjectGrp.style.display = isSomethingElse ? 'flex' : 'none';
  if (customSubjectInput) {
    if (isSomethingElse) {
      customSubjectInput.setAttribute('required', '');
    } else {
      customSubjectInput.removeAttribute('required');
      customSubjectInput.value = '';
    }
  }
});

async function submitForm(event) {
  event.preventDefault();

  const name          = document.getElementById('cf-name')?.value.trim();
  const email         = document.getElementById('cf-email')?.value.trim();
  const rawTopic      = document.getElementById('cf-topic')?.value.trim();
  const customSubject = document.getElementById('cf-custom-subject')?.value.trim();
  const topic         = rawTopic === 'Something Else' ? (customSubject || '') : rawTopic;
  const message       = document.getElementById('cf-message')?.value.trim();

  const successEl = document.getElementById('formSuccess');
  const errorEl   = document.getElementById('formError');
  const submitBtn = document.getElementById('formSubmitBtn');

  if (errorEl)   errorEl.textContent = '';
  if (successEl) successEl.style.display = 'none';

  if (!name || !email || !rawTopic || !message) {
    if (errorEl) errorEl.textContent = 'Please fill in all fields.';
    return;
  }
  if (rawTopic === 'Something Else' && !customSubject) {
    if (errorEl) errorEl.textContent = 'Please enter a custom subject.';
    return;
  }

  const originalBtnText = submitBtn?.textContent ?? 'send it → 🐾';
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      from_name:  name,
      from_email: email,
      topic:      topic,
      message:    message,
    });
    if (successEl) {
      successEl.style.display = 'block';
      setTimeout(() => { successEl.style.display = 'none'; }, 5000);
    }
    document.getElementById('contact-form')?.reset();
    const customSubjectGrp = document.getElementById('custom-subject-group');
    const customSubjectInput = document.getElementById('cf-custom-subject');
    if (customSubjectGrp) customSubjectGrp.style.display = 'none';
    if (customSubjectInput) customSubjectInput.removeAttribute('required');
  } catch (err) {
    console.error('EmailJS error:', err);
    if (errorEl) errorEl.textContent = 'Something went wrong. Please try again or email us directly.';
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalBtnText; }
  }
}
