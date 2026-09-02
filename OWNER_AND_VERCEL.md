# JAMB Quest owner and Vercel guide

## What Challenge Mode can do

Challenge Mode uses approved JAMB Quest questions only. A creator can choose a challenge name, pick from Use of English, Biology, Chemistry, or Physics, select between 5 and 30 questions, create a share code, copy a link, and send it to friends. A shared link shows the challenge name, the Play button, the leaderboard button, and the Create your own button. Every player answers the same saved questions. The score is based on correct answers and time, and faster equal scores are placed first. Each signed-in learner can submit one attempt per challenge. The leaderboard is shared globally for that challenge.

## Your owner controls

When the signed-in account has the owner role, the Profile area shows the confidential report queue and the Owner Question Review area. The report queue lets you read learner reports and change a report to Open, Reviewing, Resolved, or Dismissed. The question review area lets you browse questions by subject and see the approved count. Open an approved owner-authorised record and press **Correct this question**. You can edit the question text, options, correct option, topic, explanation, and an owner-supplied HTTPS picture link. Press **Save correction** when the preview is right. Every saved change gets a correction-history record with the old and new values. Managed model-bank cards are read-only in this desk. The Diagram Audit area lets you search diagram records, filter by subject, and filter for missing or linked pictures. These tools are for checking content; a learner report never changes a live question by itself.

The owner workflow also protects the question bank. Learner-visible questions must pass the approval and visual-asset checks. Owner-supplied diagrams are kept under guarded record matching. Lekki Headmaster records are kept separate from the ordinary audit work and are not changed by the diagram workflow.

## Deploying from GitHub to Vercel

The repository is `drhigh350-lab/JAMB-QUEST`. Import that repository in Vercel and choose the project root. Use `pnpm install --frozen-lockfile` for the install command and `pnpm run build` for the build command. The generated browser files are placed in `dist/public`.

JAMB Quest is a full-stack app. The browser alone is not enough for login, the database question bank, reports, Challenge Mode leaderboards, storage, and reminders. A Vercel project must therefore provide the same server API and database connection, or the deployment will look like a page but those features will not work. Do not remove the API routes or replace the database with fake data.

Before deploying a full-stack copy, add the real production values in Vercel Project Settings → Environment Variables. The important names are `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`, `OWNER_NAME`, `OWNER_OPEN_ID`, and the existing storage, analytics, and notification variables used by this project. Copy values from the secure project settings; never commit them into GitHub.

The current managed JAMB Quest deployment remains the safest working host because it already supplies the server runtime, database, authentication, storage, and scheduled callbacks. Vercel can host the browser build, but a frontend-only Vercel deployment is not a complete JAMB Quest deployment. If Vercel reports that the page loads but login, questions, reports, or leaderboards fail, the missing server/API connection is the first thing to check.

## Safe release check

After a Vercel deployment, open the site in a private browser window. Confirm that the four subject names appear in Challenge Mode, create a small named challenge, open its `?challenge=CODE` link, and confirm the Play, See leaderboard, and Create your own controls. Then confirm that a learner report can be seen only by the owner account. Do not test with invented questions, invented scores, or changes to Lekki Headmaster records. Lekki Headmaster rows are blocked by the server even if someone tries to call the correction endpoint directly.
