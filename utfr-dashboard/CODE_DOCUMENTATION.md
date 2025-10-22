# UTFR Race Engineering Dashboard - Code Documentation

## Overview

The UTFR Race Engineering Dashboard is a comprehensive web application built with Next.js 15, React 19, and TypeScript. It provides a complete solution for managing Formula Student test day data, including run logging, setup tracking, telemetry visualization, and data import/export capabilities.

## Architecture

### Technology Stack
- **Frontend Framework**: Next.js 15.5.4 with App Router
- **UI Library**: React 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Charts**: Recharts 3.2.1
- **Animations**: Framer Motion 12.23.21
- **Icons**: Lucide React 0.544.0

### Project Structure
```
utfr-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with fonts and metadata
│   │   ├── page.tsx            # Main page component
│   │   └── globals.css         # Global styles and Tailwind imports
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── badge.tsx       # Badge component
│   │   │   ├── button.tsx      # Button component
│   │   │   ├── card.tsx        # Card component
│   │   │   ├── dialog.tsx      # Dialog component
│   │   │   ├── input.tsx       # Input component
│   │   │   ├── label.tsx       # Label component
│   │   │   ├── progress.tsx    # Progress component
│   │   │   ├── select.tsx      # Select component
│   │   │   ├── sheet.tsx       # Sheet component
│   │   │   ├── tabs.tsx        # Tabs component
│   │   │   └── textarea.tsx    # Textarea component
│   │   ├── F1TelemetryDashboard.tsx    # F1-style telemetry visualization
│   │   ├── LocalGoogleDriveSync.tsx    # Local file system sync component
│   │   └── UTFRDataDashboard.tsx       # Main dashboard component
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
├── package.json               # Dependencies and scripts
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── next.config.js             # Next.js configuration
```

## Core Components

### 1. UTFRDataDashboard.tsx
**Main dashboard component that orchestrates all functionality**

#### Key Features:
- **State Management**: Manages all application state using React hooks
- **Data Types**: Handles TestDay, Run, SetupSnapshot, and TireSet entities
- **Tab Navigation**: 7 main tabs (Runs, Setup, Tires, Telemetry, Drive Sync, Lookup, Admin)
- **Filtering**: Advanced filtering for runs across multiple criteria
- **CRUD Operations**: Create, read, update, delete for all data entities

#### State Variables:
```typescript
const [days, setDays] = useState<TestDay[]>(initialDays);
const [runs, setRuns] = useState<Run[]>(initialRuns);
const [setups, setSetups] = useState<SetupSnapshot[]>(initialSetups);
const [tires, setTires] = useState<TireSet[]>(initialTires);
const [activeDayId, setActiveDayId] = useState(days[0]?.id ?? "");
```

#### Key Functions:
- `handleXRKDataImport()`: Processes imported data from XRK files
- `upsertRun()`: Creates or updates run data
- `deleteRun()`: Removes run data
- `formatSetupSummary()`: Formats setup data for display

### 2. F1TelemetryDashboard.tsx
**F1-style telemetry visualization component**

#### Features:
- **Track Map**: SVG-based track visualization for Brechin Motorsport Park
- **Car Wireframe**: Detailed UTFR car diagram with specifications
- **Telemetry Charts**: Speed, throttle, brake traces using Recharts
- **Sector Timing**: Real-time sector time displays
- **Tire Temperature**: Radial charts for tire temperature monitoring
- **System Status**: Dense table for various car systems

#### Key Components:
- `TrackMap`: SVG track layout with sectors and marshal posts
- `CarWireframe`: Detailed car diagram with UTFR branding
- `TelemetryChart`: Line charts for speed/throttle/brake data
- `SectorTimingStrip`: Sector time visualization
- `TyreRadials`: Tire temperature radial charts
- `DenseTable`: System status monitoring

### 3. LocalGoogleDriveSync.tsx
**Local file system synchronization component**

#### Features:
- **Folder Upload**: Webkitdirectory API for folder selection
- **XRK File Detection**: Automatic detection of XRK telemetry files
- **Test Day Parsing**: Parses folder names in format "YYYY-M-D - Venue"
- **Recursive Scanning**: Scans nested folder structures
- **Progress Tracking**: Real-time import progress feedback
- **Data Import**: Converts file structure to dashboard data format

#### Key Functions:
- `scanForTestDayFolders()`: Recursively scans for test day folders
- `importTestDayData()`: Imports data from selected test day
- `handleFolderUpload()`: Processes uploaded folder structure

## Data Models

### TestDay
```typescript
interface TestDay {
  id: string;
  date: string;        // Format: "YYYY-MM-DD"
  track: string;       // Venue name
  runs: number;        // Number of runs
}
```

### Run
```typescript
interface Run {
  id: string;
  testDayId: string;   // Links to TestDay
  runNumber: number;
  timestamp: string;   // ISO date string
  track: string;
  drivers: string[];   // Array of driver names
  notes?: string;
  tags?: string[];     // Array of tags
  setupId?: string;    // Links to SetupSnapshot
  tireSetId?: string;  // Links to TireSet
}
```

### SetupSnapshot
```typescript
interface SetupSnapshot {
  id: string;
  name: string;
  timestamp: string;
  kvs: Record<string, any>;  // Key-value pairs for setup data
}
```

### TireSet
```typescript
interface TireSet {
  id: string;
  brand: string;
  compound: string;
  condition: string;
  notes?: string;
}
```

## Styling System

### Design Theme
The application uses a **racing telemetry aesthetic** with:
- **Primary Colors**: Dark backgrounds (#0A0A0A, #111111, #1A1A1A)
- **Accent Colors**: Neon green (#00FF66), cyan (#00E5FF), purple (#B066FF)
- **Text Colors**: White (#EAEAEA), gray (#CCCCCC)
- **Typography**: Monospace fonts for technical data

### Component Styling
- **Cards**: Dark gray backgrounds with subtle borders
- **Buttons**: Neon accent colors with hover effects
- **Tables**: Alternating row colors with hover states
- **Inputs**: Dark backgrounds with white text
- **Charts**: Racing-inspired color schemes

## Key Features

### 1. Test Day Management
- Create and manage test days
- Track runs per test day
- Link runs to setups and tire sets
- Import data from XRK files

### 2. Run Logging
- Log individual runs with metadata
- Associate runs with drivers, setups, and tires
- Add notes and tags for organization
- Edit and delete run data

### 3. Setup Tracking
- Create setup snapshots with key-value data
- Link setups to specific runs
- Format setup data for display
- Manage setup history

### 4. Tire Management
- Track tire sets with brand, compound, and condition
- Link tires to runs
- Monitor tire usage and condition

### 5. Telemetry Visualization
- F1-style dashboard with track map
- Real-time telemetry charts
- Sector timing displays
- Car system monitoring

### 6. Data Import/Export
- Import XRK files from local folders
- Parse test day folder structures
- Export data in various formats
- Sync with Google Drive (local approach)

### 7. Global Lookup
- Search across all test days and runs
- Filter by driver, setup, tires, and text
- Sort by date and run number
- Display comprehensive run information

## Performance Considerations

### State Management
- Uses React hooks for local state management
- Memoized calculations with `useMemo`
- Efficient filtering and sorting algorithms

### Rendering Optimization
- Conditional rendering to avoid unnecessary DOM updates
- Proper key props for list items
- Lazy loading for large datasets

### File Handling
- Efficient file reading with ArrayBuffer
- Progress tracking for large file operations
- Error handling for file processing

## Error Handling

### File Processing
- Graceful handling of corrupted XRK files
- Fallback to mock data when parsing fails
- Progress feedback for long operations

### User Input
- Validation for required fields
- Type checking for data inputs
- User-friendly error messages

### Network Operations
- Timeout handling for API calls
- Retry logic for failed operations
- Offline capability with local storage

## Security Considerations

### Data Privacy
- All data stored locally in browser
- No external API calls for sensitive data
- Environment variables for configuration

### File Access
- Uses webkitdirectory API for folder selection
- No server-side file processing
- Client-side only file operations

## Future Enhancements

### Backend Integration
- REST API for data persistence
- Database integration (PostgreSQL/MongoDB)
- User authentication and authorization

### Advanced Features
- Real-time telemetry streaming
- Advanced data analysis tools
- Export to MoTeC i2 Pro format
- Team collaboration features

### Performance Improvements
- Virtual scrolling for large datasets
- Web Workers for file processing
- Caching strategies for better performance

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Consistent naming conventions
- Comprehensive error handling

### Component Design
- Single responsibility principle
- Reusable UI components
- Proper prop typing
- Accessibility considerations

### Testing Strategy
- Unit tests for utility functions
- Integration tests for components
- End-to-end tests for user workflows
- Performance testing for large datasets
