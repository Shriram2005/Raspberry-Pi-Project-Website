// Import Firebase modules
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

// DOM Elements
const elements = {
    dataList: document.getElementById('dataList'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    searchInput: document.getElementById('searchInput'),
    searchButton: document.getElementById('searchButton'),
    languageFilter: document.getElementById('languageFilter'),
    toggleTheme: document.getElementById('toggleTheme'),
    increaseFontSize: document.getElementById('increaseFontSize'),
    decreaseFontSize: document.getElementById('decreaseFontSize'),
    toggleHighContrast: document.getElementById('toggleHighContrast'),
    readAloud: document.getElementById('readAloud'),
    aboutLink: document.getElementById('aboutLink'),
    helpLink: document.getElementById('helpLink'),
    privacyLink: document.getElementById('privacyLink'),
    contactLink: document.getElementById('contactLink'),
    modals: {
        about: document.getElementById('aboutModal'),
        help: document.getElementById('helpModal')
    },
    speakPage: document.getElementById('speakPage'),
};

let currentData = [];
let currentFontSize = 16;
const synth = window.speechSynthesis;

// Speech Synthesis Configuration
const speechConfig = {
    voice: null,
    rate: 1,
    pitch: 1,
    volume: 1,
    lang: 'en-US'
};

// Initialize speech synthesis
async function initializeSpeech() {
    return new Promise((resolve) => {
        const checkVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Try to find a good English voice
                speechConfig.voice = voices.find(voice => 
                    voice.lang.includes('en-') && voice.localService) || 
                    voices.find(voice => voice.lang.includes('en-')) || 
                    voices[0];
                resolve();
            } else {
                setTimeout(checkVoices, 100);
            }
        };

        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = checkVoices;
        }
        checkVoices();
    });
}

// Accessibility Features
const accessibility = {
    increaseFontSize() {
        if (currentFontSize < 24) {
            currentFontSize += 2;
            document.documentElement.style.fontSize = `${currentFontSize}px`;
            showToast('Font size increased');
        }
    },

    decreaseFontSize() {
        if (currentFontSize > 12) {
            currentFontSize -= 2;
            document.documentElement.style.fontSize = `${currentFontSize}px`;
            showToast('Font size decreased');
        }
    },

    toggleHighContrast() {
        document.body.classList.toggle('high-contrast');
        const isHighContrast = document.body.classList.contains('high-contrast');
        showToast(`High contrast mode ${isHighContrast ? 'enabled' : 'disabled'}`);
    },

    async readAloud(text, shouldInterrupt = true, lang = 'en-US') {
        try {
            if (!text || text === 'N/A') {
                showToast('No text available to read');
                return;
            }

            if (shouldInterrupt && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            
            // Find appropriate voice for the language
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.lang.startsWith(lang.split('-')[0])) || 
                         voices.find(v => v.lang === 'en-US') ||
                         voices[0];
            
            utterance.voice = voice;
            utterance.rate = speechConfig.rate;
            utterance.pitch = speechConfig.pitch;
            utterance.volume = speechConfig.volume;
            utterance.lang = lang;

            utterance.onstart = () => {
                showToast('Started reading text');
            };

            utterance.onend = () => {
                showToast('Finished reading text');
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                showToast('Error reading text. Please try again.');
            };

            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Speech synthesis error:', error);
            showToast('Error initializing speech. Please check browser compatibility.');
        }
    },

    readPageContent() {
        const mainContent = document.getElementById('main-content');
        const textContent = this.extractReadableText(mainContent);
        this.readAloud(textContent);
    },

    extractReadableText(element) {
        const excludeSelectors = '.skip-link, .visually-hidden, [aria-hidden="true"]';
        const clone = element.cloneNode(true);
        
        // Remove elements that shouldn't be read
        clone.querySelectorAll(excludeSelectors).forEach(el => el.remove());
        
        // Extract text content with proper spacing
        return Array.from(clone.querySelectorAll('h1, h2, h3, p, li, label, button'))
            .map(el => el.textContent.trim())
            .filter(text => text)
            .join('. ');
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch(e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        elements.searchInput.focus();
                        break;
                    case 'r':
                        e.preventDefault();
                        fetchData();
                        break;
                    case 't':
                        e.preventDefault();
                        toggleDarkMode();
                        break;
                    case 'a':
                        e.preventDefault();
                        document.querySelector('.accessibility-controls').classList.toggle('visible');
                        break;
                    case 'h':
                        e.preventDefault();
                        this.toggleHighContrast();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.readPageContent();
                        break;
                }
            }
        });
    }
};

// Theme toggle functionality
function toggleDarkMode() {
    const theme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', theme);
    const icon = elements.toggleTheme.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
    showToast(`${theme.charAt(0).toUpperCase() + theme.slice(1)} mode enabled`);
}

// Search and filter functionality
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

// Display functionality
function displayData(data) {
    elements.dataList.innerHTML = '';
    
    if (data.length === 0) {
        elements.dataList.innerHTML = '<li class="no-results">No results found</li>';
        return;
    }

    data.forEach(item => {
        const li = document.createElement('li');
        li.className = 'card';
        li.innerHTML = `
            <div class="card-image-container">
                <img src="data:image/jpeg;base64,${item.image}" 
                     alt="Captured text image" 
                     class="card-image"
                     loading="lazy">
            </div>
            <div class="card-content">
                <div class="text-section">
                    <div class="translation-header">
                        <h3>Original Text</h3>
                        <div class="translation-actions">
                            <button class="btn btn-secondary copy-btn" title="Copy original text">
                                <i class="fas fa-copy" aria-hidden="true"></i>
                            </button>
                            <button class="btn btn-accent speak-btn" title="Read original text">
                                <i class="fas fa-volume-up" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    <p class="text-content">${item.original_text}</p>
                </div>

                <div class="translations">
                    ${Object.entries(item)
                        .filter(([key]) => key.endsWith('_translation'))
                        .map(([key, value]) => {
                            const lang = key.split('_')[0];
                            return `
                                <div class="translation-section">
                                    <div class="translation-header">
                                        <h4>${lang.charAt(0).toUpperCase() + lang.slice(1)} Translation</h4>
                                        <div class="translation-actions">
                                            <button class="btn btn-secondary copy-btn" title="Copy ${lang} translation">
                                                <i class="fas fa-copy" aria-hidden="true"></i>
                                            </button>
                                            <button class="btn btn-accent speak-btn" title="Read ${lang} translation"
                                                    data-lang="${lang === 'english' ? 'en-US' : lang === 'hindi' ? 'hi-IN' : 'mr-IN'}">
                                                <i class="fas fa-volume-up" aria-hidden="true"></i>
                                            </button>
                                            <button class="btn btn-primary extract-btn" title="Extract ${lang} text">
                                                <i class="fas fa-file-export" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <p class="text-content">${value || 'N/A'}</p>
                                </div>
                            `;
                        }).join('')}
                </div>
            </div>
        `;

        // Add event listeners for card actions
        const copyButtons = li.querySelectorAll('.copy-btn');
        const speakButtons = li.querySelectorAll('.speak-btn');
        const extractButtons = li.querySelectorAll('.extract-btn');

        copyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.closest('.translation-section, .text-section')
                    .querySelector('.text-content').textContent;
                navigator.clipboard.writeText(text);
                showToast('Text copied to clipboard!');
            });
        });

        speakButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.closest('.translation-section, .text-section')
                    .querySelector('.text-content').textContent;
                const lang = btn.dataset.lang || 'en-US';
                accessibility.readAloud(text, true, lang);
            });
        });

        extractButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.closest('.translation-section')
                    .querySelector('.text-content').textContent;
                const lang = btn.closest('.translation-section')
                    .querySelector('h4').textContent.split(' ')[0].toLowerCase();
                exportText(text, lang);
            });
        });

        elements.dataList.appendChild(li);
    });
}

// Export text functionality
function exportText(text, language) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${language}_text_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast(`${language.charAt(0).toUpperCase() + language.slice(1)} text exported successfully`);
}

// Modal functionality
function setupModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');

    function openModal(modal) {
        modal.classList.add('active');
    }

    function closeModal(modal) {
        modal.classList.remove('active');
    }

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });

    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // Modal triggers
    elements.aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(elements.modals.about);
    });

    elements.helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(elements.modals.help);
    });
}

// Toast notification
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Data fetching
async function fetchData() {
    elements.loading.style.display = 'block';
    elements.dataList.innerHTML = '';
    elements.error.style.display = 'none';

    try {
        const querySnapshot = await getDocs(collection(db, 'captured_images'));
        if (!querySnapshot.empty) {
            currentData = [];
            querySnapshot.forEach(doc => {
                currentData.push(doc.data());
            });
            displayData(currentData);
            showToast('Data refreshed successfully');
        } else {
            elements.error.textContent = 'No data found.';
            elements.error.style.display = 'block';
        }
    } catch (err) {
        console.error('Error fetching data:', err);
        elements.error.textContent = 'Error fetching data. Please try again later.';
        elements.error.style.display = 'block';
    } finally {
        elements.loading.style.display = 'none';
    }
}

// Initialize
async function initialize() {
    try {
        // Initialize speech synthesis
        await initializeSpeech();
        
        // Setup event listeners
        elements.searchInput.addEventListener('input', () => {
            filterData(elements.searchInput.value, elements.languageFilter.value);
        });
        
        elements.languageFilter.addEventListener('change', () => {
            filterData(elements.searchInput.value, elements.languageFilter.value);
        });
        
        elements.toggleTheme.addEventListener('click', toggleDarkMode);
        elements.increaseFontSize.addEventListener('click', () => accessibility.increaseFontSize());
        elements.decreaseFontSize.addEventListener('click', () => accessibility.decreaseFontSize());
        elements.toggleHighContrast.addEventListener('click', () => accessibility.toggleHighContrast());
        elements.readAloud.addEventListener('click', () => accessibility.readPageContent());
        elements.speakPage.addEventListener('click', () => accessibility.readPageContent());

        // Setup keyboard shortcuts and modals
        accessibility.setupKeyboardShortcuts();
        setupModals();

        // Initial data fetch
        await fetchData();
        
        // Show welcome message
        showToast('Welcome to Smart Aid! Press Alt + H for help.');
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Error initializing application. Please refresh the page.');
    }
}

// Start the application when DOM is loaded
window.addEventListener('DOMContentLoaded', initialize);