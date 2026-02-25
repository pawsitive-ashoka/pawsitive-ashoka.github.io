/* ─── app.js ─── page navigation, page loading, theme ─── */

const PAGES = ['home','about','dogs','departments','team','gallery','donate','contact'];
const DEPT_SLUGS = ['events','finance','ground','social'];
const _loaded = {};
let _currentDept = null;

/* ── Dept detail content (inline — no fetch needed) ── */
const DEPT_CONTENT = {
  events: {
    num: 'VERTICAL 01', icon: '🎪', title: 'Events & Logistics',
    tagline: 'The creative engine. Ideas into action.',
    heroClass: 'dept-detail-hero--01',
    what: `Events & Logistics is the team that brings Pawsitive to life on campus. From intimate awareness workshops to large-scale adoption drives, every initiative you see from us starts here. This team plans, coordinates, and executes everything — managing timelines, logistics, volunteers, and the on-the-day experience so that every event lands exactly as intended.
    <br><br>We don't just run events for the sake of running them. Each initiative is rooted in a purpose: to shift perceptions around animals on campus, to educate the community, and to deepen engagement.`,
    resp: ['Ideating, planning & executing original events and campaigns — independently and alongside other student groups','Leading at least one flagship event per semester alongside a calendar of smaller thematic initiatives','Managing budgets, venue logistics, volunteer coordination, and communication for every event','Primary point of contact for external collaborators, partner organisations, and workshop leads','Documenting every event thoroughly — photos, attendance records, feedback — for institutional memory'],
    highlights: [['🐶','Adoption Drives','Coordinating with shelters to host on-campus adoption events connecting students with dogs in need of homes.'],['🎨','Awareness Campaigns','Themed campaigns around World Animal Day, anti-cruelty awareness, and responsible pet ownership.'],['🤝','Inter-Club Collaborations','Joint events with cultural clubs, sustainability groups, and student government to broaden reach.']],
    who: `You love organising things. You think in checklists but act with creativity. You're comfortable taking ownership of a project from zero and shepherding it through to completion. You don't mind the chaos that comes with event day — in fact, you enjoy it.`
  },
  finance: {
    num: 'VERTICAL 02', icon: '💼', title: 'Finance & Outreach',
    tagline: 'The backbone of sustainability.',
    heroClass: 'dept-detail-hero--02',
    what: `Finance & Outreach is the team that keeps Pawsitive operationally alive. Without this vertical, nothing else runs. We manage every rupee that flows through the club — from donations to event revenue — and make sure that funds reach exactly where they're needed: emergency vet bills, food supplies, medication, and more.
    <br><br>But it's not just about the numbers. This team also builds Pawsitive's external relationships — reaching out to companies, NGOs, and aligned organisations for funding, sponsorships, and collaborative opportunities.`,
    resp: ['Managing all incoming finances — donations, event revenue, grants — with transparent and accurate record-keeping','Ensuring funds are available for medical care, food & emergency needs at all times','Processing timely reimbursements for all club expenses across verticals','Outreach to companies, NGOs & aligned organisations for funding, resources & long-term collaborations','Drafting funding proposals and maintaining relationships with existing sponsors and donors','Producing termly financial summaries to keep the club accountable and transparent'],
    highlights: [['💰','Emergency Medical Fund','Raising and managing a dedicated reserve for urgent veterinary care — ensuring no animal is left untreated due to cost.'],['🤝','NGO Partnerships','Building partnerships with animal welfare NGOs for resource sharing, joint campaigns, and on-ground support.'],['📊','Transparent Reporting','Establishing financial dashboards and termly reports to maintain full club accountability.']],
    who: `You're financially literate and organised. You care deeply about how resources are allocated and you hold yourself to a high standard of accuracy. You're also personable and comfortable reaching out to organisations cold — you believe in the cause enough to pitch it convincingly to strangers.`
  },
  ground: {
    num: 'VERTICAL 03', icon: '🐾', title: 'On-Ground & Feeding',
    tagline: 'The heart of Pawsitive. Present every single day.',
    heroClass: 'dept-detail-hero--03',
    what: `On-Ground & Feeding is where the mission becomes real. While the other verticals support, plan, and amplify — this team does the work that directly touches the animals. Every morning and evening, this team ensures that the dogs on campus are fed, healthy, and looked after. No exceptions. No holidays.
    <br><br>Beyond feeding, this team is the first responder for any animal in distress. Medical emergencies, injuries, and illness — this team spots them, responds, and coordinates care. They know every dog by name, personality, and medical history.`,
    resp: ['Year-round feeding operations twice daily, coordinating student schedules including during vacation periods','Responding to medical emergencies — first assessment, contacting vets, transporting animals if needed','Maintaining stocked first-aid kits and medication schedules for all animals under care','Maintaining an updated census of all animals — names, health records, feeding notes, and status','Coordinating all veterinary visits, follow-up appointments, and post-treatment care','Monitoring behavioural and health changes in campus animals and flagging concerns early'],
    highlights: [['🏥','Emergency Response','Rapid response to injuries and illnesses — coordinating vet visits and ensuring no animal suffers alone.'],['🍖','365-Day Feeding','Uninterrupted daily feeding across all seasons, including summer and winter breaks when the campus empties.'],['💉','Vaccination Drives','Coordinating mass vaccination and sterilisation drives with licensed vets to keep the campus dog population healthy.']],
    who: `You're reliable above everything else. You care deeply about animals and you're not squeamish about the hard parts of welfare work — dirt, illness, grief. You communicate well in a team because coordination is everything here. And you show up, every time, because the dogs depend on it.`
  },
  social: {
    num: 'VERTICAL 04', icon: '📱', title: 'Social Media & Marketing',
    tagline: 'The voice of Pawsitive. Online, always.',
    heroClass: 'dept-detail-hero--04',
    what: `Social Media & Marketing is how Pawsitive reaches beyond the campus gates. This team translates the work of every other vertical into content — stories, artwork, articles, and campaigns that build our audience and make people care.
    <br><br>Beyond aesthetics, this team is also our documentation arm. Every event, every medical win, every new face on campus — they capture it. That record becomes institutional memory, proof of impact, and a tool for future fundraising and collaborations.`,
    resp: ['Curating & posting content across all platforms — artwork, articles, reels, and commentary on relevant issues','Leading digital campaigns tied to events, awareness days, and adoption drives','Ensuring consistent documentation of all club initiatives year-round — photos, captions, stories','Managing the club\'s Instagram, LinkedIn, and any other active platforms with a coherent voice','Building a credible professional presence on LinkedIn for external collaborators and prospective sponsors','Analysing reach and engagement data to continuously improve content strategy'],
    highlights: [['📸','Dog Spotlights','Regular features on the campus dogs — their names, personalities, and stories — building a following that genuinely cares.'],['✍️','Animal Welfare Writing','Long-form posts and articles on stray animal rights, anti-cruelty laws, and responsible coexistence with campus animals.'],['📣','Campaign Launches','Digital-first campaigns driving online and offline action — from adoption sign-ups to donations to volunteer recruitment.']],
    who: `You have a strong visual and written sense. You're opinionated about aesthetics and you default to quality. You understand how social media actually works — not just vanity metrics, but what drives real engagement and community. You're consistent and you don't let the content calendar slip.`
  }
};

function showDeptDetail(slug) {
  const d = DEPT_CONTENT[slug];
  if (!d) return;

  const respItems = d.resp.map(r => `<li>${r}</li>`).join('');
  const highlights = d.highlights.map(([icon, title, desc]) =>
    `<div class="dept-highlight-card"><span class="dept-highlight-icon">${icon}</span><div><strong>${title}</strong><p>${desc}</p></div></div>`
  ).join('');

  const html = `
    <div class="dept-detail-back">
      <button class="dept-back-btn" onclick="backToDepartments()">← back to departments</button>
    </div>
    <div class="dept-detail-hero ${d.heroClass}">
      <div class="dept-detail-num">${d.num}</div>
      <span class="dept-detail-icon">${d.icon}</span>
      <h1 class="dept-detail-title">${d.title}</h1>
      <p class="dept-detail-tagline">${d.tagline}</p>
    </div>
    <div class="dept-detail-content">
      <div class="dept-detail-section">
        <h2>what we do</h2>
        <p>${d.what}</p>
      </div>
      <div class="dept-detail-section">
        <h2>responsibilities</h2>
        <ul class="dept-resp">${respItems}</ul>
      </div>
      <div class="dept-detail-section">
        <h2>past highlights</h2>
        <div class="dept-highlights">${highlights}</div>
      </div>
      <div class="dept-detail-section">
        <h2>who thrives here</h2>
        <p>${d.who}</p>
      </div>
    </div>
    <footer>made with <span class="heart">❤️</span> by pawsitive · ashoka university · 🐾</footer>`;

  const detailContainer = document.getElementById('page-dept-detail');
  detailContainer.innerHTML = html;

  PAGES.forEach(p => {
    document.getElementById('page-' + p).classList.remove('active');
    const btn = document.getElementById('nav-' + p);
    if (btn) btn.classList.remove('active');
  });
  const deptBtn = document.getElementById('nav-departments');
  if (deptBtn) deptBtn.classList.add('active');
  detailContainer.classList.add('active');
  closeNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadPage(name) {
  if (_loaded[name]) return;
  const container = document.getElementById('page-' + name);
  if (!container) return;
  try {
    const res = await fetch('pages/' + name + '.html');
    if (!res.ok) throw new Error(res.status);
    const html = await res.text();
    container.innerHTML = html;
    _loaded[name] = true;
    if (name === 'dogs') loadDogs();
    if (name === 'departments') setupDeptCards();
  } catch (e) {
    container.innerHTML = `<div style="text-align:center;padding:4rem 2rem;font-family:'Caveat',cursive;font-size:1.3rem;color:var(--accent);">
      ⚠️ couldn't load this page right now. try refreshing.
    </div>`;
  }
}

async function showPage(name) {
  PAGES.forEach(p => {
    document.getElementById('page-' + p).classList.remove('active');
    const btn = document.getElementById('nav-' + p);
    if (btn) btn.classList.remove('active');
  });
  // Also hide dept detail page
  const deptDetail = document.getElementById('page-dept-detail');
  if (deptDetail) deptDetail.classList.remove('active');
  await loadPage(name);
  document.getElementById('page-' + name).classList.add('active');
  const activeBtn = document.getElementById('nav-' + name);
  if (activeBtn) activeBtn.classList.add('active');
  closeNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function showDeptDetail(slug) {
  // Hide all main pages
  PAGES.forEach(p => {
    document.getElementById('page-' + p).classList.remove('active');
    const btn = document.getElementById('nav-' + p);
    if (btn) btn.classList.remove('active');
  });
  // Mark departments nav as active (we're a sub-page)
  const deptBtn = document.getElementById('nav-departments');
  if (deptBtn) deptBtn.classList.add('active');
  // Always load the requested dept page (replace whatever is currently showing)
  const detailContainer = document.getElementById('page-dept-detail');
  try {
    if (_currentDept !== slug) {
      const res = await fetch('pages/dept-' + slug + '.html');
      if (!res.ok) throw new Error(res.status);
      detailContainer.innerHTML = await res.text();
      _currentDept = slug;
    }
  } catch (e) {
    detailContainer.innerHTML = `<div style="text-align:center;padding:4rem 2rem;font-family:'Caveat',cursive;font-size:1.3rem;color:var(--accent);">⚠️ couldn't load this page right now. try refreshing.</div>`;
    _currentDept = null;
  }
  detailContainer.classList.add('active');
  closeNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToDepartments() {
  document.getElementById('page-dept-detail').classList.remove('active');
  showPage('departments');
}

function toggleEventCard(card) {
  card.classList.toggle('open');
}

function setupDeptCards() {
  // Ensure keyboard accessibility works after dynamic load
  document.querySelectorAll('.dept-card-link').forEach(card => {
    card.style.cursor = 'pointer';
  });
}

function toggleNav() {
  const links = document.getElementById('nav-links');
  const btn = document.getElementById('hamburger');
  const open = links.classList.toggle('open');
  btn.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open);
}

function closeNav() {
  const links = document.getElementById('nav-links');
  const btn = document.getElementById('hamburger');
  links.classList.remove('open');
  btn.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
}

function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
}

document.addEventListener('DOMContentLoaded', () => showPage('home'));
