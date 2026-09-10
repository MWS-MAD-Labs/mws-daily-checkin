# MWS Hub — Project Setup & Architecture Discussion

I want you to help me understand and plan the setup of a new project that will become the **MWS Hub / App Launcher** for Millennia World School.

I don't want you to immediately start writing the entire application. First, I want you to **understand the requirements, inspect the existing central database project, explain the architecture, authentication flow, API integration, project structure, and setup steps with me**.

Think of this as a technical conversation where you guide me step-by-step.

---

## 1. Existing Central Database

There is already a central database/user service that will become the main source of data for this Hub.

GitHub repository:

https://github.com/MWS-MAD-Labs/mws-central-database-user.git

The API will be accessed through:

https://db.mws.web.id/api/internal

The new Hub should **not directly connect to the database**.

Instead, the architecture should be:

```text
User
  ↓
MWS Hub
  ↓
Google Workspace OAuth2
  ↓
Authenticated @millennia21.id user
  ↓
MWS Central Database API
https://db.mws.web.id/api/internal
  ↓
Central Database
```

The Hub will consume user/role/organization/application-related data from the central database API.

---

# 2. Main Purpose of the New Project

The new project will become the central **MWS Hub**.

Its purpose is basically:

> Users log in with their MWS Google Workspace account, and the Hub shows them the applications/tools they are allowed to access.

The Hub itself is primarily a **launcher/catalog**, not the application that implements all those tools.

For example:

```text
MWS Hub
├── Report Assistant
├── Slides to PDF
├── Slides Generator
├── Report Progress Tracker
├── Ticket Scanner
├── MWS Assets
├── MTSS Dashboard
├── Reading Buddy
└── etc.
```

When a user clicks an application:

```text
MWS Hub
   ↓
Application URL
```

The application itself may be hosted separately.

---

# 3. Authentication Requirement

The Hub must use **Google Workspace SSO**.

This is a strict requirement:

### Only users with:

```text
@millennia21.id
```

can access the Hub.

Unauthenticated users must be blocked.

External Google accounts must also be blocked.

For example:

```text
teacher@millennia21.id
→ ALLOWED

admin@millennia21.id
→ ALLOWED

someone@gmail.com
→ BLOCKED

someone@other-school.com
→ BLOCKED
```

I want you to explain:

1. How Google OAuth2 should work in this project.
2. Where the OAuth client ID/secret should live.
3. How the callback flow should work.
4. How we verify the Google account belongs to `@millennia21.id`.
5. How the authenticated user is matched with the user in the central database.
6. What should happen if the Google account exists but does not exist in the central database.
7. Whether the Hub should create its own session/JWT or rely on Google tokens.
8. How logout should work.
9. How to securely handle refresh/access tokens.
10. What the recommended production architecture is.

Please explain this before writing implementation code.

---

# 4. Central Database Integration

The Hub will get its user/application/role information from:

```text
https://db.mws.web.id/api/internal
```

I want you to inspect the existing GitHub repository and understand how its API/authentication works:

https://github.com/MWS-MAD-Labs/mws-central-database-user.git

Please investigate:

* Existing API structure
* Authentication mechanism
* Internal API authentication
* User model
* Role model
* Organization model
* Application-related models if they already exist
* Existing endpoints
* Expected request/response format
* How the Hub should authenticate when calling the internal API

Do not assume the API structure.

If something is unclear from the repository, tell me exactly what is missing or ambiguous.

---

# 5. Role-Based Application Visibility

The Hub must support role-based application visibility.

For example:

```text
Teacher
→ Teaching applications
→ Reporting applications
→ Base organization applications

Admin
→ Admin applications
→ Asset management
→ Reporting
→ Base organization applications

Student
→ Student applications
→ Base organization applications
```

A teacher should not see applications intended only for administrators.

The important concept is:

> Users should only see applications assigned to their role(s).

Everyone should automatically receive the **base organization applications**.

Please help me determine the best data model for this.

For example, should it look like:

```text
User
Role
Application
RoleApplication
OrganizationApplication
```

or something else?

Please explain the recommended relational structure.

---

# 6. Application Catalog

Each application should have information similar to:

```text
Application
├── name
├── description
├── url
├── category
├── icon
├── status
├── roles
└── organization
```

The description must be written in plain language.

For example:

Bad:

```text
Report Generation Pipeline
```

Better:

```text
Generates student report slides.
```

The user should immediately understand what the application does.

---

# 7. Application Status

Each application can have one of these statuses:

```text
ACTIVE
MAINTENANCE
NEW
```

### ACTIVE

Normal application.

The user can click it.

### MAINTENANCE

The application is temporarily unavailable.

The card should remain visible, but clicking it should be disabled.

Show a short message such as:

> This application is currently under maintenance.

### NEW

The application is available normally but displays a visual:

```text
NEW
```

badge.

Please recommend how this should be represented in the backend/data model.

---

# 8. One-Click Launcher

The main UI should be an application launcher.

Example:

```text
┌─────────────────────────────────────┐
│ Report Assistant                    │
│ Generates student report slides.    │
│                                     │
│ [Open App]                          │
└─────────────────────────────────────┘
```

Clicking the card/button should take the user directly to the application URL.

I want this to feel similar to an internal company application portal.

---

# 9. Search and Filter

The Hub needs:

### Instant Search

Users can search applications immediately.

Example:

```text
Search: report
```

Results:

```text
Report Assistant
Report Progress Tracker
Report Auditor
```

### Category Filters

For example:

```text
All
Reporting
Operations
Teaching
Administration
Student
```

Search and category filters should work together.

Example:

```text
Category: Teaching
Search: report
```

---

# 10. Mobile Friendly / PWA

The Hub must be:

* Mobile friendly
* Responsive
* PWA capable

It should work well on:

```text
Desktop
Tablet
Android
iPhone/iOS
```

Please explain the recommended PWA setup for the project.

---

# 11. No-Code Application Catalog Management

This is an important requirement.

MAD Labs / IT should be able to manage application cards **without changing source code**.

There should eventually be an admin interface where authorized users can:

```text
Add application
Edit application
Hide application
Change URL
Change description
Change category
Change status
Assign roles
```

For example:

```text
Application:
Report Assistant

Description:
Generates student report slides.

URL:
https://report.mws.web.id

Category:
Reporting

Status:
Active

Allowed Roles:
Teacher
Admin
```

The Hub frontend should get this configuration from the central backend rather than hardcoding applications.

---

# 12. Report Broken Tool

Every application card should have an option such as:

```text
Report a problem
```

If a user reports an application, they should be able to provide a short description.

For example:

```text
Application:
Report Assistant

Problem:
The page is showing a blank screen.

[Submit Report]
```

Please recommend how this should be modeled and where the report should be stored.

---

# 13. Request Access

If a user cannot see an application because they don't have the required role/permission, there should eventually be a way to request access.

Example:

```text
Need access to another application?

Request access
```

The user could submit:

```text
Application:
MWS Asset Management

Reason:
I need access to manage IT assets for my department.
```

Please recommend the backend/data model and workflow for this.

---

# 14. Important Architectural Principle

The Hub should **not become tightly coupled to every application**.

It should only know:

```text
Who is the user?
What roles does the user have?
What applications are available?
Which applications can the user access?
Where is each application located?
What is the status of each application?
```

The actual applications remain separate.

Think of it as:

```text
                    ┌─────────────────────┐
                    │     MWS HUB         │
                    │                     │
                    │ Authentication      │
                    │ User Profile        │
                    │ Role Filtering      │
                    │ App Catalog          │
                    │ Search               │
                    │ Launcher             │
                    └──────────┬──────────┘
                               │
                    Central Database API
                               │
             ┌─────────────────┴─────────────────┐
             │                                   │
       User / Role Data                    App Catalog
             │                                   │
             └─────────────────┬─────────────────┘
                               │
       ┌──────────────┬────────┼────────┬──────────────┐
       ↓              ↓        ↓        ↓              ↓
   App 1          App 2     App 3     App 4          App 5
```

---

# 15. What I Want From You

Before writing a large amount of code, I want you to walk me through this project.

Please answer in this order:

### Phase 1 — Understand the existing backend

Inspect:

https://github.com/MWS-MAD-Labs/mws-central-database-user.git

Explain:

* What the existing project does
* Its architecture
* Its API
* Its authentication
* Its database models
* How `/api/internal` works
* How another application should consume it

---

### Phase 2 — Design the Hub architecture

Recommend:

* Frontend framework
* Backend structure
* Authentication architecture
* OAuth2 flow
* Session management
* API integration
* Database responsibility
* PWA setup
* Deployment architecture

Show me a clear architecture diagram.

---

### Phase 3 — Define the data model

Recommend models for:

```text
User
Role
Application
Category
RoleApplication
Organization
OrganizationApplication
AccessRequest
BrokenToolReport
```

Explain which models should live in the central database and which, if any, should live in the Hub.

---

### Phase 4 — Define authentication flow

Show the complete flow:

```text
User
 ↓
Google Login
 ↓
Google OAuth
 ↓
Google Callback
 ↓
Verify @millennia21.id
 ↓
Find user in Central DB
 ↓
Get roles
 ↓
Create Hub session
 ↓
Load applications
 ↓
Filter applications by role
 ↓
Show Hub
```

Explain every step.

---

### Phase 5 — Define project structure

After we agree on the architecture, propose a clean project structure.

For example:

```text
mws-hub/
├── frontend/
├── backend/
├── components/
├── pages/
├── features/
├── auth/
├── api/
├── services/
├── hooks/
├── utils/
└── ...
```

But don't blindly use this structure.

Recommend the structure that makes the most sense.

---

### Phase 6 — Local Development Setup

Explain exactly how I should set up the project locally.

Including:

```text
Node/Bun version
Environment variables
Google Cloud OAuth setup
OAuth redirect URI
Local database requirements
Central DB API configuration
Frontend configuration
Backend configuration
```

I want to be able to eventually run something like:

```bash
npm install
npm run dev
```

and test:

```text
http://localhost:3000
```

with real Google Workspace OAuth and the real central API.

---

### Phase 7 — Production Architecture

Finally explain how this should be deployed.

Something like:

```text
Google Workspace
       ↓
MWS Hub
       ↓
db.mws.web.id
       ↓
Central PostgreSQL/Mongo/etc.
```

Explain:

* Domain
* HTTPS
* OAuth redirect
* Environment variables
* Secrets
* API authentication
* CORS
* Session security
* Production deployment

---

# 16. Important Instruction

Do **not** immediately generate the whole application.

First:

1. Inspect the existing GitHub repository.
2. Understand the central database API.
3. Identify what already exists.
4. Identify what needs to be added.
5. Explain the recommended architecture.
6. Point out potential problems or security issues.
7. Ask me questions only when you genuinely need clarification.
8. Then we can implement it step-by-step.

I want this to be a **technical conversation**, not a one-shot code generation.

Start by analyzing the existing `mws-central-database-user` repository and explain how you think the new MWS Hub should communicate with it.
