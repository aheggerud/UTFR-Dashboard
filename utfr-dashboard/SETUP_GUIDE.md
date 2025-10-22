# UTFR Race Engineering Dashboard - Setup Guide

## Prerequisites

Before setting up the UTFR Race Engineering Dashboard, ensure you have the following installed on your system:

### Required Software
- **Node.js** (version 18.0 or higher)
- **npm** (comes with Node.js)
- **Git** (for version control)
- **Google Drive Desktop App** (for file synchronization)

## Installation Steps

### Step 1: Install Node.js

#### Windows
1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS version (recommended)
3. Run the installer and follow the setup wizard
4. Verify installation by opening Command Prompt and running:
   ```cmd
   node --version
   npm --version
   ```

#### macOS
1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS version (recommended)
3. Run the installer package (.pkg file)
4. Verify installation by opening Terminal and running:
   ```bash
   node --version
   npm --version
   ```

#### Alternative: Using Homebrew (macOS)
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

### Step 2: Clone the Repository

1. Open Terminal (macOS) or Command Prompt (Windows)
2. Navigate to your desired directory
3. Clone the repository:
   ```bash
   git clone https://github.com/aheggerud/UTFR-Dashboard.git
   cd UTFR-Dashboard/utfr-dashboard
   ```

### Step 3: Install Dependencies

1. Navigate to the project directory:
   ```bash
   cd utfr-dashboard
   ```

2. Install all required dependencies:
   ```bash
   npm install
   ```

   This will install all packages listed in `package.json`:
   - Next.js 15.5.4
   - React 19.1.0
   - TypeScript 5
   - Tailwind CSS 4
   - Radix UI components
   - Recharts for data visualization
   - Framer Motion for animations
   - Lucide React for icons

### Step 4: Start the Development Server

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The application will be available at:
   - **Local**: http://localhost:3000
   - **Network**: http://[your-ip]:3000

3. Open your web browser and navigate to `http://localhost:3000`

## Google Drive Setup

### Step 1: Install Google Drive Desktop App

#### Windows
1. Visit [drive.google.com](https://drive.google.com)
2. Click "Download Drive for desktop"
3. Run the installer and sign in with your Google account
4. Choose a location for your Google Drive folder (default: `C:\Users\[username]\Google Drive`)

#### macOS
1. Visit [drive.google.com](https://drive.google.com)
2. Click "Download Drive for desktop"
3. Run the installer and sign in with your Google account
4. Choose a location for your Google Drive folder (default: `~/Google Drive`)

### Step 2: Create UTFR Test Data Folder Structure

1. In your Google Drive folder, create a new folder called **"UTFR Test Data"**
2. Inside this folder, create test day folders using the format: **"YYYY-M-D - Venue"**

   **Examples:**
   - `2025-4-11 - Villa`
   - `2025-4-15 - Brechin`
   - `2025-5-2 - Mosport`

3. Inside each test day folder, create a subfolder called **"datadump"**
4. Place your XRK files inside the "datadump" folder

**Final folder structure should look like:**
```
Google Drive/
└── UTFR Test Data/
    ├── 2025-4-11 - Villa/
    │   └── datadump/
    │       ├── run1.xrk
    │       ├── run2.xrk
    │       └── run3.xrk
    ├── 2025-4-15 - Brechin/
    │   └── datadump/
    │       ├── run1.xrk
    │       └── run2.xrk
    └── 2025-5-2 - Mosport/
        └── datadump/
            ├── run1.xrk
            ├── run2.xrk
            └── run3.xrk
```

### Step 3: Sync Google Drive

1. Ensure Google Drive is running and syncing
2. Wait for all files to sync to your local machine
3. Verify the folder structure exists locally in your Google Drive folder

## Environment Configuration

### Step 1: Create Environment File

1. In the project root directory, create a file called `.env.local`
2. Add the following content (currently not needed for local sync):
   ```bash
   # Google OAuth Configuration (for future use)
   # GOOGLE_CLIENT_ID=your-client-id
   # GOOGLE_CLIENT_SECRET=your-client-secret
   # GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
   
   # NextAuth Configuration (for future use)
   # NEXTAUTH_URL=http://localhost:3000
   # NEXTAUTH_SECRET=your-random-secret-key
   ```

### Step 2: Verify Configuration

1. Restart the development server:
   ```bash
   npm run dev
   ```

2. Check that the application loads without errors

## Verification Steps

### Step 1: Test Application Launch
1. Open browser to `http://localhost:3000`
2. Verify the dashboard loads with the racing telemetry theme
3. Check that all tabs are visible: Runs, Setup, Tires, Telemetry, Drive Sync, Lookup, Admin

### Step 2: Test Google Drive Integration
1. Click on the "DRIVE SYNC" tab
2. Click "SELECT FOLDER" and navigate to your local Google Drive folder
3. Select the "UTFR Test Data" folder
4. Verify that test day folders are detected
5. Test importing a test day to ensure XRK files are processed

### Step 3: Test Core Functionality
1. Navigate to the "RUNS" tab
2. Verify that imported runs appear in the table
3. Test the "LOOKUP" tab to ensure global search works
4. Check the "TELEMETRY" tab for F1-style visualization

## Troubleshooting

### Common Issues

#### Node.js Installation Issues
- **Windows**: Run Command Prompt as Administrator
- **macOS**: Use Homebrew for easier installation
- **Permission Issues**: Use `sudo` on macOS/Linux if needed

#### npm Install Failures
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Port Already in Use
```bash
# Kill process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

#### Google Drive Sync Issues
- Ensure Google Drive desktop app is running
- Check that files have synced completely
- Verify folder naming convention matches exactly
- Restart Google Drive app if needed

#### File Upload Issues
- Ensure browser supports webkitdirectory API
- Check that folder contains XRK files
- Verify folder structure matches expected format

### Performance Optimization

#### For Large Datasets
1. Close unnecessary browser tabs
2. Increase Node.js memory limit:
   ```bash
   node --max-old-space-size=4096 node_modules/.bin/next dev
   ```

#### For Slow File Processing
1. Process smaller batches of files
2. Ensure sufficient disk space
3. Close other resource-intensive applications

## Production Deployment

### Building for Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production
```bash
# .env.production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
```

## Team Setup

### For Multiple Users
1. Each team member should follow the setup guide
2. Share the Google Drive folder with team members
3. Ensure consistent folder naming conventions
4. Set up regular sync schedules

### Data Backup
1. Google Drive provides automatic cloud backup
2. Consider additional backup solutions for critical data
3. Export data regularly using the dashboard's export features

## Support

### Getting Help
1. Check the troubleshooting section above
2. Review the user manual for feature-specific help
3. Contact the development team for technical issues

### Reporting Issues
When reporting issues, include:
- Operating system and version
- Node.js and npm versions
- Browser and version
- Error messages (if any)
- Steps to reproduce the issue

## Next Steps

After successful setup:
1. Read the [User Manual](USER_MANUAL.md) for detailed feature usage
2. Review the [Google Drive Integration Guide](GOOGLE_DRIVE_GUIDE.md) for advanced setup
3. Check the [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues
4. Explore the [Code Documentation](CODE_DOCUMENTATION.md) for development details
