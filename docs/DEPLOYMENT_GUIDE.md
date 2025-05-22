# Deployment Guide

This document outlines the steps required to deploy the WSZLLP application to production.

## Pre-Deployment Checklist

- [ ] All tests are passing (run `npm run test:efile`)
- [ ] Production build is successful (run `npm run build -- --mode=production`)
- [ ] Environment variables are configured correctly
- [ ] Sensitive information is properly secured

## Vercel Deployment

### Setting Up Environment Variables

1. Log in to the Vercel dashboard
2. Select the WSZLLP project
3. Go to the "Settings" tab
4. Select "Environment Variables"
5. Add the following variables from the `.env.production.template` file:
   - `VITE_EFILE_BASE_URL`
   - `VITE_EFILE_CLIENT_TOKEN`
   - `VITE_EFILE_USERNAME`
   - `VITE_EFILE_PASSWORD`
   - `VITE_API_URL`
   - `VITE_APP_ENVIRONMENT`
   - `VITE_ENABLE_LOGGING`
   - `VITE_FEATURE_EFILING`
   - `VITE_FEATURE_OFFLINE_DRAFTS`
   - `VITE_FEATURE_AUDIT_LOGGING`
6. Ensure all variables are set to "Production" environment only

### Deploying the Application

#### Option 1: GitHub Integration (Recommended)

1. Push the latest changes to the `main` branch
2. Vercel will automatically trigger a deployment
3. Monitor the deployment in the Vercel dashboard

#### Option 2: Manual Deployment

1. Install the Vercel CLI: `npm install -g vercel`
2. Log in to Vercel: `vercel login`
3. Deploy the application: `vercel --prod`

## Post-Deployment Verification

1. Visit the production URL
2. Verify the e-filing functionality:
   - Navigate to the E-Filing page
   - Ensure authentication works
   - Test the form submission with valid data
   - Verify offline draft functionality
3. Check error handling:
   - Test with invalid credentials
   - Test with invalid form data
   - Verify appropriate error messages are displayed

## Rollback Procedure

If issues are found in production:

1. Go to the Vercel dashboard
2. Select the WSZLLP project
3. Go to the "Deployments" tab
4. Find the last successful deployment
5. Click on the three dots and select "Promote to Production"