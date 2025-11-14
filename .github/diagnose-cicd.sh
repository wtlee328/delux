#!/bin/bash

# CI/CD Diagnostic Script
# This script checks if GitHub Actions CI/CD is properly configured

echo "=========================================="
echo "CI/CD Diagnostic Check"
echo "=========================================="
echo ""

# Check 1: Workflow files exist
echo "✓ Check 1: Workflow Files"
echo "-----------------------------------"
if [ -d ".github/workflows" ]; then
    echo "✓ .github/workflows directory exists"
    echo ""
    echo "Workflow files:"
    ls -1 .github/workflows/*.yml 2>/dev/null || echo "  No workflow files found!"
    echo ""
else
    echo "❌ .github/workflows directory not found!"
    exit 1
fi

# Check 2: Workflows are pushed to GitHub
echo "✓ Check 2: Workflows on GitHub"
echo "-----------------------------------"
REMOTE_WORKFLOWS=$(git ls-tree -r origin/main --name-only | grep "\.github/workflows" | wc -l)
if [ "$REMOTE_WORKFLOWS" -gt 0 ]; then
    echo "✓ Found $REMOTE_WORKFLOWS workflow(s) on GitHub"
    git ls-tree -r origin/main --name-only | grep "\.github/workflows"
    echo ""
else
    echo "❌ No workflows found on GitHub!"
    echo "Run: git push origin main"
    exit 1
fi

# Check 3: Recent commits
echo "✓ Check 3: Recent Commits"
echo "-----------------------------------"
echo "Last 3 commits:"
git log --oneline -3 2>/dev/null || echo "Unable to read git log"
echo ""

# Check 4: Check if workflows should have triggered
echo "✓ Check 4: Recent Changes"
echo "-----------------------------------"
LAST_COMMIT=$(git log -1 --format="%H" 2>/dev/null)
if [ -n "$LAST_COMMIT" ]; then
    echo "Last commit: $LAST_COMMIT"
    echo ""
    echo "Files changed in last commit:"
    git diff-tree --no-commit-id --name-only -r $LAST_COMMIT | head -10
    echo ""
    
    # Check if backend or frontend files changed
    BACKEND_CHANGES=$(git diff-tree --no-commit-id --name-only -r $LAST_COMMIT | grep "^backend/" | wc -l)
    FRONTEND_CHANGES=$(git diff-tree --no-commit-id --name-only -r $LAST_COMMIT | grep "^frontend/" | wc -l)
    
    if [ "$BACKEND_CHANGES" -gt 0 ]; then
        echo "✓ Backend changes detected ($BACKEND_CHANGES files)"
        echo "  → Should trigger: Deploy Backend workflow"
    fi
    
    if [ "$FRONTEND_CHANGES" -gt 0 ]; then
        echo "✓ Frontend changes detected ($FRONTEND_CHANGES files)"
        echo "  → Should trigger: Deploy Frontend workflow"
    fi
    
    if [ "$BACKEND_CHANGES" -eq 0 ] && [ "$FRONTEND_CHANGES" -eq 0 ]; then
        echo "ℹ️  No backend or frontend changes in last commit"
        echo "  → Workflows will not trigger automatically"
    fi
    echo ""
fi

# Check 5: Workflow syntax
echo "✓ Check 5: Workflow Syntax"
echo "-----------------------------------"
for workflow in .github/workflows/*.yml; do
    if [ -f "$workflow" ]; then
        echo "Checking: $(basename $workflow)"
        
        # Check for required fields
        if grep -q "^on:" "$workflow"; then
            echo "  ✓ Has 'on:' trigger"
        else
            echo "  ❌ Missing 'on:' trigger"
        fi
        
        if grep -q "jobs:" "$workflow"; then
            echo "  ✓ Has 'jobs:' section"
        else
            echo "  ❌ Missing 'jobs:' section"
        fi
        
        # Check for secrets usage
        SECRET_COUNT=$(grep -c '\${{ secrets\.' "$workflow" || echo "0")
        echo "  ℹ️  Uses $SECRET_COUNT secret(s)"
        
        echo ""
    fi
done

# Check 6: GitHub CLI status (if available)
echo "✓ Check 6: GitHub Actions Status"
echo "-----------------------------------"
if command -v gh &> /dev/null; then
    echo "Checking recent workflow runs..."
    gh run list --limit 5 2>/dev/null || echo "Unable to fetch workflow runs (may need: gh auth login)"
    echo ""
else
    echo "ℹ️  GitHub CLI not installed"
    echo "Install with: brew install gh"
    echo "Then run: gh auth login"
    echo ""
fi

# Summary and Next Steps
echo "=========================================="
echo "Summary & Next Steps"
echo "=========================================="
echo ""

# Determine what to do next
if [ "$BACKEND_CHANGES" -gt 0 ] || [ "$FRONTEND_CHANGES" -gt 0 ]; then
    echo "✅ Workflows should have triggered!"
    echo ""
    echo "Check GitHub Actions:"
    echo "  https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
    echo ""
    echo "If no workflows ran, check:"
    echo "  1. GitHub Secrets are configured"
    echo "  2. Workflows are enabled in repo settings"
    echo "  3. Branch protection rules don't block Actions"
else
    echo "ℹ️  No backend/frontend changes detected"
    echo ""
    echo "To trigger workflows:"
    echo ""
    echo "Option 1: Make a change and push"
    echo "  echo '// test' >> backend/src/index.ts"
    echo "  git add backend/src/index.ts"
    echo "  git commit -m 'test: trigger CI/CD'"
    echo "  git push origin main"
    echo ""
    echo "Option 2: Manual trigger"
    echo "  1. Go to: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
    echo "  2. Select a workflow"
    echo "  3. Click 'Run workflow'"
    echo ""
fi

echo "Troubleshooting:"
echo "  • View this guide: .github/CICD-SETUP.md"
echo "  • Check secrets: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/settings/secrets/actions"
echo "  • View logs: gh run list (requires gh CLI)"
echo ""
