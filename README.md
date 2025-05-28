
# My Notes - Personal Document Manager

A beautiful, modern web application for managing your personal documents with Firebase integration. Built with vanilla HTML, CSS, and JavaScript.

## ✨ Features

### 🔐 Authentication
- Email/password sign up and login
- Secure user authentication with Firebase Auth
- User session management
- Clean auth UI with form validation

### 📁 File Management
- Upload multiple file types (PDF, DOCX, images, text files)
- Drag-and-drop file upload support
- Real-time upload progress tracking
- File size and type validation
- Secure cloud storage with Firebase Storage

### 🗃️ Note Organization
- Custom note titles and descriptions
- Tag-based categorization system
- Advanced search functionality
- Multiple sorting options (newest, oldest, alphabetical)
- File metadata storage in Firestore

### 🎨 User Interface
- **Three Beautiful Themes**: Light, Dark, and Custom (Purple)
- Responsive design (mobile-first approach)
- Modern glassmorphism effects
- Smooth animations and transitions
- Clean typography with Inter font
- Intuitive icons from Font Awesome

### 🛠️ Advanced Features
- **File Preview**: Inline preview for images and PDFs
- **Smart Timestamps**: "Just now", "3 minutes ago" formatting
- **Progress Indicators**: Real-time upload progress
- **Notification System**: Success/error toast notifications
- **Confirmation Modals**: Safe deletion with confirmation
- **Empty States**: Helpful guidance when no content exists
- **Keyboard Navigation**: Accessible interface design

## 🚀 Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable the following services:
   - **Authentication** (Email/Password provider)
   - **Firestore Database**
   - **Storage**

### 2. Configure Firebase

1. In Firebase Console, go to Project Settings > General
2. Scroll down to "Your apps" and click "Web" (</>) icon
3. Register your app and copy the Firebase configuration
4. Replace the configuration in `script.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### 3. Firestore Security Rules

Set up your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 4. Storage Security Rules

Set up your Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Deploy on Replit

1. Upload all files to your Repl
2. The app will be served as a static website
3. Click the Run button to start the static server
4. Your app will be available at the provided URL

## 📱 Usage Guide

### Getting Started
1. **Sign Up**: Create a new account with email and password
2. **Upload Files**: Drag and drop or click to select files
3. **Add Details**: Enter note title and tags
4. **Save**: Click "Save Note" to upload

### Managing Notes
- **Search**: Use the search bar to find notes by title or tags
- **Filter**: Filter by specific tags using the dropdown
- **Sort**: Choose from newest, oldest, or alphabetical sorting
- **Preview**: Click the eye icon to preview files
- **Download**: Click the download icon to save files locally
- **Delete**: Click the trash icon and confirm to delete notes

### Themes
- **Light Theme**: Clean, bright interface
- **Dark Theme**: Easy on the eyes for low-light environments  
- **Custom Theme**: Purple gradient theme for a unique look

## 🏗️ Project Structure

```
my-notes-app/
├── index.html          # Main HTML structure
├── style.css           # Complete styling with themes
├── script.js           # Application logic and Firebase integration
└── README.md           # This documentation
```

## 🎨 Customization

### Adding New Themes
1. Add CSS custom properties in `:root[data-theme="your-theme"]`
2. Add theme button in HTML
3. Update theme manager in JavaScript

### Supported File Types
- **Documents**: PDF, DOC, DOCX, TXT
- **Images**: JPG, JPEG, PNG, GIF
- Easy to extend by modifying the `accept` attribute and file type checks

### Styling
- Modern CSS with custom properties
- Flexbox and Grid layouts
- Smooth transitions and animations
- Mobile-responsive design patterns

## 🔧 Technical Details

### Dependencies
- **Firebase SDK v10.7.1**: Authentication, Firestore, Storage
- **Font Awesome 6.0.0**: Icons
- **Google Fonts (Inter)**: Typography
- **Vanilla JavaScript**: No frameworks required

### Browser Support
- Modern browsers with ES6+ support
- Mobile browsers (iOS Safari, Chrome Mobile)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

### Performance
- Lazy loading of images
- Efficient Firebase queries
- Optimized CSS with minimal repaints
- Progressive enhancement approach

## 🚨 Security Considerations

- All files are scoped to the authenticated user
- Firestore rules prevent unauthorized access
- Storage rules ensure users can only access their own files
- Client-side validation with server-side enforcement
- No sensitive data stored in localStorage

## 🐛 Troubleshooting

### Common Issues
1. **Files not uploading**: Check Firebase configuration and storage rules
2. **Authentication errors**: Verify Firebase Auth is enabled and configured
3. **Theme not persisting**: Ensure localStorage is available
4. **Mobile display issues**: Check viewport meta tag and CSS media queries

### Debug Mode
Enable console logging by opening browser developer tools (F12) to see detailed error messages.

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

---

**Built with ❤️ using vanilla web technologies and Firebase**
