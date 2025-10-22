# Google Drive Integration Guide

## Overview

The UTFR Race Engineering Dashboard uses a **local file system approach** for Google Drive integration. This method provides several advantages:

- **No API limitations** or authentication complexity
- **Offline capability** - works without internet connection
- **Fast performance** - direct file system access
- **Simple setup** - just sync Google Drive locally
- **Team collaboration** - shared Google Drive folder

## How It Works

1. **Google Drive Desktop App** syncs files to your local machine
2. **Dashboard** reads files directly from your local Google Drive folder
3. **XRK files** are automatically detected and imported
4. **Test day data** is parsed from folder structure
5. **Real-time updates** when Google Drive syncs new files

## Setup Process

### Step 1: Install Google Drive Desktop App

#### Windows Installation
1. **Download**: Go to [drive.google.com](https://drive.google.com)
2. **Click**: "Download Drive for desktop"
3. **Run**: The installer as Administrator
4. **Sign in**: With your Google account
5. **Choose location**: Default is `C:\Users\[username]\Google Drive`

#### macOS Installation
1. **Download**: Go to [drive.google.com](https://drive.google.com)
2. **Click**: "Download Drive for desktop"
3. **Run**: The installer package (.pkg file)
4. **Sign in**: With your Google account
5. **Choose location**: Default is `~/Google Drive`

### Step 2: Create UTFR Folder Structure

#### Required Folder Naming Convention
The dashboard expects a specific folder structure for automatic detection:

```
Google Drive/
└── UTFR Test Data/
    ├── YYYY-M-D - Venue/
    │   └── datadump/
    │       ├── run1.xrk
    │       ├── run2.xrk
    │       └── run3.xrk
    └── YYYY-M-D - Venue/
        └── datadump/
            └── run1.xrk
```

#### Folder Naming Rules
- **Test Day Folders**: `YYYY-M-D - Venue` format
  - `YYYY`: 4-digit year
  - `M`: 1 or 2-digit month (1-12)
  - `D`: 1 or 2-digit day (1-31)
  - `Venue`: Track or location name
- **XRK Folder**: Always named `datadump`
- **XRK Files**: Any `.xrk` extension files

#### Examples of Valid Folder Names
```
2025-4-11 - Villa
2025-4-15 - Brechin Motorsport Park
2025-5-2 - Mosport
2025-12-25 - Test Track
```

### Step 3: Organize Your Data

#### Creating Test Day Folders
1. **Navigate** to your Google Drive folder
2. **Create** a folder called "UTFR Test Data"
3. **Inside UTFR Test Data**, create folders for each test day:
   ```
   2025-4-11 - Villa
   2025-4-15 - Brechin
   2025-5-2 - Mosport
   ```

#### Adding XRK Files
1. **Inside each test day folder**, create a subfolder called `datadump`
2. **Copy your XRK files** into the `datadump` folder
3. **Ensure files have `.xrk` extension**

#### Final Structure Example
```
Google Drive/
└── UTFR Test Data/
    ├── 2025-4-11 - Villa/
    │   └── datadump/
    │       ├── run1.xrk
    │       ├── run2.xrk
    │       ├── run3.xrk
    │       └── notes.txt
    ├── 2025-4-15 - Brechin/
    │   └── datadump/
    │       ├── morning_session.xrk
    │       ├── afternoon_session.xrk
    │       └── setup_changes.xrk
    └── 2025-5-2 - Mosport/
        └── datadump/
            ├── run1.xrk
            └── run2.xrk
```

## Using the Dashboard Integration

### Step 1: Access Drive Sync Tab
1. **Open** the UTFR Dashboard
2. **Click** on the "DRIVE SYNC" tab
3. **Verify** the setup instructions are displayed

### Step 2: Select Your Google Drive Folder
1. **Click** "SELECT FOLDER" button
2. **Navigate** to your Google Drive folder location:
   - **Windows**: `C:\Users\[username]\Google Drive`
   - **macOS**: `~/Google Drive`
3. **Select** the "UTFR Test Data" folder
4. **Click** "Select Folder"

### Step 3: Import Test Day Data
1. **Wait** for the folder scan to complete
2. **Review** detected test days and XRK files
3. **Click** "IMPORT ALL" to import all test days
4. **Or** click individual test day buttons to import specific days

### Step 4: Verify Import
1. **Navigate** to the "RUNS" tab
2. **Verify** imported runs appear in the table
3. **Check** that test day information is correct
4. **Use** the "LOOKUP" tab to search across all imported data

## Advanced Features

### Recursive Folder Scanning
The dashboard automatically scans nested folder structures:
- **Subfolders** within test day folders are included
- **Multiple levels** of nesting are supported
- **Automatic detection** of test day patterns anywhere in the structure

### Batch Import
- **Import All**: Processes all detected test days at once
- **Individual Import**: Import specific test days
- **Progress Tracking**: Real-time progress feedback
- **Error Handling**: Graceful handling of corrupted files

### Data Validation
- **Folder Name Validation**: Ensures proper date format
- **XRK File Detection**: Only processes `.xrk` files
- **Duplicate Prevention**: Avoids importing the same data twice
- **Data Integrity**: Validates imported data structure

## Team Collaboration

### Shared Google Drive Folder
1. **Create** a shared Google Drive folder
2. **Invite** team members with edit access
3. **Each member** syncs the folder locally
4. **Consistent** folder structure across all members

### Best Practices
- **Standardize** folder naming conventions
- **Regular sync** schedules for all team members
- **Backup** important data regularly
- **Document** any custom folder structures

### File Organization Tips
- **Use descriptive** venue names
- **Include** session information in XRK filenames
- **Add notes** files for additional context
- **Keep** folder structure consistent

## Troubleshooting

### Common Issues

#### Folder Not Detected
- **Check** folder naming convention exactly
- **Verify** Google Drive is synced locally
- **Ensure** folder is inside "UTFR Test Data"
- **Restart** Google Drive app if needed

#### XRK Files Not Found
- **Confirm** files have `.xrk` extension
- **Check** files are in `datadump` subfolder
- **Verify** files are not corrupted
- **Ensure** Google Drive sync is complete

#### Import Failures
- **Check** browser console for errors
- **Verify** file permissions
- **Ensure** sufficient disk space
- **Try** importing individual test days

#### Sync Issues
- **Restart** Google Drive desktop app
- **Check** internet connection
- **Verify** Google account permissions
- **Clear** Google Drive cache if needed

### Performance Optimization

#### For Large Datasets
- **Process** test days in smaller batches
- **Close** unnecessary browser tabs
- **Ensure** sufficient RAM available
- **Use** SSD storage for better performance

#### For Slow Sync
- **Check** internet connection speed
- **Pause** other Google Drive syncs
- **Ensure** sufficient disk space
- **Close** resource-intensive applications

## Security Considerations

### Data Privacy
- **Local processing** - no data sent to external servers
- **Google Drive** provides cloud backup
- **Team access** controlled through Google Drive sharing
- **No API keys** required for basic functionality

### File Access
- **Browser-based** file selection only
- **No server-side** file processing
- **Client-side** data parsing only
- **Secure** local file system access

## Future Enhancements

### Planned Features
- **Real-time sync** notifications
- **Automatic import** on file changes
- **Advanced filtering** options
- **Export** to various formats
- **Integration** with MoTeC i2 Pro

### API Integration (Optional)
For teams requiring advanced features:
- **Google Drive API** for direct cloud access
- **OAuth authentication** for secure access
- **Real-time collaboration** features
- **Advanced file management** capabilities

## Support and Maintenance

### Regular Maintenance
- **Update** Google Drive desktop app regularly
- **Clear** browser cache periodically
- **Backup** important data regularly
- **Monitor** disk space usage

### Getting Help
- **Check** troubleshooting section above
- **Review** setup guide for basic issues
- **Contact** development team for technical support
- **Report** bugs with detailed information

### Updates and Upgrades
- **Monitor** dashboard updates
- **Test** new features in development environment
- **Backup** data before major updates
- **Document** any custom configurations
