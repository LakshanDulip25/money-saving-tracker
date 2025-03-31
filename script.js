const imgbbApiKey = 'c59fd4d2f34bb26b393faaf7affe501f'; // Replace with your ImgBB API key

let totalSaved = 0;

// Load data from localStorage on page load
let data = JSON.parse(localStorage.getItem('savedData')) || [];

document.getElementById('receipt').addEventListener('change', validateForm);
document.getElementById('amount').addEventListener('input', validateForm);
document.getElementById('uploaderName').addEventListener('input', validateForm);

function validateForm() {
  const receipt = document.getElementById('receipt').files?.[0];
  const amount = document.getElementById('amount').value.trim();
  const uploaderName = document.getElementById('uploaderName').value.trim();
  const submitBtn = document.getElementById('submitBtn');

  if (receipt && amount && uploaderName && isValidImage(receipt)) {
    submitBtn.disabled = false;
    submitBtn.classList.add('glow');
  } else {
    submitBtn.disabled = true;
    submitBtn.classList.remove('glow');
  }
}

function isValidImage(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    alert('Please upload a valid image file (JPEG, PNG, GIF).');
    return false;
  }
  return true;
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload image');
    const data = await response.json();
    return data.data?.url || '';
  } catch (error) {
    console.error('Error uploading image:', error.message);
    throw error;
  }
}

function saveDataLocally(amount, imageUrl, uploaderName) {
  // Add new entry to the local data array
  const timestamp = new Date().toISOString().split('T')[0]; // Save date as YYYY-MM-DD
  const newData = { amount, imageUrl, uploaderName, timestamp };

  // Push the new entry into the global data array
  data.push(newData);

  // Save updated data to localStorage
  localStorage.setItem('savedData', JSON.stringify(data));

  // Optionally, update the UI immediately
  updateTotal(amount);
  addHistoryItem(amount, imageUrl, uploaderName, timestamp);
}

function updateTotal(amount) {
  totalSaved += parseFloat(amount);
  document.getElementById('totalAmount').textContent = `LKR ${totalSaved.toFixed(2)}`;
}

function addHistoryItem(amount, imageUrl, uploaderName, timestamp) {
  const historyDiv = document.getElementById('history');
  const itemDiv = document.createElement('div');
  itemDiv.className = 'history-item';

  const detailsSpan = document.createElement('span');
  detailsSpan.textContent = `${timestamp} - ${uploaderName} - LKR ${amount}`;

  const link = document.createElement('a');
  link.href = imageUrl; // Set the ImgBB URL as the href
  link.target = '_blank'; // Open in a new tab
  link.textContent = 'View Receipt'; // Text for the link

  itemDiv.appendChild(detailsSpan);
  itemDiv.appendChild(link);
  historyDiv.appendChild(itemDiv);
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const receipt = document.getElementById('receipt').files?.[0];
  const amount = document.getElementById('amount').value.trim();
  const uploaderName = document.getElementById('uploaderName').value.trim();

  try {
    if (!isValidImage(receipt)) return;

    const imageUrl = await uploadImage(receipt); // Get ImgBB URL
    saveDataLocally(amount, imageUrl, uploaderName); // Save locally

    // Clear form fields
    document.getElementById('receipt').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('uploaderName').value = '';
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').classList.remove('glow');
  } catch (error) {
    console.error(error);
    alert('Error: ' + error.message);
  }
});

// Load existing data on page load
window.addEventListener('load', () => {
  try {
    // Initialize total saved amount and history from the local data array
    data.forEach((entry) => {
      updateTotal(entry.amount);
      addHistoryItem(entry.amount, entry.imageUrl, entry.uploaderName, entry.timestamp);
    });
  } catch (error) {
    console.error('Error loading data:', error.message);
  }
});

// Dark Mode Toggle
const themeToggleBtn = document.getElementById('themeToggleBtn');
let isDarkMode = false;

themeToggleBtn.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  themeToggleBtn.textContent = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
});
