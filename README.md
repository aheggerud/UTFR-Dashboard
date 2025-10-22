# UTFR Race Engineering Dashboard

A comprehensive web application for managing Formula Student test day data, telemetry visualization, and team collaboration for the University of Toronto Formula Racing (UTFR) team.

## 🏁 Project Overview

This repository contains the complete UTFR Race Engineering Dashboard - a modern, web-based solution designed specifically for Formula Student teams to manage test day data, visualize telemetry, and track car performance. Built with Next.js 15, React 19, and TypeScript, it provides a professional racing telemetry aesthetic with powerful data management capabilities.

## 📁 Repository Structure

```
UTFR-Dashboard/
├── utfr-dashboard/                    # Main Next.js application
│   ├── src/                          # Source code
│   │   ├── app/                      # Next.js App Router
│   │   ├── components/               # React components
│   │   └── lib/                      # Utility functions
│   ├── public/                       # Static assets
│   ├── docs/                         # Documentation
│   └── package.json                  # Dependencies and scripts
├── utfr_data_management_dashboard_prototype.tsx  # Development prototype
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** (comes with Node.js)
- **Git** (for version control)
- **Google Drive Desktop App** (for file synchronization)

### Installation & Setup

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

## 🎯 Key Features

- **📊 Test Day Management**: Organize and track test sessions with detailed run logging
- **🔧 Setup Tracking**: Create and manage car setup snapshots with key-value data
- **🛞 Tire Management**: Track tire sets, conditions, and usage history
- **📈 F1-Style Telemetry**: Real-time telemetry visualization with track maps and car wireframes
- **☁️ Google Drive Integration**: Seamless data import from Google Drive folders
- **🔍 Global Lookup**: Search across all test days and runs with advanced filtering
- **👥 Team Collaboration**: Shared data access through Google Drive synchronization

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.5.4 with App Router
- **UI Framework**: React 19.1.0 with TypeScript 5
- **Styling**: Tailwind CSS 4 with custom racing theme
- **Components**: Radix UI primitives for accessibility
- **Charts**: Recharts 3.2.1 for data visualization
- **Animations**: Framer Motion 12.23.21
- **Icons**: Lucide React 0.544.0
- **Desktop**: Electron 38.2.2 for desktop app support

## 📚 Documentation

### Complete Documentation Suite

The main application includes comprehensive documentation in the `utfr-dashboard/` folder:

- **[README.md](utfr-dashboard/README.md)** - Detailed project overview and features
- **[SETUP_GUIDE.md](utfr-dashboard/SETUP_GUIDE.md)** - Step-by-step installation instructions
- **[USER_MANUAL.md](utfr-dashboard/USER_MANUAL.md)** - Complete feature usage guide
- **[GOOGLE_DRIVE_GUIDE.md](utfr-dashboard/GOOGLE_DRIVE_GUIDE.md)** - File synchronization setup
- **[TROUBLESHOOTING.md](utfr-dashboard/TROUBLESHOOTING.md)** - Common issues and solutions
- **[CODE_DOCUMENTATION.md](utfr-dashboard/CODE_DOCUMENTATION.md)** - Technical implementation details

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

## 🎨 Design System

### Racing Telemetry Aesthetic

The dashboard features a professional racing telemetry theme:
- **Colors**: Dark backgrounds with neon accents (green, cyan, purple)
- **Typography**: Monospace fonts for technical data
- **Layout**: Grid-based responsive design
- **Components**: High-contrast, accessible UI elements

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server (with Turbopack)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Desktop App
npm run electron     # Run as Electron desktop app
```

### Development Guidelines

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Configured for code quality
- **Git Hooks**: Pre-commit checks (if configured)
- **Turbopack**: Fast development builds enabled

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

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Deployment Options

- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative deployment platform
- **Docker**: Containerized deployment
- **Self-hosted**: Traditional server deployment
- **Electron**: Desktop application distribution

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



## 🙏 Acknowledgments

- **University of Toronto Formula Racing** - For the project requirements and feedback
- **Next.js Team** - For the excellent React framework
- **Radix UI** - For accessible component primitives
- **Tailwind CSS** - For the utility-first CSS framework
- **Recharts** - For beautiful chart components

## 📞 Support

- **Documentation**: [Complete Documentation Suite](utfr-dashboard/)
- **Issues**: [GitHub Issues](https://github.com/aheggerud/UTFR-Dashboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aheggerud/UTFR-Dashboard/discussions)
- **Email**: [support@utfr.ca](mailto:support@utfr.ca)

---

**Built with ❤️ for the University of Toronto Formula Racing Team**

*For detailed setup instructions, feature usage, and troubleshooting, please refer to the complete documentation suite in the `utfr-dashboard/` folder.*
