# Frontend Troubleshooting Guide

Common issues and solutions for the Delux+ frontend application.

## JSON Parse Errors

### Symptom
```
SyntaxError: "undefined" is not valid JSON
```

### Cause
Corrupted data in browser's localStorage, typically from:
- Interrupted login process
- Browser extension interference
- Development/testing with incomplete data

### Solutions

**Option 1: Use the Clear Storage Tool**
1. Navigate to `/clear-storage.html`
2. Click "Clear Storage & Reload"
3. Log in again

**Option 2: Manual Browser Console**
```javascript
// Open browser console (F12) and run:
localStorage.removeItem('token');
localStorage.removeItem('user');
location.reload();
```

**Option 3: Clear All Site Data**
1. Open browser DevTools (F12)
2. Go to Application tab
3. Click "Clear site data"
4. Reload the page

### Prevention
The application now includes validation to prevent storing invalid data. This error should not occur in normal usage after the fix.

## Login Issues

### Cannot Login / Stuck on Login Page

**Check Backend Connection:**
```bash
# Verify backend is running
curl http://localhost:3000/health

# Should return: {"status":"ok"}
```

**Check Environment Variables:**
```bash
# frontend/.env.development
VITE_API_BASE_URL=http://localhost:3000
```

**Check Browser Console:**
- Open DevTools (F12)
- Look for network errors
- Check for CORS errors

### "Invalid credentials" Error

**Verify User Exists:**
```sql
-- Connect to database
SELECT email, role FROM users WHERE email = 'your-email@example.com';
```

**Reset Password (if needed):**
```bash
cd backend
npm run seed:admin  # Creates/resets admin user
```

## Image Upload Issues

### Images Not Uploading

**Check File Size:**
- Maximum file size: 5MB
- Supported formats: JPG, PNG, WebP

**Check Backend Logs:**
```bash
# If running locally
npm run dev

# Check for upload errors
```

**Check Storage Configuration:**
- Verify `GCS_BUCKET_NAME` in backend `.env`
- Verify service account has write permissions
- Check CORS configuration on bucket

### Images Not Displaying

**Check Image URL:**
- Should start with `https://storage.googleapis.com/`
- Verify bucket is publicly readable

**Check Browser Console:**
- Look for CORS errors
- Check for 403/404 errors

## Build Issues

### Build Fails

**Clear Cache and Rebuild:**
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

**Check Node Version:**
```bash
node --version  # Should be 18.x or higher
```

### TypeScript Errors

**Update Types:**
```bash
npm install --save-dev @types/react @types/react-dom
```

## Development Server Issues

### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 5174
```

### Hot Reload Not Working

1. Check if too many files are open
2. Restart dev server
3. Clear browser cache

## API Connection Issues

### CORS Errors

**Development:**
Ensure backend CORS is configured for `http://localhost:5173`

**Production:**
Update backend CORS to include your frontend domain:
```bash
gcloud run services update delux-plus-backend \
  --set-env-vars="CORS_ORIGIN=https://your-domain.web.app"
```

### 401 Unauthorized

**Token Expired:**
- Log out and log in again
- Check token expiration in backend

**Missing Token:**
- Clear storage and log in again
- Check AuthContext is properly wrapping app

## Performance Issues

### Slow Page Load

**Check Network Tab:**
- Look for slow API calls
- Check image sizes
- Look for unnecessary requests

**Optimize Images:**
- Compress images before upload
- Use appropriate image formats
- Consider lazy loading

### Memory Leaks

**Check for:**
- Unsubscribed event listeners
- Unclosed connections
- Large state objects

## Testing Issues

### Tests Failing

**Clear Test Cache:**
```bash
npm test -- --clearCache
```

**Update Snapshots:**
```bash
npm test -- -u
```

**Check Mock Data:**
- Verify mock responses match API structure
- Check test user data is valid

## Deployment Issues

### Build Succeeds but Site Broken

**Check Environment Variables:**
```bash
# Verify .env.production exists
cat .env.production

# Should have:
VITE_API_BASE_URL=https://your-backend-url.a.run.app
```

**Check Firebase Hosting:**
```bash
firebase hosting:releases:list
```

### 404 on Refresh

**Update firebase.json:**
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Getting Help

### Collect Debug Information

When reporting issues, include:

1. **Browser Console Errors:**
   - Open DevTools (F12)
   - Copy full error message
   - Include stack trace

2. **Network Tab:**
   - Failed request details
   - Response status and body

3. **Environment:**
   - Browser and version
   - Operating system
   - Node.js version
   - npm version

4. **Steps to Reproduce:**
   - What you were trying to do
   - What you expected to happen
   - What actually happened

### Useful Commands

```bash
# Check versions
node --version
npm --version

# Check environment
cat .env.development

# Check build output
npm run build 2>&1 | tee build.log

# Check running processes
lsof -i :5173
lsof -i :3000

# Clear everything and start fresh
rm -rf node_modules dist
npm install
npm run dev
```

## Common Error Messages

### "Failed to fetch"
- Backend not running
- Wrong API URL
- Network connectivity issue

### "Network Error"
- CORS issue
- Backend unreachable
- Firewall blocking request

### "Cannot read property of undefined"
- Missing data validation
- API response structure changed
- Component receiving unexpected props

### "Maximum update depth exceeded"
- Infinite render loop
- useEffect missing dependencies
- State update in render

## Prevention Best Practices

1. **Always validate API responses**
2. **Use TypeScript strictly**
3. **Handle loading and error states**
4. **Test with empty/invalid data**
5. **Clear storage between major changes**
6. **Keep dependencies updated**
7. **Monitor browser console in development**

## Quick Fixes Checklist

When something breaks:

- [ ] Clear browser cache and storage
- [ ] Restart development server
- [ ] Check backend is running
- [ ] Verify environment variables
- [ ] Check browser console for errors
- [ ] Check network tab for failed requests
- [ ] Try in incognito/private mode
- [ ] Try different browser
- [ ] Check recent code changes
- [ ] Review recent dependency updates

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [React Router Documentation](https://reactrouter.com)
