# Contributing to ROADWISE

Thank you for your interest in contributing to **ROADWISE**, the browser-based 3D Indian traffic awareness and motorcycle delivery simulation game!

---

## 1. Code of Conduct
We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please treat all contributors with respect.

---

## 2. Development Setup

### Prerequisites
- **Node.js**: v20.x or v22.x+
- **npm**: v10.x+
- A modern browser with WebGL 2.0 support (Chrome, Edge, Firefox, Safari).

### Getting Started
```bash
# 1. Clone the repository
git clone https://github.com/karthibaraniofficial-wq/ROADWISE-GAME.git
cd ROADWISE-GAME

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
# -> Opens http://localhost:5173/ with live hot-reloading
```

---

## 3. Testing & Verification

Before submitting any Pull Request:
```bash
# Run the 16 automated test suites
npm test

# Verify production build compilation
npm run build
```

All 16 test suites must pass without errors, and the production build must compile with zero syntax or bundling errors.

---

## 4. Pull Request Guidelines
1. Fork the repo and create your feature branch: `git checkout -b feat/your-feature-name`.
2. Commit your changes with a descriptive message following Conventional Commits (`feat:`, `fix:`, `docs:`, `perf:`).
3. Push to your branch: `git push origin feat/your-feature-name`.
4. Open a Pull Request pointing to `master`. Describe what was changed, why, and how you verified it.
