# StudentGradeTracker

A comprehensive student grade tracking system with Firebase integration and GitHub Pages deployment.

## Live URLs

- **Main Site**: https://ilocanoproud06-ops.github.io/StudentGradeTracker/
- **Admin Portal**: https://ilocanoproud06-ops.github.io/StudentGradeTracker/admin_dashboard.html
- **Student Portal**: https://ilocanoproud06-ops.github.io/StudentGradeTracker/student.html
- **Login**: https://ilocanoproud06-ops.github.io/StudentGradeTracker/login.html

## Features

- Excel-style grade entry with auto-saving
- Course and student management
- Assessment and HPS (Highest Possible Score) configuration
- Grade calculation with letter grades
- Export to CSV
- Offline support with localStorage
- Firebase cloud sync (optional)

## Project Structure

```
StudentGradeTracker/
├── admin_dashboard.html    # React-based admin dashboard
├── admin_login.html        # Admin login page
├── student.html           # Student portal
├── login.html             # Student login
├── welcome.html           # Welcome/landing page
├── data.json              # Sample data
├── firebase-config.js     # Firebase/localStorage sync manager
├── backend/               # LiteLLM API backend
│   ├── main.py           # FastAPI server
│   ├── requirements.txt   # Python dependencies
│   └── .env.example      # Environment variables
└── .github/
    └── workflows/
        └── deploy.yml    # GitHub Actions for deployment
```

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Bootstrap 5
- **Backend**: FastAPI, LiteLLM
- **Storage**: Firebase Firestore, localStorage fallback
- **Deployment**: GitHub Pages

## Development

### Running the Frontend

Simply open `index.html` in a browser, or use a local server:

```bash
npx serve .
```

### Running the Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python main.py
```

The backend will start at http://localhost:8000

## API Endpoints

- `GET /` - Health check
- `GET /tools` - List available tools
- `POST /chat` - Basic chat
- `POST /chat/with-functions` - Chat with function calling

## Configuration

### Enabling Firebase Cloud Sync

By default, the app works offline using localStorage. To enable cloud sync:

```javascript
localStorage.setItem('prefer_cloud_sync', 'true');
```

### GitHub Pages Data URL

For the student portal to fetch data from GitHub Pages, configure:

```javascript
const GITHUB_PAGES_DATA_URL = 'https://yourusername.github.io/RepoName/data.json';
```

## License

MIT

