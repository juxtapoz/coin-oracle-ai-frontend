# Coin Oracle AI Frontend

The frontend application for Coin Oracle AI, an intelligent cryptocurrency analysis platform. Built with Angular 18 and Material Design, featuring a modern dark theme and neural network visualization.

## Features

- Modern, responsive UI with dark theme
- Blockchain token search and validation
- Neural network background animation
- Material Design components
- Standalone Angular components architecture

## Tech Stack

- Angular 18
- Angular Material
- SCSS
- TypeScript

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
ng serve
```

3. Navigate to `http://localhost:4200/`

## Project Structure

```
src/
├── app/
│   ├── components/     # Shared components
│   ├── pages/         # Page components
│   └── services/      # API services
├── assets/           # Static assets
└── styles/          # Global styles
```

## Development

The application uses Angular's standalone components and the latest Material Design patterns. The dark theme is customized for a neural/oracle aesthetic with subtle animated background effects.

## Building for Production

To build the application for production:

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.
