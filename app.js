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

// Async function to fetch data from Firestore
async function fetchData() {
    loading.style.display = 'block';
    dataList.innerHTML = '';
    error.style.display = 'none';

    console.log("Fetching data from Firestore...");

    try {
        const querySnapshot = await getDocs(collection(db, 'captured_images'));
        if (!querySnapshot.empty) {
            querySnapshot.forEach(doc => {
                const data = doc.data();
                console.log("Document data:", data);
                const item = document.createElement('li');
                item.innerHTML = `
                    <img src="data:image/jpeg;base64,${data.image}" alt="Captured Image">
                    <p><strong>Original Text:</strong> ${data.original_text}</p>
                    <p><strong>English Translation:</strong> ${data.english_translation || 'N/A'}</p>
                    <p><strong>Hindi Translation:</strong> ${data.hindi_translation || 'N/A'}</p>
                    <p><strong>Marathi Translation:</strong> ${data.marathi_translation || 'N/A'}</p>
                `;
                dataList.appendChild(item);
            });
            loading.style.display = 'none';
            console.log("Data fetched and displayed successfully.");
        } else {
            error.textContent = 'No data found.';
            error.style.display = 'block';
            loading.style.display = 'none';
            console.log("No data found in Firestore.");
        }
    } catch (err) {
        console.error('Error fetching data:', err);
        error.textContent = 'Error fetching data. Please try again later.';
        error.style.display = 'block';
        loading.style.display = 'none';
    }
}

// Async function to initialize the application
async function initialize() {
    const fetchDataButton = document.getElementById('fetchData');
    fetchDataButton.addEventListener('click', fetchData);

    // Auto-fetch data on page load
    await fetchData();
}

// Wait for the DOM to be fully loaded before initializing
window.addEventListener('DOMContentLoaded', initialize);