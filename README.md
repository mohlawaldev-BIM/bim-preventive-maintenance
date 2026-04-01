# BIM Preventive Maintenance System

A full-stack web application that transforms static BIM (Building Information Modelling) models into a **living, intelligent maintenance engine**. Upload any IFC file, extract building assets automatically, and manage preventive maintenance schedules — all from a single dashboard.

---

## The Problem

In most construction projects, BIM models are heavily used during design and construction — then **abandoned** once the building is handed over. Facility managers fall back to manual logs, spreadsheets, and reactive maintenance. The result:

- Higher operational costs
- Unexpected equipment failures
- Poor asset lifecycle management
- Critical data locked inside unused 3D models

## The Solution

This system bridges the gap between BIM and Facility Management by:

- Parsing real IFC files and extracting physical building assets
- Automatically calculating maintenance schedules per asset category
- Generating work orders before failures occur
- Providing a live dashboard with analytics and reporting

> *"A smart system that turns a BIM model into a living maintenance engine"*

---

## Live Demo

> Upload any IFC file → configure asset categories → run maintenance checks → generate work orders → export PDF reports

---

## Features

### Core
- **IFC File Upload** — drag and drop any IFC 2x3 or IFC4 file
- **Smart Asset Extraction** — dynamically discovers all physical asset types in any IFC file
- **Multi-Project Support** — manage multiple buildings simultaneously, switch between projects with full data isolation
- **Maintenance Engine** — automatically calculates next due dates, flags overdue and due-soon assets
- **Work Order Generation** — auto-generates prioritised work orders for overdue and due-soon assets
- **PDF Export** — generates downloadable maintenance reports

### Dashboard
- Total asset count, overdue, due soon, and healthy stats
- Work order summary with high/medium priority breakdown
- Most urgent assets panel

### Asset Management
- Paginated asset list (20 per page)
- Filter by status (healthy, due soon, overdue)
- Filter by category
- Per-project category configuration

### Analytics
- Asset health breakdown (pie chart)
- Work order status (bar chart)
- Assets by category (bar chart)
- Key insights: most critical category, maintenance coverage %, resolved orders

### Category Configuration
- Global category filter modal — select only the asset categories relevant to your workflow
- Per-project category memory — each project remembers its own category selection
- Persists across page refreshes via localStorage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4, TanStack Query |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| BIM Parser | Python 3, IfcOpenShell |
| PDF Generation | PDFKit |
| Notifications | react-hot-toast |
| Charts | Recharts |

---

## System Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend                  │
│  Dashboard · Assets · Work Orders · Analytics│
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│            Node.js + Express                 │
│  /api/assets · /api/workorders · /api/upload │
│  /api/projects · /api/export                 │
└──────┬───────────────────────┬──────────────┘
       │                       │
┌──────▼──────┐      ┌────────▼────────┐
│ PostgreSQL  │      │  Python Parser   │
│  projects   │      │  IfcOpenShell    │
│  assets     │      │  IFC → Assets    │
│ work_orders │      └─────────────────┘
└─────────────┘
```

---

## Project Structure

```
bim-maintenance-system/
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── Analytics.jsx
│   │   │   ├── AssetCard.jsx
│   │   │   ├── CategoryConfigModal.jsx
│   │   │   ├── CategoryDropdown.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── ProjectSwitcher.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── UploadIFC.jsx
│   │   │   └── WorkOrders.jsx
│   │   ├── context/           # React context
│   │   │   ├── CategoryContext.jsx
│   │   │   └── ProjectContext.jsx
│   │   ├── api/               # API helpers
│   │   │   └── index.js
│   │   └── App.jsx
│   └── package.json
│
├── backend/                   # Node.js API server
│   ├── config/
│   │   └── db.js              # PostgreSQL connection
│   ├── engine/
│   │   └── maintenanceEngine.js  # Maintenance scheduling logic
│   ├── routes/
│   │   ├── assets.js
│   │   ├── export.js
│   │   ├── projects.js
│   │   ├── upload.js
│   │   └── workOrders.js
│   ├── state.js               # Parsing state lock
│   └── server.js
│
└── ifc-parser/                # Python IFC parser
    └── parser.py
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/bim-maintenance-system.git
cd bim-maintenance-system
```

### 2. Set up the database

```bash
psql -U postgres
```

```sql
CREATE DATABASE bim_maintenance;
\q
```

```bash
psql -U postgres -d bim_maintenance
```

```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE assets (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  guid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  location VARCHAR(255),
  manufacturer VARCHAR(255),
  installation_date DATE,
  maintenance_interval INTEGER DEFAULT 90,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  days_until_due INTEGER,
  status VARCHAR(50) DEFAULT 'healthy',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, guid)
);

CREATE TABLE work_orders (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### 3. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=bim_maintenance
DB_PASSWORD=your_password_here
DB_PORT=5432
```

Start the backend:

```bash
npm run dev
```

### 4. Set up the Python parser

```bash
cd ../ifc-parser
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux
pip install ifcopenshell requests
```

### 5. Set up the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## How to Use

### 1. Upload an IFC File
Navigate to the **Upload** tab. Drag and drop any `.ifc` file or click to browse. The system will automatically extract all physical assets.

### 2. Configure Categories
After upload, a modal opens showing all discovered asset categories. Select only the categories relevant to your maintenance workflow.

### 3. Run Maintenance Check
Click **Run Check** in the header. The system calculates the status of every asset based on its last maintenance date and interval.

### 4. Generate Work Orders
Click **Generate Work Orders**. The system creates prioritised work orders for all overdue and due-soon assets.

### 5. Manage Work Orders
Navigate to the **Work Orders** tab. Filter by priority, mark orders as complete. Completing a work order automatically updates the asset's maintenance date.

### 6. Export Report
Click **Export PDF** to download a full work orders report for the active project and selected categories.

### 7. Switch Projects
Use the **project switcher** dropdown in the header to switch between uploaded IFC files. Each project retains its own assets, work orders, and category selections independently.

---

## Maintenance Intervals by Category

| Category | Interval | Reason |
|---|---|---|
| FlowTerminal (MEP) | 90 days | High-use plumbing/electrical fixtures |
| BuildingElementProxy | 90 days | Generic equipment — treated as critical |
| Door / Window | 180 days | Mechanical wear on hinges, seals |
| Roof / CurtainWall | 180 days | Weather exposure |
| Stair / Railing | 180 days | Safety-critical elements |
| Furniture | 365 days | Low wear, annual inspection |
| Column / Member | 365 days | Structural — periodic inspection |
| Wall / Slab | 730 days | Structural — biannual inspection |

---

## IFC Compatibility

The parser dynamically discovers asset types in any IFC file. It has been tested with:

- IFC2x3 (Revit, ArchiCAD exports)
- IFC4 (modern exports)
- Architectural models
- Structural models
- MEP/building services models

The system correctly excludes geometry, relationship objects, property sets, material definitions, and type definitions — extracting only physical, maintainable building elements.

---

## Research Context

This project directly addresses a documented gap in the Architecture, Engineering and Construction (AEC) industry:

**Research topics this project supports:**
- *"Improving Facility Management using BIM-based Maintenance Systems"*
- *"Integration of BIM and Preventive Maintenance for Lifecycle Efficiency"*
- *"Data-driven Asset Management in BIM Environments"*

**Industry context:**
- The global Facility Management market exceeds $1 trillion annually
- Studies show 60-80% of a building's lifecycle cost occurs during operation and maintenance
- BIM adoption in FM remains below 30% despite widespread use in design/construction

This system demonstrates a practical, software-engineering approach to closing that gap.

---

## Future Enhancements

- **User authentication** — multi-user support with login/signup
- **AI predictive maintenance** — predict failure windows from historical data
- **3D BIM viewer** — click an asset in the dashboard to highlight it in the model
- **Email/SMS notifications** — alert facility managers before maintenance is due
- **Mobile app** — field technician interface for completing work orders on-site
- **Speckle/Autodesk Platform Services integration** — real-time BIM data streaming

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

Built as part of a Master's scholarship application in BIM and Digital Construction.

*Combining frontend engineering with BIM domain expertise to solve real facility management challenges.*
