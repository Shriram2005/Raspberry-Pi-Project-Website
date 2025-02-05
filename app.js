// Initialize Firebase

const firebaseConfig = {
    apiKey: "AIzaSyBzPZ4xy2c7Tn5Ji-uno6ZID3VboCSW8J4",
    authDomain: "raspberry-pi-bce9b.firebaseapp.com",
    projectId: "raspberry-pi-bce9b",
    storageBucket: "raspberry-pi-bce9b.firebasestorage.app",
    messagingSenderId: "612744359143",
    appId: "1:612744359143:web:2bd880b165d79984430642",
    measurementId: "G-BMNSVFXY5F"
};

const db = firebaseApp.firestore();
const dataList = document.getElementById('dataList');
const loading = document.getElementById('loading');
const error = document.getElementById('error');

function fetchData() {
    loading.style.display = 'block';
    dataList.innerHTML = '';
    error.style.display = 'none';

    db.collection('captured_images').orderBy('timestamp', 'desc').get()
        .then(snapshot => {
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    const data = doc.data();
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
            } else {
                error.textContent = 'No data found.';
                error.style.display = 'block';
                loading.style.display = 'none';
            }
        })
        .catch(err => {
            console.error('Error fetching data:', err);
            error.textContent = 'Error fetching data. Please try again later.';
            error.style.display = 'block';
            loading.style.display = 'none';
        });
}

document.getElementById('fetchData').addEventListener('click', fetchData);

// Auto-fetch data on page load
window.onload = fetchData;