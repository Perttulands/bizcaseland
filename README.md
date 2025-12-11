# 📊 Bizcaseland

> An AI-first business analysis platform for data-driven decision making

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 What is Bizcaseland?

Bizcaseland is an innovative platform that combines AI capabilities with sophisticated financial and market analysis tools. It's designed to help business analysts, strategists, and decision-makers evaluate new opportunities and business areas through a data-driven workflow:

1. **Export** JSON templates from the platform
2. **Populate** them with AI assistance (ChatGPT, Claude, etc.) including comprehensive rationales
3. **Import** back to visualize, analyze, and make informed decisions

## ✨ Key Features

### 💼 Business Case Analyzer (`/business`)

Transform financial projections into actionable insights:

- **Cash Flow Analysis** - Detailed revenue, cost, and investment tracking with visual timeline
- **Financial Metrics** - NPV, IRR, ROI, payback period calculations
- **Sensitivity Analysis** - Understand how key variables impact outcomes
- **Scenario Planning** - Compare optimistic, base, and pessimistic scenarios
- **Volume Analysis** - Track unit economics and customer acquisition patterns
- **PDF Export** - Generate professional reports for stakeholders

### 🎯 Market Analysis Suite (`/market`)

Comprehensive market intelligence at your fingertips:

- **Market Sizing** - TAM, SAM, SOM calculations with bottom-up and top-down methodologies
- **Competitive Intelligence** - Analyze market share, competitive positioning, and SWOT
- **Customer Segmentation** - Deep dive into target segments with persona analysis
- **Strategic Planning** - Entry strategies, positioning, and go-to-market recommendations
- **Opportunity Assessment** - Risk analysis and strategic imperatives
- **Data Visualization** - Interactive charts powered by Recharts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Perttulands/bizcaseland.git
cd bizcaseland

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

Visit `http://localhost:5173` to see the app in action.

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
npm run lint         # Lint code
```

## 🏗️ Architecture

Bizcaseland follows a modular, feature-based architecture:

```
src/
├── core/                   # Core infrastructure
│   ├── types/             # Centralized type system
│   ├── contexts/          # React Context providers
│   ├── services/          # Business logic services
│   └── engine/            # Calculation engine
├── modules/               # Feature modules
│   ├── business-case/     # Business case analyzer
│   └── market-analysis/   # Market analysis suite
├── components/            # Reusable components
│   ├── common/           # Shared feature components
│   ├── features/         # Feature-specific shared
│   ├── landing/          # Landing page components
│   └── ui/               # shadcn/ui components
└── pages/                # Route pages
```

### Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Routing**: React Router v6
- **State Management**: React Context + localStorage
- **PDF Generation**: jsPDF
- **Testing**: Vitest + Testing Library

## 📖 Usage

### Business Case Analysis

1. Navigate to `/business`
2. **Import Data**: Click "Data Management" tab, paste your JSON, or use sample data
3. **Review Cash Flow**: See monthly projections with visual timeline
4. **Analyze Metrics**: View NPV, IRR, and other financial indicators
5. **Test Scenarios**: Adjust assumptions and run sensitivity analysis
6. **Export**: Generate PDF reports for presentations

### Market Analysis

1. Navigate to `/market`
2. **Import Data**: Load your market analysis JSON
3. **Market Sizing**: Review TAM/SAM/SOM calculations
4. **Competitive Analysis**: Explore competitive landscape
5. **Customer Segments**: Analyze target customer profiles
6. **Strategic Insights**: Review recommendations and opportunities

## 📁 Sample Data

The platform includes comprehensive sample datasets in `public/sample-data/`:

**Business Cases:**
- SaaS Platform Revenue Growth
- IoT Product Launch
- Payroll Automation Cost Savings

**Market Analysis:**
- EV Charging Market (Europe)
- Healthcare AI Analytics Platform

Load these examples to explore the full capabilities of each tool.

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

Test coverage includes:
- Unit tests for calculation engines
- Component tests for UI elements
- Integration tests for data flows
- Validation tests for JSON schemas

## 🎨 Design System

Bizcaseland uses a comprehensive design system built on:

- **HSL Color Variables** - Defined in `src/index.css`
- **Tailwind Configuration** - Extended in `tailwind.config.ts`
- **shadcn/ui Components** - Customized for the platform
- **Dark Mode Support** - Built-in theme switching

## 🤝 Contributing

Contributions are welcome! This project is in active development. Feel free to:

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📝 License

MIT License - feel free to use this project for your own business analysis needs.

## 🙏 Acknowledgments

Built with:
- [React](https://reactjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

---

**Made with ❤️ for better business decisions**