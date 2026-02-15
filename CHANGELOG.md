# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Redux Toolkit + RTK Query app state/data architecture.
- Contributor baseline: CI workflow, issue templates, PR template.
- Developer documentation (`docs/DEVELOPER_GUIDE.md`, `docs/ARCHITECTURE.md`).

### Changed

- Startup theme boot now applies before React mount to prevent first-paint flicker.
- Tailwind/theme layer moved to `src/styles/tailwind.css`; `src/App.css` reduced to app-level resets.
- Editor extension class tokens moved to CSS variables for extensibility.

### Fixed

- PDF export color resolution fallback to avoid invalid color artifacts.
