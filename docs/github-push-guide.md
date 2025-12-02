# Git Commands to Push to GitHub

## Step 1: Initialize Git Repository
```bash
cd c:\Users\hasee\OneDrive\Desktop\etrack
git init
```

## Step 2: Add All Files
```bash
git add .
```

## Step 3: Create First Commit
```bash
git commit -m "Initial commit: GPS tracking platform with NestJS/Next.js

- Complete backend with NestJS
- Frontend with Next.js 14
- Multi-protocol GPS support (GT06, H02, TK103, Teltonika)
- Geofencing with PostGIS
- Advanced notifications and alerts
- Command & control system
- Comprehensive reporting
- Real-time tracking with WebSockets"
```

## Step 4: Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., "gps-tracking-platform")
3. **DO NOT** initialize with README, .gitignore, or license
4. Copy the repository URL (e.g., https://github.com/yourusername/gps-tracking-platform.git)

## Step 5: Add Remote and Push
```bash
# Replace YOUR_USERNAME and YOUR_REPO with your actual values
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Alternative: Using SSH
If you prefer SSH:
```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 6: Verify
Visit your GitHub repository to see all your code!

---

## Future Updates
After making changes:
```bash
git add .
git commit -m "Your commit message"
git push
```

## Important Notes
- ✅ .gitignore files are already created
- ✅ .env files will NOT be pushed (they're in .gitignore)
- ⚠️ Make sure to create a .env.example file with dummy values for others
