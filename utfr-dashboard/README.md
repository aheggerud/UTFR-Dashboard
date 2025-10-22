# UTFR Race Engineering Dashboard

A comprehensive web application for managing Formula Student test day data, telemetry visualization, and team collaboration.

## 🏁 Overview

The UTFR Race Engineering Dashboard is a modern, web-based solution designed specifically for Formula Student teams to manage test day data, visualize telemetry, and track car performance. Built with Next.js 15, React 19, and TypeScript, it provides a professional racing telemetry aesthetic with powerful data management capabilities.

### Key Features

- **📊 Test Day Management**: Organize and track test sessions with detailed run logging
- **🔧 Setup Tracking**: Create and manage car setup snapshots with key-value data
- **🛞 Tire Management**: Track tire sets, conditions, and usage history
- **📈 F1-Style Telemetry**: Real-time telemetry visualization with track maps and car wireframes
- **☁️ Google Drive Integration**: Seamless data import from Google Drive folders
- **🔍 Global Lookup**: Search across all test days and runs with advanced filtering
- **👥 Team Collaboration**: Shared data access through Google Drive synchronization

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** (comes with Node.js)
- **Google Drive Desktop App** (for file synchronization)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/aheggerud/UTFR-Dashboard.git
   cd UTFR-Dashboard/utfr-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** to `http://localhost:3000`

### Google Drive Setup

1. **Install Google Drive Desktop App** from [drive.google.com](https://drive.google.com)
2. **Create folder structure**:
   ```
   Google Drive/
   └── UTFR Test Data/
       ├── 2025-4-11 - Villa/
       │   └── datadump/
       │       ├── run1.xrk
       │       └── run2.xrk
       └── 2025-4-15 - Brechin/
           └── datadump/
               └── run1.xrk
   ```
3. **Use the Drive Sync tab** to import your data

## 📚 Documentation

### Complete Documentation Suite

- **[Setup Guide](SETUP_GUIDE.md)** - Detailed installation and configuration instructions
- **[User Manual](USER_MANUAL.md)** - Comprehensive guide to all features and functionality
- **[Google Drive Guide](GOOGLE_DRIVE_GUIDE.md)** - File synchronization and data import setup
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Code Documentation](CODE_DOCUMENTATION.md)** - Technical implementation details

### Quick Reference

| Feature | Description | Location |
|---------|-------------|----------|
| **Test Day Management** | Create and manage test sessions | Runs Tab |
| **Run Logging** | Log individual runs with metadata | Runs Tab |
| **Setup Snapshots** | Track car configurations | Setup Tab |
| **Tire Management** | Monitor tire sets and conditions | Tires Tab |
| **Telemetry Visualization** | F1-style dashboard with charts | Telemetry Tab |
| **Data Import** | Import from Google Drive folders | Drive Sync Tab |
| **Global Search** | Search across all data | Lookup Tab |
| **System Admin** | Configuration and settings | Admin Tab |

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 15.5.4 with App Router
- **UI Framework**: React 19.1.0 with TypeScript 5
- **Styling**: Tailwind CSS 4 with custom racing theme
- **Components**: Radix UI primitives for accessibility
- **Charts**: Recharts 3.2.1 for data visualization
- **Animations**: Framer Motion 12.23.21
- **Icons**: Lucide React 0.544.0

### Project Structure

```
utfr-dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Main page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── UTFRDataDashboard.tsx    # Main dashboard
│   │   ├── F1TelemetryDashboard.tsx # Telemetry visualization
│   │   └── LocalGoogleDriveSync.tsx # File sync component
│   └── types/                # TypeScript definitions
├── public/                   # Static assets
├── docs/                    # Documentation files
└── package.json            # Dependencies and scripts
```

## 🎨 Design System

### Racing Telemetry Aesthetic

The dashboard features a professional racing telemetry theme:

- **Colors**: Dark backgrounds with neon accents (green, cyan, purple)
- **Typography**: Monospace fonts for technical data
- **Layout**: Grid-based responsive design
- **Components**: High-contrast, accessible UI elements

### Theme Colors

```css
/* Primary Colors */
--bg-primary: #0A0A0A      /* Main background */
--bg-secondary: #111111    /* Card backgrounds */
--bg-tertiary: #1A1A1A     /* Hover states */

/* Accent Colors */
--accent-green: #00FF66    /* Success, active states */
--accent-cyan: #00E5FF     /* Hover effects */
--accent-purple: #B066FF   /* Data highlights */

/* Text Colors */
--text-primary: #EAEAEA    /* Main text */
--text-secondary: #CCCCCC  /* Secondary text */
--text-muted: #999999      /* Muted text */
```

## 📊 Data Models

### Core Entities

#### TestDay
```typescript
interface TestDay {
  id: string;
  date: string;        // "YYYY-MM-DD"
  track: string;       // Venue name
  runs: number;        // Number of runs
}
```

#### Run
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

#### SetupSnapshot
```typescript
interface SetupSnapshot {
  id: string;
  name: string;
  timestamp: string;
  kvs: Record<string, any>;  // Key-value setup data
}
```

#### TireSet
```typescript
interface TireSet {
  id: string;
  brand: string;
  compound: string;
  condition: string;
  notes?: string;
}
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Development with Turbopack
npm run dev -- --turbopack
```

### Development Guidelines

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Configured for code quality
- **Prettier**: Code formatting (if configured)
- **Git Hooks**: Pre-commit checks (if configured)

### Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables

```bash
# .env.production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
```

### Deployment Options

- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative deployment platform
- **Docker**: Containerized deployment
- **Self-hosted**: Traditional server deployment

## 🤝 Team Collaboration

### Google Drive Workflow

1. **Shared Folder**: Create shared Google Drive folder
2. **Local Sync**: Each team member syncs folder locally
3. **Consistent Structure**: Maintain folder naming conventions
4. **Regular Updates**: Keep data synchronized across team

### Best Practices

- **Folder Naming**: Use consistent `YYYY-M-D - Venue` format
- **Data Backup**: Export data regularly
- **Version Control**: Track changes and updates
- **Communication**: Coordinate data entry with team

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Port 3000 in use** | Kill process or use different port |
| **Google Drive not syncing** | Restart Google Drive app |
| **Files not detected** | Check folder naming convention |
| **Import failures** | Check browser console for errors |
| **Performance issues** | Close unnecessary tabs, restart browser |

### Getting Help

1. **Check Documentation**: Review setup and troubleshooting guides
2. **Browser Console**: Check for JavaScript errors
3. **System Resources**: Monitor CPU and memory usage
4. **Contact Support**: Report issues with detailed information

## 📈 Roadmap

### Planned Features

- **Real-time Telemetry**: Live data streaming from car
- **Advanced Analytics**: Data analysis and visualization tools
- **Export Formats**: MoTeC i2 Pro integration
- **User Authentication**: Multi-user access control
- **API Integration**: REST API for external tools
- **Mobile App**: Companion mobile application

### Future Enhancements

- **Machine Learning**: Predictive analytics for performance
- **Cloud Storage**: Direct cloud integration
- **Collaboration Tools**: Real-time team collaboration
- **Advanced Filtering**: More sophisticated search options
- **Custom Dashboards**: User-configurable layouts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **University of Toronto Formula Racing** - For the project requirements and feedback
- **Next.js Team** - For the excellent React framework
- **Radix UI** - For accessible component primitives
- **Tailwind CSS** - For the utility-first CSS framework
- **Recharts** - For beautiful chart components

## 📞 Support

- **Documentation**: [Full Documentation Suite](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: [support@utfr.ca](mailto:support@utfr.ca)

---

**Built with ❤️ for the University of Toronto Formula Racing Team**

*For detailed setup instructions, feature usage, and troubleshooting, please refer to the complete documentation suite.*