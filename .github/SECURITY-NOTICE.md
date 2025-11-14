# 🔐 Security Notice

## ⚠️ IMPORTANT: Service Account Keys

**NEVER commit service account key files to this repository!**

### Protected Files

The following files should NEVER be committed:
- `*-key.json`
- `*-keyfile.json`
- `github-actions-key.json`
- `firebase-github-actions-key.json`
- Any file in `.github/` ending in `.json`

### What to Do If You Accidentally Commit Keys

If you accidentally commit service account keys:

1. **DO NOT PUSH** - GitHub will block the push (as you saw)
2. **Remove from git:**
   ```bash
   git rm --cached .github/*-key.json
   rm .github/*-key.json
   git commit -m "security: remove service account keys"
   ```

3. **Revoke the compromised keys:**
   ```bash
   # List keys
   gcloud iam service-accounts keys list \
       --iam-account=SERVICE_ACCOUNT_EMAIL
   
   # Delete compromised key
   gcloud iam service-accounts keys delete KEY_ID \
       --iam-account=SERVICE_ACCOUNT_EMAIL
   ```

4. **Generate new keys:**
   ```bash
   cd .github
   ./setup-cicd.sh
   ```

5. **Update GitHub secrets** with new keys

### If Keys Were Already Pushed to GitHub

If keys were pushed to a public repository:

1. **Immediately revoke the keys** (see above)
2. **Generate new keys** (see above)
3. **Update GitHub secrets**
4. **Consider the keys compromised** - they may have been scraped by bots
5. **Review GCP audit logs** for unauthorized access
6. **Notify your security team** if applicable

### Protected by .gitignore

The `.gitignore` file includes these patterns:
```
*-key.json
*-keyfile.json
github-actions-key.json
firebase-github-actions-key.json
.github/*.json
.github/*-key.json
```

### GitHub Push Protection

GitHub's push protection will automatically block pushes containing:
- Google Cloud service account credentials
- AWS credentials
- Private keys
- API tokens
- Other sensitive data

### Best Practices

1. ✅ **Always use GitHub Secrets** for sensitive data
2. ✅ **Delete key files** immediately after adding to GitHub Secrets
3. ✅ **Never commit** `.env` files with real credentials
4. ✅ **Use environment variables** for local development
5. ✅ **Rotate keys regularly** (every 90 days)
6. ✅ **Use least privilege** - grant minimal permissions
7. ✅ **Enable audit logging** in GCP
8. ✅ **Review .gitignore** before committing

### Checking for Secrets

Before committing, check for secrets:

```bash
# Check what will be committed
git diff --cached

# Search for potential secrets
git diff --cached | grep -E "(private_key|client_email|project_id)"

# Use git-secrets (optional)
git secrets --scan
```

### Setup Reminder

When setting up CI/CD:

1. ✅ Run `./setup-cicd.sh`
2. ✅ Copy keys to GitHub Secrets
3. ✅ **DELETE local key files immediately**
4. ✅ Verify files are deleted: `ls .github/*.json`
5. ✅ Never commit the keys

### Emergency Contacts

If you suspect a security breach:

1. **Revoke all service account keys immediately**
2. **Check GCP audit logs** for unauthorized access
3. **Notify team lead/security team**
4. **Review all recent deployments**
5. **Consider rotating all secrets**

### Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [GCP Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [Managing Service Account Keys](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)

---

**Remember:** When in doubt, DON'T commit it. Use GitHub Secrets instead! 🔒
