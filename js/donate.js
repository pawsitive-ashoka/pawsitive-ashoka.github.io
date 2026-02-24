/* ─── donate.js ─── UPI copy, amount chips, Razorpay ─── */

function copyUPI() {
  const text = document.getElementById('upiIdText').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = 'copied!';
    btn.classList.add('done');
    setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('done'); }, 2000);
  });
}

function selectChip(el, val) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('donationAmt').value = val;
}

function handleRazorpay() {
  const amount = document.getElementById('donationAmt').value;
  if (!amount || amount < 1) { alert('please enter a donation amount 🐾'); return; }

  const init = () => {
    new Razorpay({
      key: 'YOUR_RAZORPAY_KEY_HERE',   // ← replace with your key
      amount: amount * 100,
      currency: 'INR',
      name: 'Pawsitive',
      description: 'Donation for Campus Animal Welfare',
      handler: r => alert('thank you so much! 🐾\npayment id: ' + r.razorpay_payment_id),
      theme: { color: '#e8654a' }
    }).open();
  };

  if (typeof Razorpay === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = init;
    document.body.appendChild(s);
  } else {
    init();
  }
}
