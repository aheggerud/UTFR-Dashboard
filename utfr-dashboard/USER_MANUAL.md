# UTFR Race Engineering Dashboard - User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Main Dashboard Overview](#main-dashboard-overview)
3. [Runs Tab](#runs-tab)
4. [Setup Tab](#setup-tab)
5. [Tires Tab](#tires-tab)
6. [Telemetry Tab](#telemetry-tab)
7. [Drive Sync Tab](#drive-sync-tab)
8. [Lookup Tab](#lookup-tab)
9. [Admin Tab](#admin-tab)
10. [Data Management](#data-management)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

### First Launch
1. **Open** your web browser
2. **Navigate** to `http://localhost:3000`
3. **Wait** for the dashboard to load
4. **Familiarize** yourself with the racing telemetry theme

### Dashboard Theme
The dashboard uses a **racing telemetry aesthetic** with:
- **Dark backgrounds** for reduced eye strain
- **Neon accent colors** (green, cyan, purple)
- **Monospace fonts** for technical data
- **High contrast** for readability

## Main Dashboard Overview

### Header Section
- **UTFR Logo**: University of Toronto Formula Racing branding
- **Dashboard Title**: "Race Engineering Dashboard"
- **Tab Navigation**: 7 main sections for different functions

### Tab Structure
The dashboard is organized into 7 main tabs:

1. **RUNS** - Manage test day runs and data
2. **SETUP** - Create and manage car setup snapshots
3. **TIRES** - Track tire sets and conditions
4. **TELEMETRY** - F1-style telemetry visualization
5. **DRIVE SYNC** - Import data from Google Drive
6. **LOOKUP** - Search across all data
7. **ADMIN** - System administration and settings

## Runs Tab

### Overview
The Runs tab is the central hub for managing test day data and individual runs.

### Test Day Selection
- **Dropdown Menu**: Select active test day from the list
- **Test Day Info**: Shows date, track, and number of runs
- **Add New**: Create new test days (future feature)

### Runs Table
The runs table displays all runs for the selected test day:

#### Columns
- **Run**: Run number (R01, R02, etc.)
- **Track**: Track/venue name
- **Drivers**: List of drivers for the run
- **Setup**: Associated setup snapshot
- **Tires**: Tire set used
- **Notes**: Additional notes or comments
- **Actions**: Edit and delete buttons

#### Row Colors
- **Alternating**: Dark gray and black rows for readability
- **Hover Effect**: Rows highlight on mouse hover
- **Active Selection**: Selected runs are highlighted

### Adding New Runs
1. **Click** the "ADD RUN" button
2. **Fill** in the required information:
   - Run number
   - Track/venue
   - Drivers (comma-separated)
   - Setup (optional)
   - Tires (optional)
   - Notes (optional)
3. **Click** "Save" to create the run

### Editing Runs
1. **Click** the edit (pencil) icon in the Actions column
2. **Modify** the run information
3. **Click** "Save" to update

### Deleting Runs
1. **Click** the delete (trash) icon in the Actions column
2. **Confirm** the deletion in the popup dialog

### Filtering Runs
- **Driver Filter**: Filter by specific driver
- **Setup Filter**: Filter by setup type
- **Tire Filter**: Filter by tire set
- **Text Search**: Search across all run data

## Setup Tab

### Overview
The Setup tab manages car setup snapshots and configurations.

### Setup Snapshots
Setup snapshots capture the complete car configuration at a specific point in time.

### Creating Setup Snapshots
1. **Click** "NEW SETUP" button
2. **Enter** setup name and description
3. **Add** key-value pairs for setup data:
   - **Aerodynamics**: Downforce, drag coefficients
   - **Suspension**: Spring rates, damper settings
   - **Tires**: Pressures, camber, toe
   - **Brakes**: Bias, proportioning
   - **Weight**: Corner weights, distribution
   - **Ride Height**: Front/rear heights
   - **Alignment**: Camber, toe settings
4. **Click** "Save" to create the snapshot

### Setup Data Categories

#### Aerodynamics
- **Front Wing**: Angle, flap settings
- **Rear Wing**: Angle, flap settings
- **Diffuser**: Settings and adjustments
- **Underbody**: Ground effects configuration

#### Suspension
- **Spring Rates**: Front and rear rates
- **Damper Settings**: Compression and rebound
- **Anti-roll Bars**: Front and rear settings
- **Ride Height**: Static heights and rake

#### Tires
- **Pressures**: Hot and cold pressures
- **Camber**: Front and rear camber angles
- **Toe**: Front and rear toe settings
- **Caster**: Front caster angle

#### Brakes
- **Bias**: Front/rear brake bias
- **Proportioning**: Valve settings
- **Pad Compound**: Brake pad type
- **Disc Type**: Brake disc material

#### Weight
- **Corner Weights**: Individual wheel weights
- **Total Weight**: Overall car weight
- **Weight Distribution**: Front/rear percentage
- **Cross Weight**: Diagonal weight distribution

### Editing Setups
1. **Click** on a setup in the list
2. **Modify** the setup data
3. **Click** "Save" to update

### Setup History
- **Timeline**: View setup changes over time
- **Comparison**: Compare different setups
- **Export**: Export setup data for analysis

## Tires Tab

### Overview
The Tires tab tracks tire sets, their condition, and usage history.

### Tire Set Management
Track different tire sets with their specifications and condition.

### Adding Tire Sets
1. **Click** "ADD TIRE SET" button
2. **Enter** tire information:
   - **Brand**: Tire manufacturer
   - **Compound**: Tire compound type
   - **Size**: Tire dimensions
   - **Condition**: New, used, worn
   - **Notes**: Additional information
3. **Click** "Save" to create the tire set

### Tire Set Information

#### Brand Options
- **Hoosier**: Formula Student specific tires
- **Avon**: Alternative racing tires
- **Michelin**: High-performance options
- **Custom**: Other manufacturers

#### Compound Types
- **Slick**: Dry weather compounds
- **Wet**: Wet weather compounds
- **Intermediate**: Mixed conditions
- **Custom**: Special compounds

#### Condition Tracking
- **New**: Unused tires
- **Used**: Previously used
- **Worn**: High wear level
- **Retired**: End of life

### Tire Usage History
- **Run Association**: Link tires to specific runs
- **Wear Tracking**: Monitor tire condition over time
- **Performance Data**: Track lap times with different tires
- **Replacement Schedule**: Plan tire changes

### Tire Analysis
- **Performance Comparison**: Compare different tire sets
- **Wear Patterns**: Analyze tire degradation
- **Optimal Usage**: Determine best tire strategies
- **Cost Analysis**: Track tire expenses

## Telemetry Tab

### Overview
The Telemetry tab provides F1-style real-time telemetry visualization.

### Layout
The telemetry dashboard is organized in a 3-column layout:

#### Left Column
- **Sector Times**: Real-time sector timing
- **Tire Temperatures**: Radial temperature displays
- **System Status**: Car system monitoring

#### Center Column
- **Track Map**: SVG track visualization
- **Telemetry Charts**: Speed, throttle, brake traces
- **Speed Trace**: Last lap speed profile

#### Right Column
- **Car Overview**: Detailed car wireframe
- **Notes**: Engineering notes and observations

### Track Map
- **Brechin Motorsport Park**: Detailed track layout
- **Sectors**: Color-coded sector divisions
- **Marshal Posts**: Safety and timing points
- **Pit Lane**: Pit entry and exit points
- **Grid**: Starting positions

### Car Wireframe
- **UTFR Car**: Detailed car diagram
- **Specifications**: Key car parameters
- **Systems**: Engine, electrical, cooling
- **Aerodynamics**: Wing and diffuser details

### Telemetry Charts
- **Speed Trace**: Vehicle speed over time
- **Throttle Position**: Throttle input percentage
- **Brake Pressure**: Brake system pressure
- **Gear Selection**: Current gear position

### Sector Timing
- **Sector 1**: First sector time
- **Sector 2**: Second sector time
- **Sector 3**: Third sector time
- **Lap Time**: Total lap time
- **Delta**: Time difference from best lap

### Tire Temperature Monitoring
- **Front Left**: FL tire temperature
- **Front Right**: FR tire temperature
- **Rear Left**: RL tire temperature
- **Rear Right**: RR tire temperature
- **Optimal Range**: Target temperature zones

### System Status
- **Engine**: RPM, temperature, oil pressure
- **Electrical**: Battery voltage, current draw
- **Cooling**: Water temperature, flow rate
- **Brakes**: Brake temperature, pressure

## Drive Sync Tab

### Overview
The Drive Sync tab handles importing data from Google Drive folders.

### Setup Instructions
The tab displays step-by-step setup instructions:
1. Install Google Drive desktop app
2. Create shared folder: "UTFR Test Data"
3. Organize folders as: "YYYY-M-D - Venue"
4. Put XRK files in subfolders (e.g., "datadump")
5. Select the "UTFR Test Data" folder

### Folder Selection
1. **Click** "SELECT FOLDER" button
2. **Navigate** to your Google Drive folder
3. **Select** the "UTFR Test Data" folder
4. **Wait** for folder scan to complete

### Test Day Detection
The system automatically detects test day folders with:
- **Date Format**: YYYY-M-D (e.g., 2025-4-11)
- **Venue Name**: Track or location name
- **XRK Files**: Telemetry data files

### Import Options
- **Import All**: Import all detected test days
- **Individual Import**: Import specific test days
- **Progress Tracking**: Real-time import progress
- **Error Handling**: Graceful handling of issues

### Import Process
1. **Scan** folder structure for test days
2. **Detect** XRK files in datadump folders
3. **Parse** folder names for date and venue
4. **Create** test day and run records
5. **Import** data into dashboard

### Status Information
- **Connection Status**: Connected/Not connected
- **Test Days Found**: Number of detected test days
- **XRK Files Found**: Number of telemetry files
- **Last Scan Time**: When folder was last scanned

## Lookup Tab

### Overview
The Lookup tab provides global search across all test days and runs.

### Search Interface
- **Free Text Search**: Search across all run data
- **Driver Filter**: Filter by specific driver
- **Setup Filter**: Filter by setup type
- **Tire Filter**: Filter by tire set

### Search Results
The lookup table displays:
- **Test Day**: Date and venue information
- **Run**: Run number and details
- **Track**: Track/venue name
- **Drivers**: Driver list
- **Setup**: Associated setup
- **Tires**: Tire set used
- **Notes**: Additional information
- **Data**: Link to telemetry data

### Global Search Features
- **Cross-Day Search**: Search across all test days
- **Multi-Criteria**: Combine multiple filters
- **Real-Time**: Instant search results
- **Sorting**: Sort by date, run number, etc.

### Search Tips
- **Use Keywords**: Search for specific terms
- **Combine Filters**: Use multiple filters together
- **Date Ranges**: Search within specific time periods
- **Driver Names**: Find runs by specific drivers

## Admin Tab

### Overview
The Admin tab provides system administration and configuration options.

### System Information
- **Version**: Dashboard version number
- **Last Update**: When system was last updated
- **Data Statistics**: Number of records in system

### Data Management
- **Export Data**: Export all data to various formats
- **Import Data**: Import data from external sources
- **Backup**: Create system backups
- **Restore**: Restore from backups

### User Management
- **User Accounts**: Manage user access (future feature)
- **Permissions**: Set user permissions (future feature)
- **Activity Log**: Track user actions (future feature)

### System Settings
- **Theme**: Customize dashboard appearance
- **Notifications**: Configure system notifications
- **Auto-Save**: Enable automatic data saving
- **Sync Settings**: Configure Google Drive sync

## Data Management

### Data Types
The dashboard manages four main data types:

#### Test Days
- **Date**: Test day date
- **Track**: Venue name
- **Runs**: Number of runs

#### Runs
- **Run Number**: Sequential run identifier
- **Drivers**: List of drivers
- **Setup**: Associated setup snapshot
- **Tires**: Tire set used
- **Notes**: Additional information

#### Setups
- **Name**: Setup identifier
- **Data**: Key-value configuration data
- **Timestamp**: When setup was created

#### Tires
- **Brand**: Tire manufacturer
- **Compound**: Tire compound type
- **Condition**: Current tire condition

### Data Relationships
- **Test Days** contain multiple **Runs**
- **Runs** can be linked to **Setups** and **Tires**
- **Setups** and **Tires** can be used across multiple runs

### Data Persistence
- **Local Storage**: Data stored in browser
- **Session Persistence**: Data survives page refresh
- **Export/Import**: Backup and restore capabilities

## Keyboard Shortcuts

### Navigation
- **Tab**: Navigate between tabs
- **Enter**: Confirm selections
- **Escape**: Cancel operations
- **Ctrl/Cmd + S**: Save current data

### Search
- **Ctrl/Cmd + F**: Focus search box
- **Enter**: Execute search
- **Escape**: Clear search

### Data Entry
- **Tab**: Move between form fields
- **Enter**: Submit forms
- **Escape**: Cancel data entry

## Tips and Best Practices

### Data Organization
1. **Consistent Naming**: Use consistent naming conventions
2. **Regular Backups**: Export data regularly
3. **Clear Notes**: Add descriptive notes to runs
4. **Setup Documentation**: Document setup changes

### Performance
1. **Close Unused Tabs**: Close unnecessary browser tabs
2. **Regular Restart**: Restart browser periodically
3. **Clear Cache**: Clear browser cache if issues occur
4. **Sufficient RAM**: Ensure adequate system memory

### Team Collaboration
1. **Shared Google Drive**: Use shared Google Drive folder
2. **Consistent Structure**: Maintain consistent folder structure
3. **Regular Sync**: Keep Google Drive synced
4. **Communication**: Coordinate data entry with team

### Troubleshooting
1. **Check Console**: Use browser developer tools
2. **Restart Browser**: Restart browser if issues occur
3. **Clear Data**: Clear browser data if needed
4. **Contact Support**: Reach out for technical support

### Best Practices Summary
- **Organize** data consistently
- **Backup** regularly
- **Document** changes
- **Communicate** with team
- **Test** new features
- **Report** issues promptly

## Getting Help

### Documentation
- **Setup Guide**: Initial installation and configuration
- **Google Drive Guide**: File synchronization setup
- **Code Documentation**: Technical implementation details
- **Troubleshooting Guide**: Common issues and solutions

### Support
- **Development Team**: Contact for technical issues
- **User Community**: Share tips and best practices
- **Issue Reporting**: Report bugs and feature requests
- **Training**: Request training sessions for team

### Resources
- **Video Tutorials**: Step-by-step video guides
- **FAQ**: Frequently asked questions
- **Release Notes**: New features and updates
- **Changelog**: Version history and changes
