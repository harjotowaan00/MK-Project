/* ====================================
    JAVASCRIPT CORE LOGIC & DATA
==================================== */

// --- 1. CORE DATA STRUCTURE ---
let productData = []; // Loaded from backend dynamically
const backendURL = 'http://localhost:3000';

const indianStatesUTs = [
    "All India", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", 
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

let currentFilter = { location: 'All India', category: 'All', search: '' };
let userData = { name: 'John Doe', phone: '7082384800' };
let uploadedImageURLs = [];
let currentDetailItem = null;

// --- 2. DOM REFERENCES ---
const welcomeScreen = document.getElementById('welcome-screen');
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const sellScreen = document.getElementById('sell-screen');
const profileScreen = document.getElementById('profile-screen');
const productDetailModal = document.getElementById('product-detail-modal');
const photoViewerModal = document.getElementById('photo-viewer-modal');
const locationModal = document.getElementById('location-modal');
const appFooter = document.querySelector('.app-footer');
const signupContainer = document.getElementById('signup-container');
const otpContainer = document.getElementById('otp-container');

let currentScreen = welcomeScreen;
let historyStack = [];

// --- 3. IMAGE HANDLING ---
function previewImages(event) {
    const files = event.target.files;
    const previewContainer = document.getElementById('image-preview-container');
    previewContainer.innerHTML = '';
    uploadedImageURLs = [];

    const maxFiles = Math.min(files.length, 10);
    for (let i = 0; i < maxFiles; i++) {
        const file = files[i];
        if (!file || !file.type.startsWith('image/')) continue;

        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target.result;
            uploadedImageURLs.push(url);
            const img = document.createElement('img');
            img.src = url;
            img.className = 'image-preview';
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    }

    if (files.length > 10) {
        alert(`You selected ${files.length} files. Only the first 10 will be uploaded.`);
    }
}

// --- 4. SCREEN NAVIGATION ---
function showScreen(screenToShow) {
    const oldScreen = currentScreen;
    currentScreen = screenToShow;

    oldScreen.style.display = 'none';
    screenToShow.style.display = 'block';

    if (historyStack[historyStack.length - 1] !== screenToShow.id) {
        historyStack.push(screenToShow.id);
    }

    const showFooter = [dashboardScreen, sellScreen, profileScreen].includes(screenToShow);
    appFooter.style.display = showFooter ? 'flex' : 'none';

    if (screenToShow === dashboardScreen) loadItems();
    if (screenToShow === profileScreen) renderProfileListings();
}

// --- 5. PRODUCT DETAIL MODALS ---
function openProductDetail(itemId) {
    const data = productData.find(item => item._id === itemId);
    if (!data) return alert('Product details not found.');
    currentDetailItem = data;

    document.getElementById('detail-title').textContent = data.title;
    document.getElementById('detail-description').textContent = data.description || data.desc || '';
    document.getElementById('detail-price').textContent = `₹${data.price}`;
    document.getElementById('detail-category').textContent = data.category;
    document.getElementById('detail-location').textContent = `${data.city}, ${data.state}`;
    document.getElementById('detail-owner').textContent = userData.name;
    document.getElementById('detail-contact-display').textContent = data.sellerContact || data.contact;

    const photoGallery = document.getElementById('detail-photo-gallery');
    photoGallery.innerHTML = '';

    if (data.images.length > 0) {
        data.images.forEach(url => {
            photoGallery.innerHTML += `<div class="detail-photo-wrapper"><img src="${url}" alt="${data.title}"></div>`;
        });
    } else {
        photoGallery.innerHTML = `<div class="detail-photo-wrapper"><div style="color:#666;">No Photos Uploaded</div></div>`;
    }

    document.getElementById('detail-contact-btn').onclick = () => {
        window.location.href = `tel:${data.sellerContact || data.contact}`;
    };

    productDetailModal.classList.add('active');
    historyStack.push('product-detail-modal');
}
function closeProductDetail() {
    productDetailModal.classList.remove('active');
    if (historyStack[historyStack.length - 1] === 'product-detail-modal') historyStack.pop();
}

// --- 6. PHOTO VIEWER ---
function openPhotoViewer() {
    if (!currentDetailItem || !currentDetailItem.images.length) return;
    const viewerContent = document.getElementById('photo-viewer-content');
    viewerContent.innerHTML = currentDetailItem.images.map(url => `<div class="photo-viewer-slide"><img src="${url}" alt="Product"></div>`).join("");
    photoViewerModal.classList.add('active');
}
function closePhotoViewer() { photoViewerModal.classList.remove('active'); }

// --- 7. DATA RENDERING ---
function formatPrice(price) { return `₹${price}`; }

function createProductCard(item) {
    const card = document.createElement('article');
    card.className = `product-card ${item.status === 'sold' ? 'sold-out' : ''}`;
    card.onclick = () => openProductDetail(item._id);

    const imageContent = item.images.length > 0 ? `<img src="${item.images[0]}">` : '✅';
    card.innerHTML = `
        <div class="product-card-image">${imageContent}</div>
        <h3>${item.title}</h3>
        <p><strong>${formatPrice(item.price)}</strong></p>
        <p style="font-size:0.8em;color:gray;">${item.city}, ${item.state}</p>
    `;
    return card;
}

// --- 8. LOAD ITEMS FROM BACKEND ---
async function loadItems() {
    const container = document.getElementById('product-list-container');
    container.innerHTML = '<p>Loading items...</p>';

    try {
        const res = await fetch(`${backendURL}/api/items`);
        const items = await res.json();
        productData = items;

        const filtered = productData.filter(item => {
            const isActive = (item.status || 'active') === 'active';
            const loc = currentFilter.location === 'All India' || item.state === currentFilter.location;
            const cat = currentFilter.category === 'All' || item.category === currentFilter.category;
            const term = currentFilter.search.toLowerCase();
            const search = !term || item.title.toLowerCase().includes(term) || (item.description || '').toLowerCase().includes(term);
            return isActive && loc && cat && search;
        });

        if(filtered.length === 0){
            container.innerHTML = `<p style="text-align:center;padding:50px;">No items available in ${currentFilter.location}.</p>`;
            return;
        }

        container.innerHTML = '';
        filtered.forEach(item => container.appendChild(createProductCard(item)));

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Error loading items</p>';
    }
}

// --- 9. PROFILE LISTINGS ---
function renderProfileListings() {
    const activeListingsContainer = document.getElementById('active-listings');
    activeListingsContainer.innerHTML = '';

    const userItems = productData.filter(item =>
        item.sellerContact === userData.phone || item.owner === userData.name
    );

    if(userItems.length === 0){
        activeListingsContainer.innerHTML = '<li>No items found</li>';
        return;
    }

    userItems.forEach(item => {
        const itemStatus = (item.status || 'active'); 
        const buttonText = itemStatus === 'sold' ? 'Re-list Item' : 'Mark as Sold';
        const buttonColor = itemStatus === 'sold' ? '#ffc107' : 'var(--primary-color)';
        
        activeListingsContainer.innerHTML += `
            <li id="listing-${item._id}">
                <span style="font-weight: bold;">${item.title} (${itemStatus.toUpperCase()})</span> 
                <button 
                    style="background-color: ${buttonColor}; color: ${itemStatus === 'sold' ? '#333' : 'white'};
                    border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; float: right;"
                    onclick="toggleStatus(this, '${item._id}')"
                >${buttonText}</button>
            </li>`;
    });
}

// --- 10. ITEM STATUS TOGGLE ---
async function toggleStatus(btn, id) {
    const i = productData.findIndex(x => x._id === id);
    if (i === -1) return;
    const item = productData[i];
    let newStatus;

    if ((item.status || 'active') === 'active') {
        if (confirm(`Mark "${item.title}" as SOLD?`)) newStatus = 'sold';
    } else {
        if (confirm(`Re-list "${item.title}"?`)) newStatus = 'active';
    }
    if (!newStatus) return;

    const ok = await updateItemStatus(id, newStatus);
    if (ok) {
        item.status = newStatus;
        renderProfileListings();
        loadItems();
    }
}
async function updateItemStatus(id, newStatus) {
    try {
        const res = await fetch(`${backendURL}/api/items/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        return res.ok;
    } catch {
        alert('Failed to update status');
        return false;
    }
}

// --- 11. LOCATION SELECT ---
function populateLocations() {
    const container = document.getElementById('location-button-container');
    const select = document.getElementById('item-state');
    container.innerHTML = '';
    select.innerHTML = '<option value="">Select State</option>';

    indianStatesUTs.forEach(state => {
        const btn = document.createElement('button');
        btn.innerHTML = state === 'All India' ? `🌐 ${state}` : `📍 ${state}`;
        btn.onclick = () => selectLocation(state);
        btn.style.cssText = 'width:100%;padding:12px;margin-bottom:10px;border-radius:8px;cursor:pointer;';
        container.appendChild(btn);

        if (state !== 'All India') {
            const opt = document.createElement('option');
            opt.value = state; opt.textContent = state;
            select.appendChild(opt);
        }
    });
}
function selectLocation(name) {
    currentFilter.location = name;
    document.getElementById('change-location-btn').innerHTML = `📍 ${name}`;
    loadItems();
    closeLocationSelector();
}
function openLocationSelector() { populateLocations(); locationModal.classList.add('active'); historyStack.push('location-modal'); }
function closeLocationSelector() { locationModal.classList.remove('active'); if (historyStack[historyStack.length - 1] === 'location-modal') historyStack.pop(); }

// --- 12. AUTH FLOW ---
document.getElementById('signup-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    if (name && phone.length >= 10) {
        userData.name = name;
        userData.phone = phone;
        signupContainer.style.display = 'none';
        otpContainer.style.display = 'block';
    } else alert('Enter valid name and phone.');
});
document.getElementById('otp-form').addEventListener('submit', e => {
    e.preventDefault();
    const otp = document.getElementById('otp').value;
    if (otp.length === 6) {
        document.getElementById('user-name-display').textContent = userData.name;
        document.getElementById('user-phone-display').textContent = userData.phone.slice(0, 9) + 'XXXXX';
        showScreen(dashboardScreen);
    } else alert('Please enter a valid 6-digit OTP.');
});
document.getElementById('logout-btn').addEventListener('click', () => {
    userData = { name: 'John Doe', phone: '+91 98765XXXXX' };
    showScreen(authScreen);
});

// --- 13. SELL FORM ---
document.getElementById('sell-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemData = {
        title: document.getElementById('item-title').value,
        description: document.getElementById('item-desc').value,
        price: parseFloat(document.getElementById('item-price').value),
        category: document.getElementById('item-category').value,
        state: document.getElementById('item-state').value,
        city: document.getElementById('item-city').value,
        sellerContact : userData.phone,
        owner: userData.name,
        status: 'active',
        images: uploadedImageURLs
    };

    try {
        const res = await fetch(`${backendURL}/api/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        const data = await res.json();
        alert(data.message || 'Item posted successfully!');
        document.getElementById('sell-form').reset();
        uploadedImageURLs = [];
        loadItems();
        showScreen(dashboardScreen);
    } catch (err) {
        console.error(err);
        alert('Error posting item');
    }
});

// --- 14. FILTER & SEARCH ---
document.getElementById('main-search-input').addEventListener('input', e => {
    currentFilter.search = e.target.value.trim();
    loadItems();
});

const categoryButtons = document.querySelectorAll('.category-bar .category-button');
categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter.category = btn.getAttribute('data-category');
        loadItems();
    });
});

// --- 15. INIT ---
document.addEventListener('DOMContentLoaded', () => {
    populateLocations();
    loadItems();

    document.getElementById('nav-home').addEventListener('click', () => showScreen(dashboardScreen));
    document.getElementById('nav-sell').addEventListener('click', () => showScreen(sellScreen));
    document.getElementById('nav-profile').addEventListener('click', () => showScreen(profileScreen));

    setTimeout(() => { showScreen(authScreen); }, 1000);
});
