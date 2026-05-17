## Task: Fix Broken Vercel Build — Source Code Exposed

This Vite + TypeScript app is showing raw source code on its Vercel deployment instead of a built app. 
Fix the build configuration so Vercel builds and serves the app correctly.

### Steps:
1. Check `package.json` — ensure there's a valid `build` script (should be `vite build` or `tsc && vite build`)
2. Check `vite.config.ts` — ensure build output is configured correctly
3. Check if `vercel.json` exists — if not, create one with:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite"
   }
   ```
4. If `vercel.json` exists, ensure `buildCommand`, `outputDirectory`, and `framework` are set correctly
5. Ensure `tsconfig.json` doesn't have errors that would block the build
6. Run `npm run build` locally to verify it compiles without errors
7. Fix any TypeScript errors that block the build
8. Commit all fixes

### Expected Result:
- `npm run build` succeeds
- Output goes to `dist/` directory  
- Vercel can serve the built app (not raw source)

### Do NOT:
- Add new features
- Change app functionality
- Modify UI components
- Upgrade dependencies unless required for build
