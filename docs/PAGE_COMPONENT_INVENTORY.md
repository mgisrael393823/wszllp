# Page Component Inventory - WSZ LLP Application

## Authentication Pages (Not Protected)

### 1. **Login Page** (`/login`)
- `LoginPage` (main component)
- UI Components: Button, Input, Card
- Context: AuthContext

### 2. **Register Page** (`/register`)
- `RegisterPage` (main component)
- UI Components: Button, Input, Card
- Context: AuthContext

### 3. **Forgot Password Page** (`/forgot-password`)
- `ForgotPasswordPage` (main component)
- UI Components: Button, Input, Card

### 4. **Reset Password Page** (`/reset-password`)
- `ResetPasswordPage` (main component)
- UI Components: Button, Input, Card

### 5. **Accept Invitation Page** (`/accept-invitation`)
- `AcceptInvitationPage` (main component)
- UI Components: Button, Input, Card

### 6. **Debug Invitation Page** (`/debug-invitation`)
- `DebugInvitationPage` (main component)
- UI Components: Button, Input, Card

## Protected Pages (Require Authentication)

### 7. **Dashboard** (`/dashboard`)
- `EnhancedDashboardHome` (main component)
- `Card` (metric, action-list, and activity-feed variants)
- Icons: Calendar, FileText, Users, TrendingUp, AlertCircle, CheckCircle2, Activity, ArrowRight, Briefcase, Scale, RefreshCw, BarChart3, Contact
- Context: DataContext
- Service: dashboardService

### 8. **Cases Pages** (`/cases/*`)

#### Case List (`/cases`)
- `CasesPage` (container)
- `CaseList` (lazy loaded)
- `CaseSkeleton` (loading state)
- `TabBar`, `Button`
- `Card`, `Table`, `Pagination`, `FilterBar`
- `LoadingState`
- Icons: Briefcase, Plus, Calendar
- Context: DataContext

#### New Case (`/cases/new`)
- `NewCasePage` (lazy loaded)
- `CaseForm`
- Form components

#### Case Detail (`/cases/:id`)
- `CaseDetail`
- Various UI components for displaying case information

### 9. **Hearings Pages** (`/hearings/*`)

#### Hearings List (`/hearings`)
- `HearingsPage` (container)
- `HearingList`
- `PageHeader`
- Icons: Plus

#### New/Edit Hearing (`/hearings/new`, `/hearings/:id`)
- `HearingForm` (standalone mode)
- Form components

### 10. **Calendar** (`/calendar`)
- `CalendarPage` (placeholder for MVP)
- Basic page structure components

### 11. **Documents Pages** (`/documents/*`)

#### Document Management (`/documents`)
- `DocumentManagement` (container with tabs)
- `TabBar`, `Button`
- Icons: FileText, Upload, Truck, Plus

#### Document List (default tab)
- `DocumentList`
- Table and filtering components

#### Document Upload (`/documents/upload`)
- `DocumentUploadForm`
- Form components

#### E-Filing (`/documents/efile`)
- `EFilePage` (with QueryClientProvider)
- `EFileSubmissionForm`
- `EFileStatusListSimple`
- `EFileDrafts`
- `PageCard`
- Context: EFileProvider

#### Service Logs (`/documents/service-logs`)
- `ServiceLogsList`
- List components

#### Document Detail (`/documents/:id`)
- `DocumentDetail`
- Detail display components

### 12. **Invoices Pages** (`/invoices/*`)
- `InvoiceList` (`/invoices`)
- `InvoiceDetail` (`/invoices/:id`)

### 13. **Workflows Pages** (`/workflows/*`)
- `WorkflowDashboard` (`/workflows`)
- `WorkflowDetail` (`/workflows/:id`)
- `Card` components

### 14. **Document Templates Pages** (`/templates/*`)
- `TemplateList` (`/templates`)
- `TemplateDetail` (`/templates/:id`)

### 15. **Document Generator** (`/document-generator`)
- `DocumentGenerator`
- Form and generation components

### 16. **Admin Page** (`/admin`)
- `AdminPage`
- `DataImportTool`
- `ErrorBoundary`

### 17. **Notifications Page** (`/notifications`)
- `NotificationsPage`
- `Card`, `Button`
- Icons: Bell, Mail, MessageSquare, Calendar, FileText, Users, ArrowLeft
- Toggle switches for notification settings

### 18. **Activity Page** (`/activity`)
- `ActivityPage`
- Activity tracking components

### 19. **Contacts Pages** (`/contacts/*`)

#### Contact List (`/contacts`)
- `ContactsPage` (container)
- `ContactList`
- `Button`
- `ContactsProvider`
- Icons: Plus

#### Contact Forms (`/contacts/new`, `/contacts/:id/edit`)
- `ContactForm`

#### Contact Detail (`/contacts/:id`)
- `ContactDetail`

### 20. **Profile Page** (`/profile`)
- `ProfilePage`
- Profile display components

### 21. **Settings Page** (`/settings`)
- `SettingsPage`
- Settings form components

### 22. **Design System Page** (`/design-system`)
- `DesignSystemPage` (placeholder, deferred for MVP)
- Rendered outside MainLayout

## Layout Components (Used Across All Protected Pages)

### MainLayout
- `Header`
- `Sidebar`
- Mobile overlay
- Scroll tracking
- Template variants (default, fullWidth, narrow)

### Header
- User menu
- Sidebar toggle controls
- Scroll shadow effect

### Sidebar
- Navigation menu
- Section links
- Collapse/expand functionality
- Mobile responsive

## Global Components/Providers

### Context Providers
- `DataProvider`
- `ToastProvider`
- `AuthProvider`
- `EFileProvider` (for e-filing section)
- `ErrorBoundary`

### Route Protection
- `ProtectedRoute` (wraps authenticated routes)

### Background Services
- `NotificationScheduler` (runs in MainLayout)

## Core UI Components Library

### Basic Components
- Button
- Card (with variants: metric, action-list, activity-feed)
- Input
- Select
- Modal
- Table
- Tabs
- TabBar
- Pagination
- Toast
- Typography

### Layout Components
- PageHeader
- PageCard
- FilterBar
- SearchInput
- CardBodyLayout
- CardContent

### State Components
- LoadingState
- ErrorState
- EmptyState
- ErrorBoundary

### Environment
- SandboxIndicator

### Shadcn UI Components
- shadcn-button
- shadcn-card
- shadcn-dialog
- shadcn-input
- shadcn-select
- shadcn-tabs

---

## Design Review Order

Based on importance and user impact, here's the suggested order for design review:

1. **Authentication Flow** (Login, Register) - First user experience
2. **Dashboard** - Most visited page
3. **Cases Pages** - Core functionality
4. **Documents/E-Filing** - Critical feature
5. **Contacts** - Frequently used
6. **Layout Components** (Header, Sidebar) - Affects all pages
7. **UI Component Library** - Consistency across app
8. **Other Pages** - Lower traffic pages

---

*This inventory will be used for the design fixes audit*