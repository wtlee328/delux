#!/bin/bash

# Script to fix GitHub authentication issues on macOS

echo "=========================================="
echo "GitHub Authentication Fix"
echo "=========================================="
echo ""

echo "Current git configuration:"
echo "Username: $(git config user.name)"
echo "Email: $(git config user.email)"
echo "Remote: $(git remote get-url origin)"
echo ""

echo "Choose an option:"
echo "1. Clear macOS Keychain credentials (quick fix)"
echo "2. Switch to SSH authentication (recommended)"
echo "3. Setup Personal Access Token"
echo "4. Exit"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo ""
    echo "Clearing macOS Keychain credentials..."
    echo ""
    echo "Run these commands manually:"
    echo ""
    echo "git credential-osxkeychain erase"
    echo "host=github.com"
    echo "protocol=https"
    echo ""
    echo "Then press Enter twice (once after the blank line)"
    echo ""
    echo "After that, try: git push origin main"
    echo "You'll be prompted for your GitHub username and password/token"
    ;;
    
  2)
    echo ""
    echo "Setting up SSH authentication..."
    echo ""
    
    # Check for existing SSH key
    if [ -f ~/.ssh/id_ed25519.pub ]; then
      echo "✓ SSH key already exists"
      echo ""
      echo "Your public key:"
      cat ~/.ssh/id_ed25519.pub
      echo ""
    else
      echo "No SSH key found. Creating one..."
      read -p "Enter your email: " email
      ssh-keygen -t ed25519 -C "$email"
      echo ""
      echo "✓ SSH key created"
      echo ""
      echo "Your public key:"
      cat ~/.ssh/id_ed25519.pub
      echo ""
    fi
    
    echo "Next steps:"
    echo "1. Copy the public key above"
    echo "2. Go to: https://github.com/settings/keys"
    echo "3. Click 'New SSH key'"
    echo "4. Paste the key and save"
    echo ""
    read -p "Press Enter after adding the key to GitHub..."
    
    # Update remote to SSH
    echo ""
    echo "Updating remote to use SSH..."
    git remote set-url origin git@github.com:wtlee328/delux.git
    echo "✓ Remote updated"
    echo ""
    
    # Test connection
    echo "Testing SSH connection..."
    ssh -T git@github.com
    echo ""
    
    echo "✓ Setup complete! Try: git push origin main"
    ;;
    
  3)
    echo ""
    echo "Setting up Personal Access Token..."
    echo ""
    echo "1. Go to: https://github.com/settings/tokens/new"
    echo "2. Note: 'Delux+ Deployment'"
    echo "3. Expiration: 90 days"
    echo "4. Select scopes: repo, workflow"
    echo "5. Click 'Generate token'"
    echo "6. Copy the token (you won't see it again!)"
    echo ""
    echo "When you push, use:"
    echo "  Username: wtlee328"
    echo "  Password: [paste your token]"
    echo ""
    echo "The token will be saved in macOS Keychain for future use"
    ;;
    
  4)
    echo "Exiting..."
    exit 0
    ;;
    
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "=========================================="
