const waNumber = "919993636912";

// CONFIGURATION PANEL: Dynamic content indexing profiles mapping data/ paths directly
const categoryMeta = {
    prewedding: { title: "Prewedding", folder: 'data/prewedding/webp', prefix: 'prewedding', count: 23 },
    maternity: { title: "Maternity", folder: 'data/maternity/webp', prefix: 'maternity', count: 44 },
    cocktail: { title: "Cocktail", folder: 'data/cocktail/webp', prefix: 'cocktail', count: 10 },
    saree: { title: "Saree", folder: 'data/saree/webp', prefix: 'saree', count: 10 },
    convocation: { 
        title: "Convocation", 
        folder: 'data/convocation/webp', 
        prefix: 'convocation', 
        count: 15,
        videos: [0, 1] // Registers convocation0.mp4 and convocation1.mp4 as native video files
    },
    fancy_dress: { title: "Fancy Dress", folder: 'data/fancydress/webp', prefix: 'fancydress', count: 409 },
    mascots: { 
        title: "Mascots", 
        folder: 'data/mascots/webp', 
        prefix: 'mascot', 
        count: 67,
        videos: [0] // Keeps mascot0.mp4 working perfectly
    }
};
// Global application rendering lifecycles context store
let galleryData = {};

const root = document.getElementById('gallery-root');
const dropdownMenu = document.getElementById('dropdown-menu');
const exploreBtn = document.getElementById('explore-btn');
const zoomOverlay = document.getElementById('zoom-overlay');
const zoomTrack = document.getElementById('zoom-track');
const closeBtn = document.getElementById('close-zoom-btn');

// Swipe, Panning and Multi-touch Scale state trackers
let pointX = 0, startX = 0, isDragging = false;
let activePointers = [];
let initialImgScale = 1;
let currentImgScale = 1;
let initialDistance = 0;
let imgPanX = 0, imgPanY = 0;
let startPanX = 0, startPanY = 0;

// PERFORMANCE METRIC CONSTANT: How many images to append per batch on mobile
const BATCH_SIZE = 12;

// SAFE NUMERIC SORT ENGINE
function sortFilesNumerically(filesArray) {
    return filesArray.sort((fileA, fileB) => {
        const matchA = fileA.match(/\d+/);
        const matchB = fileB.match(/\d+/);
        const numA = matchA ? parseInt(matchA[0], 10) : 0;
        const numB = matchB ? parseInt(matchB[0], 10) : 0;
        return numA - numB;
    });
}

// Helper to detect if a specific file index is configured as a video
function isVideoFile(categoryKey, index) {
    const meta = categoryMeta[categoryKey];
    return meta.videos && meta.videos.includes(index);
}

// FULL VIEWPORT ZOOM GESTURES PIPELINE
function openZoom(fileName, categoryKey, isVideo = false) {
    zoomTrack.innerHTML = '';
    resetZoomState();
    
    const fileList = galleryData[categoryKey]; 
    if (!fileList || fileList.length === 0) return;

    const idx = fileList.indexOf(fileName);
    const prev = fileList[idx - 1];
    const next = fileList[idx + 1];
    const frames = [prev, fileName, next];
    const folderPath = categoryMeta[categoryKey].folder;

    frames.forEach((file, i) => {
        const box = document.createElement('div');
        box.className = 'zoom-photo-box';
        
        if (file) {
            const isCurrentCenter = (i === 1);
            const fileIndex = parseInt(file.match(/\d+/)[0], 10);
            const fileIsVideo = isVideoFile(categoryKey, fileIndex);

            if (fileIsVideo) {
                const video = document.createElement('video');
                video.src = `${folderPath}/${file}`;
                video.className = isCurrentCenter ? 'zoom-main-photo' : 'zoom-neighbor-photo';
                video.style.maxHeight = "80%", video.style.maxWidth = "95%", video.style.objectFit = "contain";
                
                if (isCurrentCenter) {
                    video.controls = true;
                    video.autoplay = true;
                    video.playsInline = true;
                } else {
                    video.muted = true;
                }
                box.appendChild(video);
            } else {
                const imgClass = isCurrentCenter ? 'zoom-main-photo' : 'zoom-neighbor-photo';
                box.innerHTML = `<img src="${folderPath}/${file}" class="${imgClass}" alt="Showcase Asset" style="transform-origin: center center;">`;
            }
        }
        zoomTrack.appendChild(box);
    });

    pointX = -window.innerWidth; 
    zoomTrack.style.transition = 'none';
    updateTransform();
    
    zoomOverlay.style.display = 'block';
    document.body.classList.add('lock-scroll');
}

function updateTransform() { 
    zoomTrack.style.transform = `translateX(${pointX}px)`; 
}

function updateImageTargetTransform() {
    const mainImg = zoomTrack.querySelector('.zoom-main-photo');
    if (mainImg) {
        mainImg.style.transform = `translate(${imgPanX}px, ${imgPanY}px) scale(${currentImgScale})`;
    }
}

function resetZoomState() {
    currentImgScale = 1, initialImgScale = 1, imgPanX = 0, imgPanY = 0, activePointers = [];
}

function closeZoom() { 
    zoomOverlay.style.display = 'none'; 
    document.body.classList.remove('lock-scroll'); 
    resetZoomState();
}

closeBtn.addEventListener('click', closeZoom);

zoomOverlay.addEventListener('pointerdown', e => {
    if(e.target === closeBtn) return;
    activePointers.push(e);
    
    if (e.target.classList.contains('zoom-main-photo')) {
        if (e.detail === 2) { 
            if (currentImgScale > 1) { resetZoomState(); } else { currentImgScale = 2.5; }
            zoomTrack.querySelector('.zoom-main-photo').style.transition = 'transform 0.2s ease';
            updateImageTargetTransform();
            return;
        }
    }

    if (activePointers.length === 1) {
        const mainImg = zoomTrack.querySelector('.zoom-main-photo');
        if (mainImg) mainImg.style.transition = 'none';

        if (currentImgScale > 1) {
            isDragging = true;
            startPanX = e.clientX - imgPanX;
            startPanY = e.clientY - imgPanY;
        } else {
            isDragging = true;
            startX = e.clientX - pointX;
            zoomTrack.style.transition = 'none';
        }
    } else if (activePointers.length === 2) {
        isDragging = false; 
        const mainImg = zoomTrack.querySelector('.zoom-main-photo');
        if (mainImg) mainImg.style.transition = 'none';
        initialDistance = Math.hypot(activePointers[0].clientX - activePointers[1].clientX, activePointers[0].clientY - activePointers[1].clientY);
        initialImgScale = currentImgScale;
    }
    zoomOverlay.setPointerCapture(e.pointerId);
});

zoomOverlay.addEventListener('pointermove', e => {
    const index = activePointers.findIndex(p => p.pointerId === e.pointerId);
    if (index !== -1) activePointers[index] = e;

    if (!isDragging && activePointers.length === 2) {
        const currentDistance = Math.hypot(activePointers[0].clientX - activePointers[1].clientX, activePointers[0].clientY - activePointers[1].clientY);
        const factor = currentDistance / initialDistance;
        currentImgScale = Math.min(Math.max(initialImgScale * factor, 1), 4);
        if (currentImgScale === 1) { imgPanX = 0; imgPanY = 0; }
        updateImageTargetTransform();
    } 
    
    if (isDragging && activePointers.length === 1) {
        if (currentImgScale > 1) {
            imgPanX = e.clientX - startPanX, imgPanY = e.clientY - startPanY;
            updateImageTargetTransform();
        } else {
            pointX = e.clientX - startX;
            updateTransform();
        }
    }
});

zoomOverlay.addEventListener('pointerup', e => {
    activePointers = activePointers.filter(p => p.pointerId !== e.pointerId);
    if (activePointers.length < 2 && currentImgScale > 1) { isDragging = false; }
    if (isDragging && activePointers.length === 0) {
        isDragging = false;
        if (currentImgScale === 1) {
            const itemWidth = window.innerWidth;
            zoomTrack.style.transition = 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
            const targetIdx = Math.round(Math.abs(pointX) / itemWidth);
            pointX = -(Math.min(Math.max(0, targetIdx), 2) * itemWidth);
            updateTransform();
        }
    }
});

zoomOverlay.addEventListener('pointercancel', e => { activePointers = []; isDragging = false; });

// SINGLE UI GRID ELEMENT FACTORY
function createGridCard(categoryKey, fileName, folderPath, isVideo = false) {
    const url = `${folderPath}/${fileName}`;
    const card = document.createElement('div');
    card.className = 'photo-cover';
    card.onclick = () => { openZoom(fileName, categoryKey, isVideo); };

    const frame = document.createElement('div');
    frame.className = 'cover-frame';
    
    if (isVideo) {
        const video = document.createElement('video');
        video.src = url; video.muted = true; video.autoplay = true; video.loop = true; video.playsInline = true;
        video.style.width = "100%", video.style.height = "100%", video.style.objectFit = "contain";
        frame.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = url; img.loading = "lazy"; img.alt = `${categoryKey} gallery selection`;
        img.onerror = () => { card.style.display = 'none'; };
        frame.appendChild(img);
    }
    
    const btn = document.createElement('button');
    btn.className = 'wa-order-btn';
    btn.innerText = "INQUIRE ON WHATSAPP";
    btn.onclick = (e) => { 
        e.stopPropagation(); 
        let basePath = window.location.origin + window.location.pathname;
        if (basePath.endsWith('index.html')) basePath = basePath.replace('index.html', '');
        if (!basePath.endsWith('/')) basePath += '/';
        const absoluteImgUrl = `${basePath}${url}`;
        window.open(`https://wa.me/${waNumber}?text=Hello, I would like to check availability status for this design selection: ${absoluteImgUrl}`, '_blank'); 
    };

    card.appendChild(frame);
    card.appendChild(btn);
    return card;
}

function renderNextBatch(categoryKey, targetGrid, nextTriggerBtn) {
    const fileList = galleryData[categoryKey];
    const currentRenderedCount = targetGrid.children.length;
    const nextLimit = Math.min(currentRenderedCount + BATCH_SIZE, fileList.length);
    const folderPath = categoryMeta[categoryKey].folder;

    for (let i = currentRenderedCount; i < nextLimit; i++) {
        const fileName = fileList[i];
        const fileIndex = parseInt(fileName.match(/\d+/)[0], 10);
        const isVideo = isVideoFile(categoryKey, fileIndex);
        const card = createGridCard(categoryKey, fileName, folderPath, isVideo);
        targetGrid.appendChild(card);
    }

    if (nextLimit >= fileList.length) {
        if (nextTriggerBtn) nextTriggerBtn.style.display = 'none';
    } else {
        if (nextTriggerBtn) nextTriggerBtn.innerText = `LOAD MORE (${fileList.length - nextLimit} REMAINING)`;
    }
}

// CENTRAL SYSTEMS INITIALIZATION
function initializeGallery() {
    Object.keys(categoryMeta).forEach(key => {
        const meta = categoryMeta[key];
        let structuredFiles = [];

        for (let i = 0; i < meta.count; i++) {
            if (isVideoFile(key, i)) { structuredFiles.push(`${meta.prefix}${i}.mp4`); } 
            else { structuredFiles.push(`${meta.prefix}${i}.webp`); }
        }

        galleryData[key] = sortFilesNumerically(structuredFiles);

        // Inject link item securely into condensed Dropdown menu
        if (meta.count > 0 && dropdownMenu) {
            const a = document.createElement('a');
            a.href = `#section-${key}`;
            a.innerText = meta.title;
            a.onclick = () => { dropdownMenu.classList.remove('show'); exploreBtn.setAttribute('aria-expanded', 'false'); };
            dropdownMenu.appendChild(a);
        }

        const section = document.createElement('section');
        section.className = 'section-wrap';
        section.id = `section-${key}`;
        if (meta.count === 0) section.style.display = 'none';

        section.innerHTML = `
            <h2 class="section-title">${meta.title}</h2>
            <div class="grid-container" id="grid-${key}"></div>
            <div class="batch-control-box" style="width:100%; display:flex; justify-content:center; margin-top:20px;">
                <button id="btn-load-${key}" class="wa-order-btn" style="max-width:280px; background-color:#FFF; color:var(--text-dark); border:1px solid var(--text-dark); display:none;"></button>
            </div>
        `;
        root.appendChild(section);

        if (meta.count > 0) {
            const targetGrid = document.getElementById(`grid-${key}`);
            const loadBtn = document.getElementById(`btn-load-${key}`);
            renderNextBatch(key, targetGrid, loadBtn);
            if (meta.count > BATCH_SIZE) {
                loadBtn.style.display = 'flex';
                loadBtn.onclick = () => renderNextBatch(key, targetGrid, loadBtn);
            }
        }
    });
}

initializeGallery();

// UI Event Handles for Explore Dropdown Toggle Lifecycles
if (exploreBtn && dropdownMenu) {
    exploreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownMenu.classList.toggle('show');
        exploreBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
        exploreBtn.setAttribute('aria-expanded', 'false');
    });
}

// ==========================================
// ADMIN INJECTION SYSTEM FOR STATIC HOSTING
// ==========================================
const SECRET_PIN = "7250";
const adminFab = document.getElementById('admin-trigger-fab');
const adminModal = document.getElementById('admin-modal');
const authStep = document.getElementById('auth-step');
const uploadStep = document.getElementById('upload-step');
const adminPinInput = document.getElementById('admin-pin');
const verifyPinBtn = document.getElementById('btn-verify-pin');
const submitUploadBtn = document.getElementById('btn-submit-upload');
const closeModalBtn = document.getElementById('btn-close-modal');
const uploadCategorySelect = document.getElementById('upload-category');
const uploadFileInput = document.getElementById('upload-file');

adminFab.addEventListener('click', () => {
    adminPinInput.value = "", authStep.style.display = "block", uploadStep.style.display = "none", adminModal.style.display = "flex";
    uploadCategorySelect.innerHTML = "";
    Object.keys(categoryMeta).forEach(key => {
        const option = document.createElement('option');
        option.value = key; option.innerText = categoryMeta[key].title;
        uploadCategorySelect.appendChild(option);
    });
});

verifyPinBtn.addEventListener('click', () => {
    if (adminPinInput.value === SECRET_PIN) { authStep.style.display = "none"; uploadStep.style.display = "block"; } 
    else { alert("Invalid Code."); adminPinInput.value = ""; }
});

submitUploadBtn.addEventListener('click', () => {
    const selectedCategory = uploadCategorySelect.value;
    const file = uploadFileInput.files[0];
    if (!file) { alert("Choose file."); return; }

    const readerUrl = URL.createObjectURL(file);
    const targetGrid = document.getElementById(`grid-${selectedCategory}`);
    if (targetGrid) {
        const card = createGridCard(selectedCategory, "", "");
        const imgNode = card.querySelector('.cover-frame img');
        if (imgNode) imgNode.src = readerUrl;
        
        card.onclick = () => {
            zoomTrack.innerHTML = ''; resetZoomState();
            const box = document.createElement('div'); box.className = 'zoom-photo-box';
            box.innerHTML = `<img src="${readerUrl}" class="zoom-main-photo" alt="Preview Asset" style="transform-origin: center center;">`;
            zoomTrack.appendChild(box);
            pointX = 0; updateTransform();
            zoomOverlay.style.display = 'block'; document.body.classList.add('lock-scroll');
        };

        targetGrid.insertBefore(card, targetGrid.firstChild);
        adminModal.style.display = "none"; uploadFileInput.value = "";
    }
});
closeModalBtn.addEventListener('click', () => { adminModal.style.display = "none"; });