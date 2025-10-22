# Setup Management Guide

## Overview

The UTFR Race Engineering Dashboard provides comprehensive setup management capabilities that integrate with Google Drive for persistent storage and team collaboration.

## Current Setup Management

### How Setups Work

1. **In-Memory Storage**: Setups are stored in React state during the session
2. **Rich Data Structure**: Each setup contains detailed car configuration data
3. **CRUD Operations**: Create, read, update, delete through the Setup tab
4. **Google Drive Integration**: Export/import setups to/from Google Drive folders

### Setup Data Structure

Each setup contains the following categories:

#### Aerodynamics
- **Aero Setup**: Reference to master sheet configuration
- **Aero Config Notes**: Additional configuration notes

#### Tires
- **Tire Set ID**: Link to tire set used
- **Cold Pressure Front/Rear**: Tire pressures before running
- **Hot Pressure Front/Rear**: Tire pressures after running

#### Brakes
- **Brake Bias**: Front/rear brake bias percentage
- **Hydraulic Brake Onset**: Brake system configuration
- **Brake Bias Bar**: Mechanical brake bias setting
- **Proportioning Valve**: Valve setting (1=fully front, 6=fully rear)

#### Weight
- **Corner Weights**: Individual wheel weights (FL, FR, RL, RR)
- **Front/Rear Weight**: Calculated front and rear weights
- **Total Weight**: Overall car weight
- **Cross Weight**: Diagonal weight distribution

#### Ride Height
- **Front/Rear Height**: Static ride heights in cm
- **Minimum Ground Clearance**: Lowest point clearance

#### Alignment
- **Camber Front/Rear**: Camber angles in degrees
- **Toe Front/Rear**: Toe settings at rims

#### Springs & Dampers
- **Spring Rates**: Front and rear spring rates
- **Roll Dampers**: Front and rear roll damper settings
- **Heave Dampers**: Front and rear heave damper settings

#### Drivetrain
- **Differential Preload**: Diff preload setting
- **Gear Ratio**: Final drive ratio

#### Firmware
- **Controller Hashes**: FC, RC, and ACM firmware versions
- **Inverter EEPROM**: Inverter configuration

#### Limits
- **Torque Limit**: Maximum torque setting
- **Current Limit**: Maximum current setting
- **Power Limit**: Maximum power setting

#### Battery
- **Initial Pack SOC**: Starting state of charge
- **Final Pack SOC**: Ending state of charge

## Google Drive Integration

### Folder Structure for Setups

Setups are stored as JSON files in your Google Drive test day folders:

```
Google Drive/
└── UTFR Test Data/
    ├── 2025-4-11 - Villa/
    │   ├── datadump/
    │   │   ├── run1.xrk
    │   │   └── run2.xrk
    │   ├── setup-baseline.json
    │   ├── setup-endurance.json
    │   └── setup-qualifying.json
    └── 2025-4-15 - Brechin/
        ├── datadump/
        │   └── run1.xrk
        └── setup-race.json
```

### Setup File Naming Convention

- **Format**: `setup-[name].json`
- **Examples**:
  - `setup-baseline.json`
  - `setup-endurance.json`
  - `setup-qualifying.json`
  - `setup-race.json`

### Setup File Structure

Each setup file contains a JSON object with the following structure:

```json
{
  "id": "SET-2025-04-19-GoodEndurance",
  "name": "Good Endurance Setup",
  "timestamp": "2025-04-19T10:30:00.000Z",
  "setupGoal": "Optimized for endurance racing",
  "aero": {
    "aeroSetup": "High downforce configuration",
    "aeroConfigNotes": "Front wing +2, rear wing +1"
  },
  "tire": {
    "tireSetId": "TS-HOOSIER-R20",
    "coldPressureFront": 12.0,
    "coldPressureRear": 11.5,
    "hotPressureFront": 13.2,
    "hotPressureRear": 12.8
  },
  "brakes": {
    "brakeBias": 53,
    "hydraulicBrakeOnset": "Standard",
    "brakeBiasBar": "Position 3",
    "proportioningValve": 4
  },
  "weight": {
    "flLbs": 92,
    "frLbs": 88,
    "rlLbs": 82,
    "rrLbs": 78,
    "frontLbs": 180,
    "rearLbs": 160,
    "totalLbs": 340,
    "crossWeight": 0.52
  },
  "rideHeight": {
    "frontCm": 10.0,
    "rearCm": 9.0,
    "minGroundClearance": 8.5
  },
  "alignment": {
    "camberFront": -2.5,
    "camberRear": -1.8,
    "toeFront": 0.1,
    "toeRear": 0.2
  },
  "springsDampers": {
    "springRateFront": 650,
    "springRateRear": 550,
    "rollDamperFront": "5 clicks",
    "rollDamperRear": "4 clicks",
    "heaveDamperFront": "5 clicks",
    "heaveDamperRear": "4 clicks"
  },
  "drivetrain": {
    "diffPreload": "1.5 turns from open",
    "gearRatio": "3.73:1"
  },
  "firmware": {
    "fcHash": "abc123def",
    "rcHash": "def456ghi",
    "acmHash": "ghi789jkl"
  },
  "limits": {
    "torqueLimit": 250,
    "currentLimit": 200,
    "powerLimit": 80
  },
  "battery": {
    "initialPackSOC": 85,
    "finalPackSOC": 75
  }
}
```

## Using Setup Management

### Creating Setups

1. **Navigate** to the Setup tab
2. **Click** "NEW SETUP" button
3. **Fill** in the setup form with all relevant data
4. **Click** "Save" to create the setup

### Editing Setups

1. **Click** the edit (pencil) icon on any setup card
2. **Modify** the setup data in the form
3. **Click** "Save" to update the setup

### Exporting Setups to Google Drive

1. **Click** the download icon on any setup card
2. **Save** the downloaded JSON file to your Google Drive test day folder
3. **Rename** the file to follow the naming convention: `setup-[name].json`
4. **Upload** to the appropriate test day folder

### Importing Setups from Google Drive

1. **Navigate** to the Drive Sync tab
2. **Select** your Google Drive folder
3. **Click** "IMPORT ALL" or import individual test days
4. **Setups** will be automatically imported from JSON files

## Best Practices

### Setup Organization

1. **Descriptive Names**: Use clear, descriptive setup names
2. **Consistent Naming**: Follow the `setup-[name].json` convention
3. **Test Day Association**: Store setups in their respective test day folders
4. **Version Control**: Keep track of setup changes over time

### Data Entry

1. **Complete Information**: Fill in all relevant setup parameters
2. **Accurate Measurements**: Ensure all measurements are precise
3. **Notes**: Add notes for any special configurations
4. **Validation**: Double-check all entered data

### Team Collaboration

1. **Shared Google Drive**: Use shared Google Drive folder for team access
2. **Regular Sync**: Keep Google Drive synced across all team members
3. **Communication**: Coordinate setup changes with team
4. **Backup**: Regularly export setups for backup

### File Management

1. **Backup**: Export setups regularly to prevent data loss
2. **Organization**: Keep setup files organized in test day folders
3. **Naming**: Use consistent file naming conventions
4. **Versioning**: Track setup changes and versions

## Troubleshooting

### Common Issues

#### Setup Not Importing
- **Check file format**: Ensure file is valid JSON
- **Check file name**: Must contain "setup" and end with ".json"
- **Check file location**: Must be in test day folder
- **Check file content**: Ensure JSON structure is correct

#### Export Not Working
- **Check browser**: Ensure browser supports file downloads
- **Check permissions**: Ensure browser has download permissions
- **Check file name**: File name will be sanitized for download
- **Check data**: Ensure setup data is complete

#### Data Loss
- **Export regularly**: Export setups frequently
- **Backup files**: Keep backup copies of setup files
- **Check sync**: Ensure Google Drive is syncing properly
- **Browser storage**: Data is stored in browser memory only

### File Format Issues

#### Invalid JSON
- **Check syntax**: Ensure proper JSON syntax
- **Check brackets**: Ensure all brackets are properly closed
- **Check quotes**: Ensure all strings are properly quoted
- **Check commas**: Ensure proper comma placement

#### Missing Data
- **Check structure**: Ensure all required fields are present
- **Check types**: Ensure data types are correct
- **Check values**: Ensure values are within expected ranges
- **Check references**: Ensure referenced IDs exist

## Advanced Features

### Setup Comparison

Compare different setups to analyze changes:
1. **Export** multiple setups
2. **Use external tools** to compare JSON files
3. **Analyze differences** in setup parameters
4. **Document changes** and their effects

### Setup Templates

Create setup templates for common configurations:
1. **Create** a baseline setup
2. **Export** as template
3. **Use** as starting point for new setups
4. **Modify** as needed for specific conditions

### Setup History

Track setup changes over time:
1. **Export** setups after each change
2. **Store** in versioned folders
3. **Document** changes and reasons
4. **Analyze** performance impact

## Integration with Runs

### Linking Setups to Runs

1. **Create** setup in Setup tab
2. **Export** setup to Google Drive
3. **Create** run in Runs tab
4. **Link** run to setup using setup ID
5. **Track** performance with specific setups

### Setup Performance Analysis

1. **Link** setups to runs
2. **Track** performance metrics
3. **Analyze** setup effectiveness
4. **Optimize** based on results

## Future Enhancements

### Planned Features

- **Real-time Sync**: Automatic sync with Google Drive
- **Setup Comparison**: Built-in setup comparison tools
- **Performance Tracking**: Link setups to performance data
- **Setup Optimization**: AI-powered setup recommendations
- **Team Collaboration**: Real-time collaborative setup editing

### Advanced Integration

- **MoTeC Integration**: Export to MoTeC i2 Pro format
- **Simulation Integration**: Import from simulation software
- **Telemetry Integration**: Link setups to telemetry data
- **Weather Integration**: Weather-based setup recommendations

