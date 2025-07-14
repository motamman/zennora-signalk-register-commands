# Zennora SignalK Register Commands - Setup Status

## What We've Done So Far

1. ✅ **Created separate working directory**: `/Users/mauricetamman/Documents/zennora/signalk/zennora-signalk-register-commands`
2. ✅ **Copied files** from the main datastore repository
3. ✅ **Updated package.json** with proper repository links and additional keywords

## Current Status
- **Repository**: Ready for git initialization
- **Package.json**: Updated with GitHub repo links (mauricetamman/zennora-signalk-register-commands)
- **Files**: README.md, index.js, package.json all present
- **Version**: 0.5.0-alpha.1

## Next Steps to Complete

### 1. Git Setup
```bash
git init
git add .
git commit -m "Initial commit: SignalK register commands plugin"
git branch -M main
```

### 2. Create GitHub Repository
- Go to https://github.com/new
- Name: `zennora-signalk-register-commands`
- Description: "Plugin to register new command paths dynamically"
- Public repository
- Don't add README/gitignore/license (we have them)

### 3. Connect and Push
```bash
git remote add origin https://github.com/mauricetamman/zennora-signalk-register-commands.git
git push -u origin main
```

### 4. Test Package
```bash
npm pack
# This creates a .tgz file you can test installing elsewhere
```

### 5. Publish to NPM
```bash
npm whoami  # Verify you're logged in
npm publish --dry-run  # Test first
npm publish  # Actual publish
```

## Context for Claude Code
This is a **separate repository setup** following the approach from `PUBLISHING_TO_NPM_AND_ORGANIZING_GIT.md`. We're using **Option 1 (Separate Repositories) + Option A (Individual NPM Packages)** to publish each Zennora plugin as its own NPM package from its own GitHub repository.

## Original Location
This package was copied from: `/Users/mauricetamman/Documents/zennora/signalk/zennora-signalk-datastore/zennora-signalk-register-commands`

## Goal
Create a standalone, publishable NPM package that users can install with:
```bash
npm install zennora-signalk-register-commands
```