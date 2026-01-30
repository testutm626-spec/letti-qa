# Letti QA Web Dashboard

## Requirements
- Express.js server serving static files + API
- Single-page dashboard showing:
  - List of all scenario groups (cards)
  - Click to expand and see all scenarios in a group
  - Each scenario shows: title, steps, expected results, tags, priority
  - Visual indicators for conflict status
  - Button to generate Playwright tests
  - Button to run conflict check
- Modern, clean UI with Tailwind CSS
- Korean UI text
- Real-time updates when scenarios change

## API Endpoints
- GET /api/scenarios - list all scenario groups
- GET /api/scenarios/:id - get single group with full details
- POST /api/scenarios/add - add new scenario (body: {input: string})
- POST /api/scenarios/:id/generate - generate playwright test
- POST /api/check - run conflict detection
- GET /api/tests/:id - get generated test file content

## File Structure
```
src/
  server.ts        # Express server
  routes/api.ts    # API routes
public/
  index.html       # Dashboard SPA
  style.css        # Tailwind + custom styles
  app.js           # Frontend JS
```

## Design
- Dark mode by default
- Card-based layout for scenario groups
- Expandable accordion for scenarios within groups
- Color-coded tags and priority badges
- Toast notifications for actions
