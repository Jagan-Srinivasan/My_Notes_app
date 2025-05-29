console.log("Script loaded and Firebase initialized");

// Firebase Configuration - Using compat version for better compatibility
const firebaseConfig = {
    apiKey: "AIzaSyAQdpcXIjGoX9Efe-P3jFsUtddJSCKk_QY",
    authDomain: "my-notes-edaa4.firebaseapp.com",
    projectId: "my-notes-edaa4",
    storageBucket: "my-notes-edaa4.firebasestorage.app",
    messagingSenderId: "447706126595",
    appId: "1:447706126595:web:9404d81fbab4f7e0a0b136"
};
async function loadNotes() {
  if (!currentUser) {
    console.warn("No user is logged in, cannot load notes.");
    return;
  }

  try {
    console.log("Loading notes for UID:", currentUser.uid);

    const snapshot = await db.collection('notes')
      .where('userId', '==', currentUser.uid)
      .where('createdAt', '!=', null)
      .orderBy('createdAt', 'desc')
      .get();

    console.log("Snapshot size:", snapshot.size);

    allNotes = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log("Loaded note:", data);
      return {
        id: doc.id,
        ...data
      };
    });

    updateTagFilter();
    applyFilters();

  } catch (error) {
    console.error('Error loading notes:', error);
    NotificationManager.show('Failed to load notes', 'error');
  }
}


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const authContainer = document.getElementById('authContainer');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const userEmail = document.getElementById('userEmail');
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const noteDetails = document.getElementById('noteDetails');
const noteTitle = document.getElementById('noteTitle');
const noteTags = document.getElementById('noteTags');
const notesList = document.getElementById('notesList');
const emptyState = document.getElementById('emptyState');
const notesCount = document.getElementById('notesCount');
const searchInput = document.getElementById('searchInput');
const tagFilter = document.getElementById('tagFilter');
const sortOrder = document.getElementById('sortOrder');
const deleteModal = document.getElementById('deleteModal');
const previewModal = document.getElementById('previewModal');
const notificationsContainer = document.getElementById('notifications');

// Global Variables
let currentUser = null;
let selectedFiles = [];
let allNotes = [];
let filteredNotes = [];
let noteToDelete = null;

// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupElements();
            });
        } else {
            this.setupElements();
        }
    }

    setupElements() {
        this.themeToggle = document.getElementById('themeToggle');
        this.themeSelector = document.getElementById('themeSelector');

        if (this.themeToggle && this.themeSelector) {
            this.applyTheme(this.currentTheme);
            this.setupEventListeners();
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);

        // Update active theme button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === theme) {
                btn.classList.add('active');
            }
        });
    }

    setupEventListeners() {
        // Toggle theme options visibility
        this.themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.themeSelector.classList.toggle('open');
        });

        // Close theme selector when clicking outside
        document.addEventListener('click', (e) => {
            if (this.themeSelector && !this.themeSelector.contains(e.target)) {
                this.themeSelector.classList.remove('open');
            }
        });

        // Theme button clicks
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyTheme(btn.dataset.theme);
                this.themeSelector.classList.remove('open');
            });
        });
    }
}

// Notification System
class NotificationManager {
    static show(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <i class="${iconMap[type]} notification-icon"></i>
                <span class="notification-text">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        if (notificationsContainer) {
            notificationsContainer.appendChild(notification);

            // Auto remove after 5 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }
    }
}

// Utility Functions
function formatTimestamp(timestamp) {
    const now = new Date();
    let date;
    
    if (timestamp && timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        return 'Unknown';
    }
    
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
}

function getFileIcon(fileName) {
    if (!fileName || typeof fileName !== 'string') {
        return 'fas fa-file';
    }
    
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const iconMap = {
        pdf: 'fas fa-file-pdf',
        doc: 'fas fa-file-word',
        docx: 'fas fa-file-word',
        jpg: 'fas fa-file-image',
        jpeg: 'fas fa-file-image',
        png: 'fas fa-file-image',
        gif: 'fas fa-file-image',
        txt: 'fas fa-file-alt'
    };

    return iconMap[extension] || 'fas fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Authentication Functions
function showLoading(show = true) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showAuthForm(formType) {
    if (loginForm && signupForm) {
        loginForm.classList.remove('active');
        signupForm.classList.remove('active');

        if (formType === 'login') {
            loginForm.classList.add('active');
        } else {
            signupForm.classList.add('active');
        }
    }
}

async function signUp(email, password, confirmPassword) {
    if (password !== confirmPassword) {
        NotificationManager.show('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        NotificationManager.show('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        showLoading(true);
        await auth.createUserWithEmailAndPassword(email, password);
        NotificationManager.show('Account created successfully!', 'success');
    } catch (error) {
        console.error('Sign up error:', error);
        let errorMessage = 'Failed to create account';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email is already registered';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak';
                break;
            case 'auth/invalid-api-key':
                errorMessage = 'Invalid Firebase API key configuration';
                break;
            default:
                errorMessage = error.message;
        }
        
        NotificationManager.show(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

async function signIn(email, password) {
    try {
        showLoading(true);
        await auth.signInWithEmailAndPassword(email, password);
        NotificationManager.show('Welcome back!', 'success');
    } catch (error) {
        console.error('Sign in error:', error);
        let errorMessage = 'Failed to sign in';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later';
                break;
            case 'auth/invalid-api-key':
                errorMessage = 'Invalid Firebase API key configuration';
                break;
            default:
                errorMessage = error.message;
        }
        
        NotificationManager.show(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

async function signOutUser() {
    try {
        await auth.signOut();
        NotificationManager.show('Signed out successfully', 'success');
    } catch (error) {
        console.error('Sign out error:', error);
        NotificationManager.show('Failed to sign out', 'error');
    }
}

// File Upload Functions
function validateFile(file) {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.txt'];
    const maxSize = 1024 * 1024; // 1MB for free tier (Base64 encoding)
    
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`File type not supported: ${file.name}. Allowed types: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, TXT`);
    }
    
    if (file.size > maxSize) {
        throw new Error(`File too large: ${file.name}. Maximum size is 1MB (Firebase free tier)`);
    }
    
    if (file.size === 0) {
        throw new Error(`File is empty: ${file.name}`);
    }
    
    return true;
}

function handleFileSelect(files) {
    try {
        const validFiles = [];
        
        for (const file of Array.from(files)) {
            validateFile(file);
            validFiles.push(file);
        }
        
        selectedFiles = validFiles;

        if (selectedFiles.length === 0) {
            if (noteDetails) {
                noteDetails.classList.add('hidden');
            }
            return;
        }

        // Show note details form
        if (noteDetails) {
            noteDetails.classList.remove('hidden');
        }

        // Set default title
        if (selectedFiles.length === 1 && noteTitle) {
            noteTitle.value = selectedFiles[0].name.split('.')[0];
        } else if (noteTitle) {
            noteTitle.value = `${selectedFiles.length} files`;
        }
        
        NotificationManager.show(`${selectedFiles.length} file(s) selected successfully`, 'success');
        
    } catch (error) {
        NotificationManager.show(error.message, 'error');
        selectedFiles = [];
        if (noteDetails) {
            noteDetails.classList.add('hidden');
        }
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

async function uploadFiles() {
  if (selectedFiles.length === 0) {
    NotificationManager.show('Please select files to upload', 'error');
    return;
  }

  if (!currentUser) {
    NotificationManager.show('Please sign in to upload files', 'error');
    return;
  }

  const title = noteTitle ? noteTitle.value.trim() : 'Untitled';
  if (!title) {
    NotificationManager.show('Please enter a note title', 'error');
    return;
  }

  const tags = noteTags
    ? noteTags.value.split(',').map(tag => tag.trim()).filter(tag => tag)
    : [];

  try {
    if (uploadProgress) uploadProgress.classList.remove('hidden');
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = '0%';

    const uploadedFiles = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      let fileRecord = {
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
      };

      if (file.size <= 1024 * 1024) {
        // 📦 Save as base64 for small files
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        fileRecord.data = base64Data;
      } else {
        // ☁️ Upload to Firebase Storage for larger files
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`user_uploads/${currentUser.uid}/${Date.now()}_${file.name}`);
        await fileRef.put(file);
        const downloadURL = await fileRef.getDownloadURL();
        fileRecord.downloadURL = downloadURL;
      }

      uploadedFiles.push(fileRecord);

      // Update progress
      const progress = ((i + 1) / selectedFiles.length) * 100;
      if (progressFill) progressFill.style.width = progress + '%';
      if (progressText) progressText.textContent = Math.round(progress) + '%';
    }

    const noteData = {
      title,
      tags,
      files: uploadedFiles,
      userId: currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    console.log("Final noteData before save:", noteData);
    await db.collection('notes').add(noteData);

    NotificationManager.show(`Successfully uploaded ${uploadedFiles.length} file(s)!`, 'success');

    resetUploadForm();
    await loadNotes();

  } catch (error) {
    console.error('Upload error:', error);
    NotificationManager.show(error.message, 'error');

    if (uploadProgress) uploadProgress.classList.add('hidden');
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = '0%';
  }
}

function updateTagFilter() {
    if (!tagFilter) return;
    
    const allTags = new Set();
    allNotes.forEach(note => {
        if (note.tags) {
            note.tags.forEach(tag => allTags.add(tag));
        }
    });

    tagFilter.innerHTML = '<option value="">All Tags</option>';
    Array.from(allTags).sort().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
}

function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedTag = tagFilter ? tagFilter.value : '';
    const sortBy = sortOrder ? sortOrder.value : 'newest';

    filteredNotes = allNotes.filter(note => {
        const matchesSearch = !searchTerm || 
            note.title.toLowerCase().includes(searchTerm) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm)));

        const matchesTag = !selectedTag || 
            (note.tags && note.tags.includes(selectedTag));

        return matchesSearch && matchesTag;
    });

    // Sort notes
    filteredNotes.sort((a, b) => {
        switch (sortBy) {
            case 'oldest':
                return (a.createdAt?.toDate() || new Date(0)) - (b.createdAt?.toDate() || new Date(0));
            case 'name':
                return a.title.localeCompare(b.title);
            case 'newest':
            default:
                return (b.createdAt?.toDate() || new Date(0)) - (a.createdAt?.toDate() || new Date(0));
        }
    });

    renderNotes();
}

function renderNotes() {
    if (notesCount) {
        notesCount.textContent = `${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''}`;
    }

    if (filteredNotes.length === 0) {
        if (notesList) notesList.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (notesList) notesList.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    if (notesList) {
        notesList.innerHTML = filteredNotes.map(note => `
            <div class="note-item" data-note-id="${note.id}">
                <div class="note-header">
                    <div class="note-info">
                        <h3>${note.title}</h3>
                        <div class="note-meta">
                            <span><i class="fas fa-calendar"></i> ${formatTimestamp(note.createdAt)}</span>
                            <span><i class="fas fa-paperclip"></i> ${note.files?.length || 0} file${(note.files?.length || 0) !== 1 ? 's' : ''}</span>
                            ${note.files && note.files.length > 0 ? `<span><i class="fas fa-hdd"></i> ${formatFileSize(note.files.reduce((total, file) => total + (file.size || 0), 0))}</span>` : ''}
                        </div>
                    </div>
                    <div class="note-actions-list">
                        <button class="action-btn" onclick="previewNote('${note.id}')" title="Preview">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn delete" onclick="confirmDeleteNote('${note.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                ${note.files && note.files.length > 0 ? `
                    <div class="note-files">
                        ${note.files.map(file => `
                            <div class="file-item">
                                <i class="${getFileIcon(file.name)}"></i>
                                <span class="file-name">${file.name}</span>
                                <button onclick="downloadBase64File('${file.data}', '${file.name}')" class="action-btn" title="Download">
                                    <i class="fas fa-download"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${note.tags && note.tags.length > 0 ? `
                    <div class="note-tags">
                        ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
}

// Note Actions
// Base64 file download function
function downloadBase64File(base64Data, fileName) {
    try {
        const link = document.createElement('a');
        link.href = base64Data;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        NotificationManager.show(`Downloaded ${fileName}`, 'success');
    } catch (error) {
        console.error('Download error:', error);
        NotificationManager.show('Failed to download file', 'error');
    }
}

async function deleteNote(noteId) {
    try {
        const note = allNotes.find(n => n.id === noteId);
        if (!note) return;

        // Delete note from Firestore (files are embedded, no separate storage cleanup needed)
        await db.collection('notes').doc(noteId).delete();

        NotificationManager.show('Note deleted successfully', 'success');
        loadNotes();

    } catch (error) {
        console.error('Error deleting note:', error);
        NotificationManager.show('Failed to delete note', 'error');
    }
}

function confirmDeleteNote(noteId) {
    noteToDelete = noteId;
    if (deleteModal) {
        deleteModal.classList.remove('hidden');
    }
}

function closeDeleteModal() {
    if (deleteModal) {
        deleteModal.classList.add('hidden');
    }
    noteToDelete = null;
}

function previewNote(noteId) {
  const note = allNotes.find(n => n.id === noteId);
  if (!note || !note.files || note.files.length === 0) {
    NotificationManager.show("No file to preview", "error");
    return;
  }

  const previewTitle = document.getElementById('previewTitle');
  const previewContent = document.getElementById('previewContent');
  const previewModal = document.getElementById('previewModal');

  if (!previewTitle || !previewContent || !previewModal) {
    console.error("Missing preview modal elements in HTML.");
    return;
  }

  previewTitle.textContent = note.title;

  const file = note.files[0];
  const fileType = file.type || '';

  if (fileType.startsWith('image/')) {
    previewContent.innerHTML = `
      <img src="${file.data}" alt="${file.name}" style="max-width: 100%; height: auto;">
    `;
  } else if (fileType === 'application/pdf') {
    previewContent.innerHTML = `
      <iframe src="${file.data}" style="width: 100%; height: 600px; border: none;"></iframe>
    `;
  } else {
    previewContent.innerHTML = `
      <div class="preview-fallback">
        <i class="fas fa-file-alt"></i>
        <h3>Preview not available</h3>
        <p>File: ${file.name}</p>
        <button onclick="downloadBase64File('${file.data}', '${file.name}')" class="save-btn">
          <i class="fas fa-download"></i> Download File
        </button>
      </div>
    `;
  }

  previewModal.classList.remove('hidden');
}
function closePreviewModal() {
  const modal = document.getElementById('previewModal');
  if (modal) modal.classList.add('hidden');
}


// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading initially
    showLoading(false);
    
    // Initialize theme manager
    const themeManager = new ThemeManager();

    // Auth state observer
    auth.onAuthStateChanged((user) => {
        console.log("Auth state changed:", user);  // <— ADD THIS LINE
        showLoading(false);

        if (user) {
            currentUser = user;
            userEmail.textContent = user.email;
            authContainer.style.display = 'none';
            mainApp.classList.remove('hidden');

            loadNotes(); // This should run!
        } else {
            currentUser = null;
            authContainer.style.display = 'flex';
            mainApp.classList.add('hidden');
        }
    });


    // Auth form submissions
    const loginFormElement = document.getElementById('loginFormElement');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            signIn(email, password);
        });
    }

    const signupFormElement = document.getElementById('signupFormElement');
    if (signupFormElement) {
        signupFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            signUp(email, password, confirmPassword);
        });
    }

    // Auth form toggles
    const showSignup = document.getElementById('showSignup');
    if (showSignup) {
        showSignup.addEventListener('click', function(e) {
            e.preventDefault();
            showAuthForm('signup');
        });
    }

    const showLogin = document.getElementById('showLogin');
    if (showLogin) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            showAuthForm('login');
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOutUser);
    }

    // File input
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            handleFileSelect(e.target.files);
        });
    }

    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleFileSelect(e.dataTransfer.files);
        });
    }

    // Note actions
    const saveNote = document.getElementById('saveNote');
    if (saveNote) {
        saveNote.addEventListener('click', uploadFiles);
    }

    const cancelNote = document.getElementById('cancelNote');
    if (cancelNote) {
        cancelNote.addEventListener('click', function() {
            resetUploadForm();
        });
    }

    // Search and filter
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    if (tagFilter) {
        tagFilter.addEventListener('change', applyFilters);
    }
    if (sortOrder) {
        sortOrder.addEventListener('change', applyFilters);
    }

    // Delete confirmation
    const confirmDelete = document.getElementById('confirmDelete');
    if (confirmDelete) {
        confirmDelete.addEventListener('click', function() {
            if (noteToDelete) {
                deleteNote(noteToDelete);
                closeDeleteModal();
            }
        });
    }

    // Modal clicks
    if (deleteModal) {
        deleteModal.addEventListener('click', function(e) {
            if (e.target === deleteModal) {
                closeDeleteModal();
            }
        });
    }

    if (previewModal) {
        previewModal.addEventListener('click', function(e) {
            if (e.target === previewModal) {
                closePreviewModal();
            }
        });
    }
});

// Global functions for inline event handlers
window.confirmDeleteNote = confirmDeleteNote;
window.closeDeleteModal = closeDeleteModal;
window.previewNote = previewNote;
window.closePreviewModal = closePreviewModal;
window.downloadBase64File = downloadBase64File;
function resetUploadForm() {
  // Clear input fields
  if (noteTitle) noteTitle.value = '';
  if (noteTags) noteTags.value = '';
  if (fileInput) fileInput.value = '';
  selectedFiles = [];

  // Reset previews
  const fileList = document.getElementById('fileList');
  if (fileList) fileList.innerHTML = '';

  // Hide progress
  if (uploadProgress) uploadProgress.classList.add('hidden');
  if (progressFill) progressFill.style.width = '0%';
  if (progressText) progressText.textContent = '0%';
}
async function deleteNote(noteId) {
  if (!confirm("Are you sure you want to delete this note?")) return;

  try {
    await db.collection('notes').doc(noteId).delete();
    NotificationManager.show("Note deleted", "success");
    await loadNotes(); // refresh the list
  } catch (error) {
    console.error("Delete error:", error);
    NotificationManager.show("Failed to delete note", "error");
  }
}
