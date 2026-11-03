@echo off
echo ==============================================
echo Pushing updates to GitHub and Vercel...
echo ==============================================
git add .
git commit -m "Remove powered-by text and add photo upload feature"
git push origin main
echo ==============================================
echo Successfully pushed! Vercel is now deploying.
echo ==============================================
