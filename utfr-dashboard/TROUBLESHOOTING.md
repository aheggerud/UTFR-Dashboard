# UTFR Race Engineering Dashboard - Troubleshooting Guide

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [Application Launch Problems](#application-launch-problems)
3. [Google Drive Sync Issues](#google-drive-sync-issues)
4. [Data Import Problems](#data-import-problems)
5. [Performance Issues](#performance-issues)
6. [Browser Compatibility](#browser-compatibility)
7. [File System Issues](#file-system-issues)
8. [Network Problems](#network-problems)
9. [Data Corruption](#data-corruption)
10. [UI/UX Issues](#uiux-issues)
11. [Error Messages](#error-messages)
12. [Advanced Troubleshooting](#advanced-troubleshooting)

## Installation Issues

### Node.js Installation Problems

#### Windows
**Problem**: Node.js installer fails or doesn't work
**Solutions**:
1. **Run as Administrator**:
   ```cmd
   Right-click installer → "Run as administrator"
   ```

2. **Disable Antivirus**: Temporarily disable antivirus during installation

3. **Use Chocolatey**:
   ```cmd
   # Install Chocolatey first
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   
   # Install Node.js
   choco install nodejs
   ```

4. **Manual Installation**:
   - Download from [nodejs.org](https://nodejs.org)
   - Choose the Windows Installer (.msi)
   - Run with administrator privileges

#### macOS
**Problem**: Node.js installation fails on macOS
**Solutions**:
1. **Use Homebrew**:
   ```bash
   # Install Homebrew
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Install Node.js
   brew install node
   ```

2. **Fix Permissions**:
   ```bash
   sudo chown -R $(whoami) /usr/local/lib/node_modules
   sudo chown -R $(whoami) /usr/local/bin
   ```

3. **Use Node Version Manager (nvm)**:
   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Install and use Node.js
   nvm install node
   nvm use node
   ```

### npm Install Failures

**Problem**: `npm install` fails with errors
**Solutions**:
1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use different registry**:
   ```bash
   npm install --registry https://registry.npmjs.org/
   ```

4. **Check Node.js version**:
   ```bash
   node --version
   npm --version
   ```
   Ensure Node.js version is 18.0 or higher

5. **Fix permissions (macOS/Linux)**:
   ```bash
   sudo chown -R $(whoami) ~/.npm
   ```

## Application Launch Problems

### Port Already in Use

**Problem**: Error "Port 3000 is already in use"
**Solutions**:
1. **Kill process using port 3000**:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   ```

2. **Use different port**:
   ```bash
   npm run dev -- -p 3001
   ```

3. **Find and kill all Node processes**:
   ```bash
   # Windows
   taskkill /IM node.exe /F
   
   # macOS/Linux
   pkill -f node
   ```

### Application Won't Start

**Problem**: Dashboard fails to start or crashes immediately
**Solutions**:
1. **Check for syntax errors**:
   ```bash
   npm run lint
   ```

2. **Verify all dependencies**:
   ```bash
   npm list
   ```

3. **Check Node.js version compatibility**:
   ```bash
   node --version
   ```
   Ensure version is 18.0 or higher

4. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

5. **Check for conflicting processes**:
   ```bash
   # Check if another Next.js app is running
   ps aux | grep next
   ```

### Browser Won't Load Dashboard

**Problem**: Browser shows "This site can't be reached" or similar
**Solutions**:
1. **Verify server is running**:
   - Check terminal for "Ready" message
   - Look for "Local: http://localhost:3000"

2. **Try different browser**:
   - Test in Chrome, Firefox, Safari, or Edge

3. **Check firewall settings**:
   - Allow Node.js through firewall
   - Allow port 3000 through firewall

4. **Try localhost alternatives**:
   - `http://127.0.0.1:3000`
   - `http://0.0.0.0:3000`

5. **Check network configuration**:
   - Disable VPN if active
   - Check proxy settings

## Google Drive Sync Issues

### Google Drive Not Syncing

**Problem**: Files not appearing in local Google Drive folder
**Solutions**:
1. **Restart Google Drive app**:
   - Close Google Drive completely
   - Restart the application
   - Wait for sync to complete

2. **Check internet connection**:
   - Ensure stable internet connection
   - Test with other Google services

3. **Verify Google account**:
   - Sign out and sign back in
   - Check account permissions

4. **Clear Google Drive cache**:
   ```bash
   # Windows
   %LOCALAPPDATA%\Google\DriveFS\Logs
   
   # macOS
   ~/Library/Application Support/Google/DriveFS/Logs
   ```

5. **Check disk space**:
   - Ensure sufficient disk space
   - Free up space if needed

### Folder Structure Not Detected

**Problem**: Dashboard doesn't detect test day folders
**Solutions**:
1. **Verify folder naming convention**:
   - Format: `YYYY-M-D - Venue`
   - Example: `2025-4-11 - Villa`
   - No extra spaces or characters

2. **Check folder location**:
   - Ensure folders are in "UTFR Test Data" folder
   - Verify correct Google Drive folder selected

3. **Wait for sync completion**:
   - Allow time for Google Drive to sync
   - Check sync status in Google Drive app

4. **Refresh folder selection**:
   - Reselect the Google Drive folder
   - Wait for rescan to complete

### XRK Files Not Found

**Problem**: XRK files not detected in folders
**Solutions**:
1. **Check file extension**:
   - Ensure files have `.xrk` extension
   - Case-sensitive on some systems

2. **Verify file location**:
   - Files must be in `datadump` subfolder
   - Not in root test day folder

3. **Check file permissions**:
   - Ensure files are readable
   - Fix permissions if needed

4. **Verify file integrity**:
   - Check if files are corrupted
   - Try with different XRK files

## Data Import Problems

### Import Process Fails

**Problem**: Data import stops or fails during process
**Solutions**:
1. **Check browser console**:
   - Open Developer Tools (F12)
   - Look for error messages
   - Check Network tab for failed requests

2. **Try smaller batches**:
   - Import individual test days
   - Avoid importing all at once

3. **Check file sizes**:
   - Large files may cause timeouts
   - Process smaller files first

4. **Clear browser data**:
   - Clear cache and cookies
   - Restart browser

5. **Check system resources**:
   - Ensure sufficient RAM
   - Close other applications

### Imported Data Missing

**Problem**: Data imports but doesn't appear in dashboard
**Solutions**:
1. **Refresh the page**:
   - Reload the dashboard
   - Check if data appears

2. **Check correct tab**:
   - Look in "RUNS" tab
   - Check "LOOKUP" tab for global view

3. **Verify data format**:
   - Check if data structure is correct
   - Look for parsing errors

4. **Check browser storage**:
   - Open Developer Tools
   - Check Application/Storage tab
   - Look for stored data

### Duplicate Data

**Problem**: Same data imported multiple times
**Solutions**:
1. **Clear existing data**:
   - Use browser's clear storage option
   - Refresh the page

2. **Check import history**:
   - Avoid re-importing same folders
   - Keep track of imported data

3. **Use unique identifiers**:
   - Ensure test day names are unique
   - Avoid duplicate folder names

## Performance Issues

### Slow Loading

**Problem**: Dashboard loads slowly or freezes
**Solutions**:
1. **Close unnecessary tabs**:
   - Close other browser tabs
   - Free up system resources

2. **Check system resources**:
   - Monitor CPU and RAM usage
   - Close other applications

3. **Clear browser cache**:
   - Clear cache and cookies
   - Restart browser

4. **Use SSD storage**:
   - Ensure Google Drive is on SSD
   - Move project to SSD if possible

5. **Increase Node.js memory**:
   ```bash
   node --max-old-space-size=4096 node_modules/.bin/next dev
   ```

### Memory Issues

**Problem**: Browser runs out of memory
**Solutions**:
1. **Restart browser**:
   - Close and reopen browser
   - Clear browser data

2. **Process smaller datasets**:
   - Import data in smaller batches
   - Avoid loading all data at once

3. **Check for memory leaks**:
   - Monitor memory usage
   - Look for increasing memory consumption

4. **Use different browser**:
   - Try Chrome, Firefox, or Safari
   - Some browsers handle memory better

### File Processing Slow

**Problem**: XRK file processing takes too long
**Solutions**:
1. **Check file sizes**:
   - Large files take longer to process
   - Consider splitting large files

2. **Process in background**:
   - Don't switch tabs during processing
   - Let process complete

3. **Check system performance**:
   - Monitor CPU usage
   - Ensure adequate resources

4. **Use faster storage**:
   - Move files to SSD
   - Ensure fast disk access

## Browser Compatibility

### Browser Not Supported

**Problem**: Dashboard doesn't work in certain browsers
**Solutions**:
1. **Use supported browsers**:
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

2. **Update browser**:
   - Install latest browser version
   - Enable automatic updates

3. **Check browser features**:
   - Ensure webkitdirectory API support
   - Check JavaScript support

4. **Disable extensions**:
   - Disable ad blockers
   - Disable privacy extensions

### JavaScript Errors

**Problem**: JavaScript errors in browser console
**Solutions**:
1. **Check console errors**:
   - Open Developer Tools (F12)
   - Look for error messages
   - Check line numbers

2. **Update browser**:
   - Install latest browser version
   - Clear browser cache

3. **Disable extensions**:
   - Test in incognito/private mode
   - Disable all extensions

4. **Check network**:
   - Ensure stable internet connection
   - Check for network errors

## File System Issues

### Permission Denied

**Problem**: Cannot access Google Drive folder
**Solutions**:
1. **Check folder permissions**:
   - Ensure folder is readable
   - Fix permissions if needed

2. **Run as administrator**:
   - Run browser as administrator
   - Check system permissions

3. **Check antivirus**:
   - Disable antivirus temporarily
   - Add folder to exceptions

4. **Use different folder**:
   - Try different Google Drive folder
   - Check folder location

### File Not Found

**Problem**: Files disappear or can't be found
**Solutions**:
1. **Check Google Drive sync**:
   - Ensure files are synced
   - Wait for sync completion

2. **Verify file location**:
   - Check correct folder path
   - Look for moved files

3. **Check file names**:
   - Ensure correct file names
   - Check for hidden characters

4. **Restart Google Drive**:
   - Restart Google Drive app
   - Wait for resync

## Network Problems

### Connection Issues

**Problem**: Cannot connect to local server
**Solutions**:
1. **Check server status**:
   - Verify server is running
   - Check terminal output

2. **Try different port**:
   ```bash
   npm run dev -- -p 3001
   ```

3. **Check firewall**:
   - Allow Node.js through firewall
   - Allow port 3000

4. **Check network configuration**:
   - Disable VPN
   - Check proxy settings

### Slow Network

**Problem**: Slow file operations or sync
**Solutions**:
1. **Check internet speed**:
   - Test internet connection
   - Use faster connection if available

2. **Optimize Google Drive**:
   - Use selective sync
   - Sync only needed folders

3. **Use local files**:
   - Copy files locally
   - Avoid network operations

4. **Check network usage**:
   - Monitor network activity
   - Close other network applications

## Data Corruption

### Corrupted Data

**Problem**: Data appears corrupted or incorrect
**Solutions**:
1. **Clear browser storage**:
   - Clear all stored data
   - Refresh the page

2. **Re-import data**:
   - Import data again
   - Check for errors

3. **Check source files**:
   - Verify XRK files are intact
   - Check folder structure

4. **Use backup data**:
   - Restore from backup
   - Check backup integrity

### Data Loss

**Problem**: Data disappears or is lost
**Solutions**:
1. **Check browser storage**:
   - Look for stored data
   - Check storage limits

2. **Restore from backup**:
   - Use exported data
   - Re-import from source

3. **Check Google Drive**:
   - Verify files are still there
   - Check sync status

4. **Prevent future loss**:
   - Regular backups
   - Export data frequently

## UI/UX Issues

### Display Problems

**Problem**: UI elements not displaying correctly
**Solutions**:
1. **Check browser zoom**:
   - Reset zoom to 100%
   - Check display scaling

2. **Clear browser cache**:
   - Clear cache and cookies
   - Restart browser

3. **Check CSS loading**:
   - Ensure stylesheets load
   - Check for CSS errors

4. **Try different browser**:
   - Test in different browser
   - Check compatibility

### Responsive Issues

**Problem**: Dashboard doesn't work on mobile or tablet
**Solutions**:
1. **Use desktop browser**:
   - Dashboard designed for desktop
   - Use laptop or desktop computer

2. **Check screen resolution**:
   - Ensure adequate screen size
   - Use minimum 1024x768 resolution

3. **Try different device**:
   - Test on different computer
   - Check device compatibility

## Error Messages

### Common Error Messages

#### "Module not found"
**Cause**: Missing dependencies or incorrect imports
**Solution**:
```bash
npm install
npm run dev
```

#### "Port already in use"
**Cause**: Another process using port 3000
**Solution**:
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

#### "Permission denied"
**Cause**: Insufficient file permissions
**Solution**:
- Run as administrator
- Check folder permissions
- Fix file permissions

#### "File not found"
**Cause**: Missing files or incorrect paths
**Solution**:
- Check file locations
- Verify Google Drive sync
- Check folder structure

#### "Invalid folder structure"
**Cause**: Incorrect folder naming or structure
**Solution**:
- Follow naming convention: `YYYY-M-D - Venue`
- Ensure XRK files in `datadump` folder
- Check folder hierarchy

## Advanced Troubleshooting

### Developer Tools

**Using Browser Developer Tools**:
1. **Open Developer Tools**:
   - Press F12 or right-click → Inspect
   - Go to Console tab for errors
   - Check Network tab for failed requests

2. **Check Console Errors**:
   - Look for red error messages
   - Check line numbers and file names
   - Note error descriptions

3. **Monitor Network**:
   - Check for failed requests
   - Look for slow responses
   - Verify file uploads

4. **Check Storage**:
   - Go to Application/Storage tab
   - Check Local Storage
   - Look for stored data

### System Diagnostics

**Check System Resources**:
1. **Monitor CPU Usage**:
   - Use Task Manager (Windows) or Activity Monitor (macOS)
   - Look for high CPU usage
   - Close unnecessary applications

2. **Check Memory Usage**:
   - Monitor RAM usage
   - Look for memory leaks
   - Restart if memory is low

3. **Check Disk Space**:
   - Ensure sufficient disk space
   - Free up space if needed
   - Check Google Drive sync space

4. **Check Network**:
   - Test internet connection
   - Check for network issues
   - Verify Google Drive connectivity

### Log Analysis

**Check Application Logs**:
1. **Browser Console**:
   - Check for JavaScript errors
   - Look for network errors
   - Note error timestamps

2. **Google Drive Logs**:
   - Check Google Drive app logs
   - Look for sync errors
   - Verify file operations

3. **System Logs**:
   - Check system event logs
   - Look for permission errors
   - Check for file system errors

### Recovery Procedures

**Data Recovery**:
1. **Export Current Data**:
   - Use dashboard export features
   - Save data to external file
   - Keep multiple backups

2. **Restore from Backup**:
   - Use exported data files
   - Re-import from Google Drive
   - Check data integrity

3. **Reset Application**:
   - Clear all browser data
   - Restart application
   - Re-import data

4. **Contact Support**:
   - Document all error messages
   - Note steps to reproduce
   - Provide system information

## Getting Help

### Before Contacting Support

1. **Document the Problem**:
   - Note exact error messages
   - Record steps to reproduce
   - Take screenshots if helpful

2. **Check This Guide**:
   - Look for similar issues
   - Try suggested solutions
   - Follow troubleshooting steps

3. **Gather System Information**:
   - Operating system and version
   - Browser and version
   - Node.js and npm versions
   - Available disk space and RAM

4. **Test Basic Functionality**:
   - Try different browser
   - Test on different computer
   - Check network connectivity

### Contact Information

**Technical Support**:
- **Email**: [support email]
- **Issue Tracker**: [GitHub issues]
- **Documentation**: [Documentation site]

**When Reporting Issues**:
- Include error messages
- Provide system information
- Describe steps to reproduce
- Attach relevant files or screenshots

### Community Support

**User Community**:
- **Forum**: [Community forum]
- **Discord**: [Discord server]
- **Wiki**: [Community wiki]

**Best Practices**:
- Search existing issues first
- Provide detailed information
- Be patient with responses
- Help other users when possible
