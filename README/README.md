# WSZLLP: Legal Case Management System

![WSZLLP Logo](/public/mainlogo.png)

## Overview

WSZLLP is a specialized case management platform designed specifically for eviction attorneys and property management law firms. It streamlines the entire legal process from case intake to resolution, with particular focus on eviction proceedings. The system centralizes case data, automates document generation, and provides comprehensive tracking of hearings, documents, and client interactions.

## Key Features

- **Case Management**: Track and manage eviction cases through their complete lifecycle
- **Calendar Integration**: Schedule and track hearings, deadlines, and appointments
- **Document Generation**: Create legal documents from customizable templates
- **Client Management**: Maintain client records and communication history
- **Invoice Tracking**: Generate and monitor invoices and payment plans
- **Workflow Automation**: Implement standardized workflows for common case types
- **Reporting & Analytics**: Generate insights from case and performance data
- **Data Import/Export**: Easily import and export data via Excel and CSV formats

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: Context API with custom hooks
- **Data Handling**: SheetJS (xlsx), PapaParse for data imports
- **UI Components**: Custom component library
- **Build Tool**: Vite
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/mgisrael393823/wszllp.git
   cd wszllp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Data Import Guide

WSZLLP supports importing data from both Excel (.xlsx) and CSV files. The import system is designed to be flexible and user-friendly.

### Excel Import

Upload a single Excel file containing the following worksheets:
- Complaints
- ALL EVICTIONS FILES
- Court 25 / Court 24
- ZOOM (for virtual hearing info)
- Summons
- PM INFO (for client/contact information)

### CSV Import

When using CSV import, you'll need to upload multiple files:
- complaints.csv or all-evictions.csv
- court-25.csv and/or court-24.csv
- zoom.csv (optional)
- pm-info.csv (optional)

## Project Structure

```
wszllp/
├── public/             # Static assets
├── src/
│   ├── components/     # UI components
│   │   ├── admin/      # Administrative components
│   │   ├── cases/      # Case management components
│   │   ├── dashboard/  # Dashboard components
│   │   ├── documents/  # Document management
│   │   ├── hearings/   # Hearing management
│   │   ├── invoices/   # Invoice components
│   │   ├── layout/     # Layout components
│   │   ├── ui/         # Reusable UI components
│   ├── context/        # Context providers
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   │   ├── dataImport/ # Data import utilities
├── README/             # Documentation and PRD
```

## Implementation Phases

The system is being implemented in phases:

### Phase 1: Core Foundation ✅
- Basic case management
- Client database
- Document storage
- Simple calendar functionality
- User management and security

### Phase 2: Advanced Features (Current)
- ✅ Automated Workflows
- ✅ Document Generation
- ✅ Calendar Integration
- ✅ Notification System
- ⏱️ Batch Processing

### Phase 3: Optimization and Integration (In Progress)
- ✅ E-filing integration (Implementation strategy complete, development starting)
- ⏱️ Advanced reporting and analytics
- ⏱️ Client portal
- ⏱️ Mobile application
- ⏱️ API for third-party integrations

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Documentation

For detailed documentation, see:
- [Product Requirements Document](./WSZLLP-PRD.md)
- [UI Component Task Tracker](../docs/UI_COMPONENT_TASK_TRACKER.md) - Tracks status, priority, and implementation phases of all UI components
- [E-Filing Integration Guide](../docs/api/e-filing/API-INTEGRATION-GUIDE.md) - Details on integrating with the Illinois e-filing system
- [E-Filing Implementation Strategy](../docs/api/e-filing/IMPLEMENTATION-STRATEGY.md) - Technical implementation plan for e-filing integration