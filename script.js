// API Keys (Replace with yours)
const IMGBB_API_KEY = 'c59fd4d2f34bb26b393faaf7affe501f'; // Get from https://api.imgbb.com/
const GITHUB_TOKEN = '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'; // GitHub Personal Access Token
const REPO_OWNER = 'LakshanDulip25';
const REPO_NAME = 'write';
const DATA_FILE_PATH = 'data/data.json'; // Where to store data in your repo

// DOM Elements
const receiptInput = document.getElementById('receipt');
const amountInput = document.getElementById('amount');
const uploaderNameInput = document.getElementById('uploaderName');
const submitBtn = document.getElementById('submitBtn');
const totalAmountSpan = document.getElementById('totalAmount');
const historyDiv = document.getElementById('history');

// Global Variables
let totalSaved = 0;
let allData = [];

// Initialize App
initApp();

// ========================
// MAIN FUNCTIONS
// ========================

async function initApp() {
  // Load existing data
  try {
    allData = await loadData();
    allData.forEach(entry => {
      updateTotal(entry.amount);
      addHistoryItem(entry);
    });
  } catch (error) {
    console.error("Failed to load data:", error);
  }

  // Setup event listeners
  setupEventListeners();
}

async function submitData() {
  const receipt = receiptInput.files[0];
  const amount = amountInput.value;
  const uploaderName = uploaderNameInput.value;

  try {
    // 1. Upload image to ImgBB
    const imageUrl = await uploadToImgBB(receipt);
    
    // 2. Create new entry
    const newEntry = {
      amount: parseFloat(amount),
      imageUrl,
      uploaderName,
      timestamp: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    };

    // 3. Save to GitHub
    allData.push(newEntry);
    await saveData(allData);

    // 4. Update UI
    updateTotal(newEntry.amount);
    addHistoryItem(newEntry);
    resetForm();

  } catch (error) {
    alert(`Error: ${error.message}`);
    console.error("Submission failed:", error);
  }
}

// ========================
// STORAGE FUNCTIONS
// ========================

async function uploadToImgBB(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  if (!result.success) throw new Error("ImgBB upload failed");
  return result.data.url;
}

async function loadData() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE_PATH}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) return [];
    const fileData = await response.json();
    return JSON.parse(atob(fileData.content));
  } catch (error) {
    return [];
  }
}

async function saveData(data) {
  // Get existing file SHA (required for updates)
  let sha;
  try {
    const existing = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE_PATH}`,
      { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }
    );
    const existingData = await existing.json();
    console.log(existingData);  // Log the response to debug
    if (existing.ok) sha = existingData.sha;
  } catch (error) {
    console.error('Error fetching file SHA:', error);
  }

  // Create/Update file
  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: 'Updated savings data',
        content: btoa(JSON.stringify(data, null, 2)),
        sha: sha
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('GitHub save failed:', error);
    throw new Error(`GitHub save failed: ${error.message}`);
  }
}

// ========================
// UI FUNCTIONS
// ========================

function setupEventListeners() {
  [receiptInput, amountInput, uploaderNameInput].forEach(input => {
    input.addEventListener('input', validateForm);
  });
  submitBtn.addEventListener('click', submitData);
}

function validateForm() {
  const isValid = (
    receiptInput.files?.length > 0 &&
    amountInput.value.trim() !== '' &&
    uploaderNameInput.value.trim() !== '' &&
    isValidImage(receiptInput.files[0])
  );
  
  submitBtn.disabled = !isValid;
  submitBtn.classList.toggle('glow', isValid);
}

function isValidImage(file) {
  return ['image/jpeg', 'image/png', 'image/gif'].includes(file.type);
}

function updateTotal(amount) {
  totalSaved += amount;
  totalAmountSpan.textContent = `LKR ${totalSaved.toFixed(2)}`;
}

function addHistoryItem(entry) {
  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `
    <span>${entry.timestamp} - ${entry.uploaderName} - LKR ${entry.amount}</span>
    <a href="${entry.imageUrl}" target="_blank">View Receipt</a>
  `;
  historyDiv.appendChild(item);
}

function resetForm() {
  receiptInput.value = '';
  amountInput.value = '';
  uploaderNameInput.value = '';
  submitBtn.disabled = true;
  submitBtn.classList.remove('glow');
}
