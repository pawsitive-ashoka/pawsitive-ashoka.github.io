/* ─── gallery.js ─── gallery modal data & handlers ─── */

const galleryData = [
  {
    emoji: '🐕',
    bg: 'linear-gradient(135deg,#ffe0c8,#ffc8a0)',
    tag: 'on-ground & feeding',
    title: 'Morning Feeding Round',
    desc: 'Every morning before classes begin, our on-ground volunteers fan out across campus to make sure every dog in our care is fed. Rain or shine, 365 days a year. This is the quiet, unglamorous work that keeps it all going.'
  },
  {
    emoji: '🎪',
    bg: 'linear-gradient(135deg,#c8e8c8,#a8d8a8)',
    tag: 'events & logistics',
    title: 'Flagship Semester Event',
    desc: 'Our semester 1 flagship event brought together students, faculty, and animal welfare advocates for a day of awareness, workshops, and adoption drives. One of our biggest turnouts — and one of our proudest moments.'
  },
  {
    emoji: '🌻',
    bg: 'linear-gradient(135deg,#fff0c0,#ffe080)',
    tag: 'events & logistics',
    title: 'Adoption Camp',
    desc: 'A dedicated adoption drive that connected rescued animals with caring families from the campus community. We coordinated with local shelters and NGOs to ensure every animal had a real chance at a forever home.'
  },
  {
    emoji: '🏥',
    bg: 'linear-gradient(135deg,#e0c8f0,#d0b0e8)',
    tag: 'on-ground & feeding',
    title: 'Monthly Vet Visit',
    desc: "Routine check-ups, vaccinations, and treatment — scheduled monthly through our network of trusted vets. Our medical coordinator tracks every animal's health history so no one slips through the cracks."
  },
  {
    emoji: '🐱',
    bg: 'linear-gradient(135deg,#c8e8e0,#a0d8d0)',
    tag: 'on-ground & feeding',
    title: 'Feline Care Program',
    desc: 'Our campus cats often go unnoticed — but not by us. Through TNR (trap-neuter-return), regular feeding, and health monitoring, we make sure our feline residents live safe, comfortable lives alongside the dog pack.'
  },
  {
    emoji: '📸',
    bg: 'linear-gradient(135deg,#f8c8c8,#f0a0a0)',
    tag: 'social media & marketing',
    title: 'Digital Awareness Campaign',
    desc: 'Our social media team ran a multi-platform campaign covering animal welfare issues, club initiatives, and student stories. Thousands of impressions later, more students know the dogs by name and the feeding roster by heart.'
  }
];

function openModal(i) {
  const d = galleryData[i];
  const thumb = document.getElementById('mThumb');
  thumb.style.background = d.bg;
  thumb.textContent = d.emoji;
  thumb.style.fontSize = '5rem';
  document.getElementById('mTag').textContent = d.tag;
  document.getElementById('mTitle').textContent = d.title;
  document.getElementById('mDesc').textContent = d.desc;
  document.getElementById('galleryModal').classList.add('open');
}

function closeModal(e) {
  const modal = document.getElementById('galleryModal');
  if (e.target === modal) modal.classList.remove('open');
}
