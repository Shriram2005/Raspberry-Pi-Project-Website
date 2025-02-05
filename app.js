// Import Firebase modules at the top of the file
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBzPZ4xy2c7Tn5Ji-uno6ZID3VboCSW8J4",
    authDomain: "raspberry-pi-bce9b.firebaseapp.com",
    projectId: "raspberry-pi-bce9b",
    storageBucket: "raspberry-pi-bce9b.firebasestorage.app",
    messagingSenderId: "612744359143",
    appId: "1:612744359143:web:2bd880b165d79984430642",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get references to DOM elements
const dataList = document.getElementById('dataList');
const loading = document.getElementById('loading');
const error = document.getElementById('error');

// Add new DOM element references
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const languageFilter = document.getElementById('languageFilter');
const toggleTheme = document.getElementById('toggleTheme');
const aboutLink = document.getElementById('aboutLink');
const aboutModal = document.getElementById('aboutModal');
const closeModal = document.querySelector('.close');

let currentData = []; // Store the fetched data

// Theme toggle functionality
function toggleDarkMode() {
    document.body.setAttribute('data-theme', 
        document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    const icon = toggleTheme.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
}

// Search functionality
function filterData(searchTerm, language) {
    const filteredData = currentData.filter(item => {
        const matchesSearch = searchTerm === '' || 
            Object.values(item).some(value => 
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
        
        const matchesLanguage = language === 'all' || 
            (item[`${language}_translation`] && item[`${language}_translation`] !== 'N/A');
        
        return matchesSearch && matchesLanguage;
    });
    
    displayData(filteredData);
}

// Export to Word functionality
function exportToWord(data) {
    const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'></head><body>
    `;
    
    const footer = "</body></html>";
    const content = `
        <h2>Captured Text Details</h2>
        <p><strong>Original Text:</strong> ${data.original_text}</p>
        <p><strong>English Translation:</strong> ${data.english_translation || 'N/A'}</p>
        <p><strong>Hindi Translation:</strong> ${data.hindi_translation || 'N/A'}</p>
        <p><strong>Marathi Translation:</strong> ${data.marathi_translation || 'N/A'}</p>
    `;

    const blob = new Blob([header + content + footer], {
        type: 'application/msword'
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'captured_text.doc';
    link.click();
    URL.revokeObjectURL(link.href);
}

// Modified display function
function displayData(data) {
    dataList.innerHTML = '';
    
    data.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="data:image/jpeg;base64,${item.image}" alt="Captured Image">
            <div class="text-content">
                <p><strong>Original Text:</strong> ${item.original_text}</p>
                <p><strong>English Translation:</strong> ${item.english_translation || 'N/A'}</p>
                <p><strong>Hindi Translation:</strong> ${item.hindi_translation || 'N/A'}</p>
                <p><strong>Marathi Translation:</strong> ${item.marathi_translation || 'N/A'}</p>
            </div>
            <div class="action-buttons">
                <button class="action-button export-btn" title="Export to Word">
                    <i class="fas fa-file-word"></i> Export
                </button>
                <button class="action-button copy-btn" title="Copy to Clipboard">
                    <i class="fas fa-copy"></i> Copy
                </button>
            </div>
        `;

        // Add event listeners for buttons
        const exportBtn = li.querySelector('.export-btn');
        exportBtn.addEventListener('click', () => exportToWord(item));

        const copyBtn = li.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(item.original_text);
            showToast('Text copied to clipboard!');
        });

        dataList.appendChild(li);
    });
}

// Modified fetch function
async function fetchData() {
    loading.style.display = 'block';
    dataList.innerHTML = '';
    error.style.display = 'none';

    try {
        const querySnapshot = await getDocs(collection(db, 'captured_images'));
        if (!querySnapshot.empty) {
            currentData = [];
            querySnapshot.forEach(doc => {
                currentData.push(doc.data());
            });
            displayData(currentData);
            loading.style.display = 'none';
        } else {
            error.textContent = 'No data found.';
            error.style.display = 'block';
            loading.style.display = 'none';
        }
    } catch (err) {
        console.error('Error fetching data:', err);
        error.textContent = 'Error fetching data. Please try again later.';
        error.style.display = 'block';
        loading.style.display = 'none';
    }
}

// Toast notification function
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Event listeners
function initialize() {
    fetchData();
    
    toggleTheme.addEventListener('click', toggleDarkMode);
    
    searchInput.addEventListener('input', () => {
        filterData(searchInput.value, languageFilter.value);
    });
    
    languageFilter.addEventListener('change', () => {
        filterData(searchInput.value, languageFilter.value);
    });
    
    aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        aboutModal.style.display = 'block';
    });
    
    closeModal.addEventListener('click', () => {
        aboutModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });
}

window.addEventListener('DOMContentLoaded', initialize);