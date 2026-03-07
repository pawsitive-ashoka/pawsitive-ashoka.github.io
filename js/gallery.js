/* ─── gallery.js ─── media grid & lightbox ─── */

/* ── CDN bases ── */
const _CLD = 'https://res.cloudinary.com/duij1lw6u';
function _imgUrl(filename) {
  return _CLD + '/image/upload/q_auto,f_auto/gallery/' + filename.replace(/\.[^.]+$/, '');
}
function _vidUrl(filename) {
  return _CLD + '/video/upload/q_auto,f_auto/gallery/' + filename.replace(/\.[^.]+$/, '');
}

/* ── Media manifest — all files from public/gallery/ ── */
const mediaImages = [
  "00b03838-f9cd-47c0-8b46-a443b4de541c.JPG",
  "01fa392d-aff3-4564-94da-2256455f765a.JPG",
  "0214520d-572e-4245-9a4f-2a5d6313d293.JPG",
  "03566528-17ba-4d52-b495-99bda1b56bc4.JPG",
  "069a60a9-97a6-472f-8d25-b092726a7396.JPG",
  "0708dd1d-337d-4015-9c0f-035fea840510.JPG",
  "08b4f9e1-9ee8-4e4f-8bf1-1b0d666c1823.JPG",
  "0b712d98-39f1-463c-9b72-261f9728e99f.JPG",
  "0c36c5d0-d23d-4320-8b5b-174201d76e83.jpg",
  "0e38a9ee-ec3b-43ca-b446-129178fca87a.JPG",
  "13fdf740-1103-4d82-9cc8-946b2126fd29.JPG",
  "143dcb05-7a32-43e4-ae5d-c9b928190d43.JPG",
  "15626c08-f20f-498e-9d35-48443e398812.JPG",
  "16313937-ab72-4ea8-b725-8e61ba308a65.JPG",
  "17a3cbc7-1da2-4e17-917b-c7611123dd1d.JPG",
  "17d98bc6-d777-4763-a6b3-64309850f9b5.JPG",
  "17e7280b-2d59-4869-8e2a-062b2b645a4d.jpg",
  "18736011-5be0-4324-828d-a197a1c0d035.JPG",
  "1903ae70-dc41-4dfb-8488-470d47550fdc.JPG",
  "1933758c-e050-4ee1-9eb4-222cbe7b4a0a.JPG",
  "19b25de6-7b24-4d48-ba0f-c0be8f763204.JPG",
  "1a8f3c17-4a2c-4664-af79-abbb7674820e.JPG",
  "1e582e7b-129a-481d-97a2-a9eaa33d2a37.JPG",
  "22059e15-5225-4959-979c-e33e096a0ec4.JPG",
  "2470384d-94d9-4a6b-bbfe-e1c0bfe94ffd.JPG",
  "29ebc985-0571-4907-bec8-34207fd2b6ed.jpg",
  "2b4162ec-6be1-4bf7-b9df-1b87f0b94c15.JPG",
  "2e2bece5-64e2-4e14-96c4-be934b577293.jpg",
  "2e4f714e-73ad-4111-a75b-e5379c39ffa5.JPG",
  "2fc75f29-0a0d-48a2-b627-b4b67ba21229.JPG",
  "32daa6a1-1f40-4a9f-a854-174743d7d9b0.JPG",
  "3389355e-cbce-407b-a444-3dd47c183aa6.JPG",
  "339f7b1f-b681-4956-9865-d3a4cd194713.jpg",
  "33f61ffa-627f-41ee-9f76-2536cee87ba2.JPG",
  "376263b7-2a07-4292-932e-5176a59a1580.JPG",
  "390e45ee-dbc2-40fb-818d-9442416af798.JPG",
  "3abe48a7-def7-4131-a7da-7daffa592846.jpg",
  "3b29552a-5e6c-47f0-b60f-a33f08e04b40.JPG",
  "3b4130d1-94f0-4659-b9b7-bfea1bb3f054.JPG",
  "3c81bfd0-23e2-4bf4-978f-b1f05f8ce95f.JPG",
  "3f0c389e-26ce-4b0b-9545-c4b78ca7eb95.JPG",
  "41c6e3da-14cf-45e6-8c91-b1cafa1de3fd.jpg",
  "4237d4e5-0d28-48e2-86cb-01f8f3c71d84.JPG",
  "45d3cfd5-58a5-40f9-8beb-922a5861031b.JPG",
  "46b3d192-888c-44f6-9f00-2bafd3c7f4d2.JPG",
  "482969c9-a57c-4742-93c6-60728c8f8627.JPG",
  "498be7c7-3077-4ab9-bd9a-9e1ded81b1ee.JPG",
  "4a0b27aa-87eb-4db5-874c-729a6a13c1cb.JPG",
  "4c1851df-9722-47eb-be88-1d3d29dfc9cf.JPG",
  "4c33edd6-0b26-46b9-bdef-57bc9537c39d.JPG",
  "4d84a8a1-3ca5-4e0b-b24a-ce4976368d1a.JPG",
  "4e0e779b-3c9d-4c80-9f1b-b0e517ac7e21.JPG",
  "4e2e3e7d-0a55-4e75-84b7-d65320fa415a.JPG",
  "4e53585e-949d-4fb2-bee3-f1add24abf6a.jpg",
  "50cfea0c-cb0c-4beb-b2e2-972cd60220ba.JPG",
  "54c60eab-88c3-4052-aec0-fba6ac187d4e.JPG",
  "54f8d44a-ffa4-4308-b8e9-f2d66469fe41.JPG",
  "556336d3-1038-4bd2-81fe-cab23ed1f1cf.JPG",
  "5b6a7f34-ca3c-487c-8ada-ac25df075e53.JPG",
  "5cfdc552-6196-4236-ac38-2002feb28210.jpg",
  "5d62d1f8-d0fd-4549-97a4-161b7d0e09e6.JPG",
  "5e11bae9-756c-4364-b5c7-8488668d79ad.JPG",
  "5e668f18-318b-4c0a-b346-c0e38ed608bc.JPG",
  "5e9e4ae7-8484-4660-8e3e-9ea44c42f3b6.JPG",
  "5f04d518-4ce3-4c7f-b63f-689b2544702d.JPG",
  "629963e0-4d2f-41f9-bfa8-70011f2c6347.JPG",
  "645d7976-adfd-4139-8c7c-2947f7185b34.jpg",
  "65caa2bd-1313-4ffa-b721-26713e81e3fa.JPG",
  "669abf6c-eb0d-4e09-86b7-255719375ecc.JPG",
  "6844a17a-0a95-4a73-9f33-29002757e715.JPG",
  "6a235ea1-f6af-4cf4-b10f-27c0d69fcfbe.JPG",
  "6b00215c-eddd-4a4c-b7b8-a421be50e843.JPG",
  "6b71e836-b33c-401f-bca3-b85b63295dda.JPG",
  "6c8116e1-b9df-41e3-8c4b-68740bddedcf.JPG",
  "6dca9b44-6ad6-493d-8864-ff1a81af2f1b.JPG",
  "6f90adf2-74ed-493d-9fdd-8851c6f19903.JPG",
  "7055f4a0-d4b2-44fa-bd9d-41b14b09e34a.jpg",
  "71e74041-00dc-4aa3-a83d-0598cb46019f.JPG",
  "7399d1a1-fa5a-48fe-96fe-594dcec539fd.JPG",
  "76823c12-e880-4d05-978a-3fe226eecd4b.JPG",
  "76b786dc-cbbe-42a1-ad2a-afbbd83621fd.JPG",
  "76d9148b-1ddb-4e38-8f8d-7a7c3fa31810.jpg",
  "7ba87577-40cd-495f-9b40-bef191dd0090.JPG",
  "7cb87cc9-121f-4aa7-9019-291a290b5996.jpg",
  "7da9dbfb-4b8f-49bf-961a-90c1620fad2c.JPG",
  "7daa87b9-f19c-496f-bb36-e194953f231f.JPG",
  "7e2c21b9-a3ab-4e76-92d7-6b20e9fcd585.JPG",
  "7e31f6d4-20e5-4b9e-8782-d3b0296f9ca4.jpg",
  "8061d1a7-5f58-491f-9519-e6b36af23fe1.JPG",
  "80dd36d6-6e40-4535-86ea-0ae1e481eab9.JPG",
  "86729a43-1bff-45f8-a393-ebe91c68c85a.jpg",
  "8ad3b423-b58c-4cd5-9e4f-a3f48b8cc8d5.JPG",
  "8b1aed6a-7da4-4360-87f7-7b9e4e68f8fe.JPG",
  "8bf961aa-0e84-4b24-94d0-6c2c3baa9373.JPG",
  "8d3a58cd-d196-461b-8e53-ad594757d19f.JPG",
  "8e0cad4b-f765-4f76-80aa-0756befee25d.JPG",
  "8fa9d733-4fd5-422d-bc21-aab5ac0ee1f4.jpg",
  "921d87d8-deef-4925-8664-ef6a210c6dfd.jpg",
  "932cd987-0aef-462e-ae57-fa1bedd6eca7.JPG",
  "950481a6-7f40-41b3-8bbf-358bcac4051c.JPG",
  "95ba0c08-10c5-4e7f-94cf-3f6567a55aea.JPG",
  "95f64668-8a2b-4574-bf98-64c670dba13a.JPG",
  "9c234427-4a70-46e7-9acf-a44fccaf932f.JPG",
  "9cbfaa7b-3737-4f57-af4d-796e2119bde8.JPG",
  "9cd039b1-4025-4761-831f-6602ee36303c.JPG",
  "9eb7a221-dcd4-4cb7-86a3-4cc985cc1682.JPG",
  "D2D6B94E-7FA3-4E8C-89D6-AAAC4D1FE16E.JPG",
  "IMG_0227.JPG",
  "IMG_0860.JPG",
  "IMG_0903.jpg",
  "IMG_0904.jpg",
  "IMG_0906.jpg",
  "IMG_0912.jpg",
  "IMG_0914.JPG",
  "IMG_1986.JPG",
  "IMG_2246.JPG",
  "IMG_2247.JPG",
  "IMG_2248.JPG",
  "IMG_2250.jpg",
  "IMG_2289.JPG",
  "IMG_2308.JPG",
  "IMG_2309.JPG",
  "IMG_2312.JPG",
  "IMG_2313.JPG",
  "IMG_2315.JPG",
  "IMG_5050.JPG",
  "IMG_5134.JPG",
  "IMG_5364.JPG",
  "IMG_5561.JPG",
  "IMG_5562.JPG",
  "IMG_5563.JPG",
  "IMG_5564.JPG",
  "IMG_5582.JPG",
  "IMG_6360.JPG",
  "IMG_6674.JPG",
  "IMG_6677.JPG",
  "IMG_6678.JPG",
  "IMG_6725.JPG",
  "IMG_6726.JPG",
  "IMG_6727.JPG",
  "IMG_6729.JPG",
  "IMG_6730.JPG",
  "IMG_6733.JPG",
  "IMG_6735.JPG",
  "IMG_9412.JPG",
  "IMG_9422.JPG",
  "IMG_9868.JPG",
  "IMG_9870.JPG",
  "IMG_9871.JPG",
  "a1e48d99-bf32-4557-95aa-261cb9123244.JPG",
  "a359868f-a3fb-4f29-a592-0376dcc23d62.JPG",
  "a4755b04-2282-4b3b-bf62-8bfdbb0ff9c5.JPG",
  "a6810074-5a69-43a7-99cf-29c665a93f5f.JPG",
  "a75b11e9-766b-44b8-a370-5fb02e787fc7.JPG",
  "a7c9f8ad-d8e2-4f3a-9f41-f1c1337ba915.JPG",
  "aad0dfd2-3a64-48a2-bee3-e15458af7d2d.JPG",
  "ad95fe76-6fd5-48e9-a600-9444d7ebc577.JPG",
  "adebeec0-10a3-4f56-8ab1-0f31c2f284c1.JPG",
  "b288497d-7502-49cf-942c-476425a2962a.JPG",
  "b35b9d53-c1e9-459e-bb9e-621ac4432222.JPG",
  "b42546c3-04ec-4e9e-89ad-5096cf03ad09.JPG",
  "b59e6af2-60ac-4623-b782-fa6de0b74c33.JPG",
  "b747aff7-dda0-4df6-82a3-d6c9e09f1303.JPG",
  "bd68e52e-888e-48f1-b587-f0d7112f627a.JPG",
  "bdaa1a8c-50a7-428d-b12c-13397298aa33.JPG",
  "c16bbc82-1c42-42d8-98ca-4f393a7d876d.JPG",
  "c1cb75d8-a7b9-4b81-ac16-1b354c3bad30.JPG",
  "c3a3e4ae-37d7-49d1-b54c-0fbf31160ef4.JPG",
  "c6a5a1a5-80fb-4034-bfc5-7eb3d69e15e9.JPG",
  "ca3a74d9-5371-435b-bd0e-290a17b5cc21.jpg",
  "cc3e4ed9-5366-49be-8168-8ae3fec6a2e9.JPG",
  "cc3e6335-7e4d-4432-adb8-8208750bd7fc.JPG",
  "cca763ab-bead-4660-acae-f3317b195490.JPG",
  "cce68074-df43-4d85-b568-c9f290f61ba2.jpg",
  "ce0db236-4fe5-43d8-ab3c-e58228ddc151.JPG",
  "d1ce8e93-f398-4eec-b5ff-935c7e96fd7f.JPG",
  "d406a413-e471-4859-a272-6d2e641e19de.JPG",
  "d45b7672-03e8-46a2-b658-9e17a2022798.JPG",
  "d82dc038-7f95-4692-a425-012307223c24.JPG",
  "d9438704-6d42-4d72-84e8-a1b8f552e6a4.JPG",
  "d9494352-13ca-4389-859b-ce7b3bdb2b3c.JPG",
  "db676009-9d03-4e6f-b42a-15a4b5e04195.JPG",
  "db72715e-8e02-48fb-8053-67872e37e606.JPG",
  "db8a19b0-f976-4179-b17e-fe31ae9a927f.JPG",
  "dd9755e7-f12b-4910-90bf-e4a37350dc1f.jpg",
  "ddb4a409-fc12-471e-9d49-610b80b6f39d.JPG",
  "df7d3a5a-443d-44e0-adbc-c349be65675a.JPG",
  "e1e378d5-ab79-43bf-b6b2-131f5bb29160.JPG",
  "e2de70eb-3b6f-498e-a24f-423bd3b0207c.JPG",
  "e30b0054-0224-41c8-b71b-61dd9f8fe83c.JPG",
  "e3432f64-f1e5-41a2-b8a0-f29ef38d1a55.JPG",
  "e68e7f09-efc9-454e-a4aa-c15cb9f9704f.JPG",
  "e7868a5b-a23a-4cd9-8037-681e6a0c1efb.JPG",
  "e87313e7-f321-4e98-a027-bb9cd0eb43b3.JPG",
  "e87529f9-2b65-4b87-b1e5-afc796ac417f.JPG",
  "e8f7d90c-fe33-42fc-8758-efd892383de5.JPG",
  "eb56b3ea-9079-439b-8384-bf282bb29d03.JPG",
  "ed22805f-f6ae-4ce7-8a48-c9f8f1dd0fec.JPG",
  "ed2656c6-01c2-4345-b166-aef2814d7124.JPG",
  "f08e1656-b110-4ff9-a0e5-137b6f61e1a2.JPG",
  "f106a5e8-bdbf-4423-ab9d-04ee42a2950f.JPG",
  "f12ccaa9-fda4-48fa-a503-56872034a63b.JPG",
  "f13fadc2-e0f0-4023-bb4f-b4e0eb7e49ff.JPG",
  "f297d649-cb74-42c9-b726-73fdc6cb0520.JPG",
  "f398eec9-c11d-4610-baaa-7ee6900d93be.JPG",
  "f4afa269-7d59-4fbe-b8a9-1431d5be67a9.JPG",
  "fed832df-890a-4f41-b732-dc5fa0910e3b.JPG",
  "ffa1fd34-90e8-4eb4-bf28-4911182b09ad.JPG",
];

const mediaVideos = [
  "4719a6af-a21c-46e2-b849-df517a82bd24.MP4",
  "59c69ffd-80d2-4a08-8cbb-f9a664f53d95.MP4",
  "83ac5fbf-8be8-4b90-963b-b82e078f996c.MP4",
  "IMG_2249.MOV",
  "IMG_2252.MOV",
  "IMG_5570.MOV",
  "ebd8ddfe-5352-4c6b-874f-1484d8818191.mov",
];

/* ── Media grid renderer ── */
function renderMediaGrid() {
  const grid = document.getElementById('mediaGrid');
  if (!grid || grid.dataset.rendered) return;
  grid.dataset.rendered = '1';

  let _activeTileVideo = null;

  /* ── Video lazy-load queue: max 2 concurrent metadata fetches ── */
  const _vtQueue = [];
  let _vtActive = 0;
  const VT_CONCURRENT = 2;

  function vtDequeue() {
    while (_vtActive < VT_CONCURRENT && _vtQueue.length) {
      _vtQueue.shift()();
    }
  }

  function vtLoadMeta(tile) {
    const video = tile.querySelector('.vt-video');
    if (video.getAttribute('src')) { return; } // already assigned
    _vtActive++;
    video.src = tile.dataset.vsrc;
    video.preload = 'metadata';
    const done = () => {
      tile.classList.remove('vt-loading');
      _vtActive--;
      vtDequeue();
    };
    video.addEventListener('loadedmetadata', done, { once: true });
    video.addEventListener('error', done, { once: true });
  }

  const _vtObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      _vtQueue.push(() => vtLoadMeta(e.target));
      vtDequeue();
      _vtObserver.unobserve(e.target);
    });
  }, { rootMargin: '300px' });

  // Videos first, then images
  mediaVideos.forEach(filename => {
    const src = _vidUrl(filename);
    const tile = document.createElement('div');
    tile.className = 'media-tile video-tile vt-loading';
    tile.dataset.vsrc = src;
    tile.innerHTML = `
      <video class="vt-video" preload="none" playsinline></video>
      <div class="vt-overlay">
        <button class="vt-play-btn" aria-label="Play">&#9654;</button>
      </div>
      <button class="vt-enlarge-btn" title="Open fullscreen" aria-label="Open fullscreen">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 5V1H5M9 1H13V5M13 9V13H9M5 13H1V9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;

    const video = tile.querySelector('.vt-video');
    const playBtn = tile.querySelector('.vt-play-btn');
    const enlargeBtn = tile.querySelector('.vt-enlarge-btn');

    playBtn.addEventListener('click', e => {
      e.stopPropagation();
      // Force-load immediately if metadata hasn't been fetched yet
      if (!video.getAttribute('src')) {
        video.src = src;
        video.preload = 'auto';
        tile.classList.remove('vt-loading');
      }
      if (_activeTileVideo && _activeTileVideo !== video) {
        _activeTileVideo.pause();
        _activeTileVideo.closest('.video-tile').classList.remove('playing');
      }
      video.play().catch(() => {});
      tile.classList.add('playing');
      _activeTileVideo = video;
    });

    video.addEventListener('click', () => {
      if (!video.paused) {
        video.pause();
        tile.classList.remove('playing');
      }
    });

    video.addEventListener('ended', () => {
      tile.classList.remove('playing');
      _activeTileVideo = null;
    });

    enlargeBtn.addEventListener('click', e => {
      e.stopPropagation();
      openVideoModal(src, video.currentTime);
    });

    grid.appendChild(tile);
    _vtObserver.observe(tile);
  });

  const frag = document.createDocumentFragment();
  mediaImages.forEach((filename, i) => {
    const tile = document.createElement('div');
    tile.className = 'media-tile media-tile-loading';
    const img = document.createElement('img');
    img.dataset.src = _imgUrl(filename);
    img.dataset.fallback = '/public/gallery/' + filename;
    img.alt = 'Pawsitive campus photo';
    img.onload = () => {
      img.classList.add('loaded');
      tile.classList.remove('media-tile-loading');
    };
    img.onerror = () => {
      if (img.dataset.fallback) { const fb = img.dataset.fallback; delete img.dataset.fallback; img.src = fb; }
      else { tile.classList.remove('media-tile-loading'); }
    };
    const overlay = document.createElement('div');
    overlay.className = 'media-tile-overlay';
    overlay.innerHTML = '<span>🔍</span>';
    tile.appendChild(img);
    tile.appendChild(overlay);
    tile.addEventListener('click', () => openLightbox(i));
    frag.appendChild(tile);
  });
  grid.appendChild(frag);

  /* Lazy-load: only fetch images as they approach the viewport */
  const _imgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target.querySelector('img[data-src]');
      if (img) { img.src = img.dataset.src; delete img.dataset.src; }
      _imgObserver.unobserve(entry.target);
    });
  }, { rootMargin: '400px' });

  grid.querySelectorAll('.media-tile:not(.video-tile)').forEach(t => _imgObserver.observe(t));
}

/* ── Image lightbox ── */
let _lbIndex = 0;
let _lbImages = null; // null = gallery mode; array = dept entry mode

function openLightbox(i) {
  _lbImages = null;
  _lbIndex = i;
  const lb = document.getElementById('imgLightbox');
  const lbImg = document.getElementById('lbImg');
  lbImg.dataset.fallback = '/public/gallery/' + mediaImages[_lbIndex];
  lbImg.src = _imgUrl(mediaImages[_lbIndex]);
  document.getElementById('lbCounter').textContent = (_lbIndex + 1) + ' / ' + mediaImages.length;
  lb.classList.add('open');
  lockScroll();
}

function openDeptLightbox(imgs, i) {
  _lbImages = imgs;
  _lbIndex = i;
  const lb = document.getElementById('imgLightbox');
  document.getElementById('lbImg').src = imgs[i];
  document.getElementById('lbCounter').textContent = imgs.length > 1 ? (i + 1) + ' / ' + imgs.length : '';
  lb.classList.add('open');
  lockScroll();
}

function closeLightbox(e) {
  const lb = document.getElementById('imgLightbox');
  if (e.target === lb || e.closeForced) {
    lb.classList.remove('open');
    _lbImages = null;
    unlockScroll();
  }
}

function lightboxNav(dir) {
  const pool = _lbImages || mediaImages;
  _lbIndex = (_lbIndex + dir + pool.length) % pool.length;
  const img = document.getElementById('lbImg');
  img.style.opacity = '0';
  setTimeout(() => {
    if (_lbImages) {
      img.src = _lbImages[_lbIndex];
    } else {
      img.dataset.fallback = '/public/gallery/' + mediaImages[_lbIndex];
      img.src = _imgUrl(mediaImages[_lbIndex]);
    }
    document.getElementById('lbCounter').textContent = (_lbIndex + 1) + ' / ' + pool.length;
    img.style.opacity = '1';
  }, 150);
}

/* ── Video modal ── */
function openVideoModal(src, startTime = 0) {
  const vid = document.getElementById('modalVideo');
  vid.src = src;
  if (startTime > 0) {
    vid.addEventListener('loadedmetadata', () => { vid.currentTime = startTime; }, { once: true });
  }
  document.getElementById('videoModal').classList.add('open');
  lockScroll();
  vid.play().catch(() => {});
}

function closeVideoModal(e) {
  const modal = document.getElementById('videoModal');
  if (e.target === modal || e.closeForced) {
    const vid = document.getElementById('modalVideo');
    vid.pause();
    vid.src = '';
    modal.classList.remove('open');
    unlockScroll();
  }
}

/* ── Keyboard navigation ── */
document.addEventListener('keydown', e => {
  if (document.getElementById('imgLightbox').classList.contains('open')) {
    if (e.key === 'ArrowRight') lightboxNav(1);
    else if (e.key === 'ArrowLeft') lightboxNav(-1);
    else if (e.key === 'Escape') closeLightbox({ closeForced: true });
  }
  if (document.getElementById('videoModal').classList.contains('open')) {
    if (e.key === 'Escape') closeVideoModal({ closeForced: true });
  }
});
