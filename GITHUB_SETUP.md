# GitHub Setup Guide

## Step 1: Create a GitHub Repository

1. Go to [https://github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in the details:
   - **Repository name**: `pet-care-app` (or your preferred name)
   - **Description**: "Full-stack pet care management application"
   - **Visibility**: Choose **Public** or **Private**
   - **⚠️ IMPORTANT**: Do NOT check "Initialize with README" (we already have one)
   - **⚠️ IMPORTANT**: Do NOT add .gitignore or license (we already have them)
4. Click **"Create repository"**

## Step 2: Copy Your Repository URL

After creating the repository, GitHub will show you a page with setup instructions. Copy the **HTTPS URL**. It will look like:
```
https://github.com/yourusername/pet-care-app.git
```

## Step 3: Connect and Push Your Code

Run these commands in your project directory:

```bash
# Add all files (respecting .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: PetCare application with full features"

# Rename branch to 'main' (if needed)
git branch -M main

# Add GitHub repository as remote (replace with YOUR URL)
git remote add origin https://github.com/yourusername/pet-care-app.git

# Push to GitHub
git push -u origin main
```

## Step 4: Verify

1. Go to your GitHub repository page
2. You should see all your files
3. Check that `node_modules/` and `*.db` files are NOT visible (they're in .gitignore)

---

## Making Future Changes

### Workflow for Updates

1. **Create a branch for your changes:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes and test them**

3. **Stage your changes:**
   ```bash
   git add .
   # or add specific files:
   git add path/to/file.js
   ```

4. **Commit with a clear message:**
   ```bash
   git commit -m "Add feature: description of what you added"
   ```

5. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request on GitHub:**
   - Go to your repository on GitHub
   - Click "Pull requests" → "New pull request"
   - Select your branch
   - Add description and create PR
   - Team members can review and merge

### Best Practices

✅ **DO:**
- Create branches for new features
- Write clear commit messages
- Test before committing
- Pull latest changes before starting work: `git pull origin main`
- Keep commits focused (one feature per commit)

❌ **DON'T:**
- Commit database files (`.db`)
- Commit `node_modules/`
- Commit sensitive data (passwords, API keys)
- Commit directly to `main` branch (use branches)
- Force push to main branch

### Common Commands

```bash
# Check status
git status

# See what changed
git diff

# Pull latest changes
git pull origin main

# Switch branches
git checkout main
git checkout feature/new-feature

# See commit history
git log

# Undo changes (before committing)
git checkout -- filename

# Update .gitignore and remove tracked files
git rm --cached filename
```

---

## Troubleshooting

### If you get "remote origin already exists":
```bash
git remote remove origin
git remote add origin https://github.com/yourusername/pet-care-app.git
```

### If you need to update .gitignore:
```bash
# Edit .gitignore, then:
git rm --cached -r node_modules/
git rm --cached backend/pet_care.db
git add .gitignore
git commit -m "Update .gitignore"
```

### If you want to start fresh:
```bash
git add .
git commit -m "Your message"
git push origin main
```

---

## Team Collaboration

### For Team Members (Cloning the Repository)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/pet-care-app.git
   cd pet-care-app
   ```

2. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Start developing:**
   - Create a branch for your work
   - Make changes
   - Push and create PR

---

## Need Help?

- GitHub Docs: https://docs.github.com
- Git Basics: https://git-scm.com/book

