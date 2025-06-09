# **WSZLLP Platform Codebase Analysis**

## **1\. Current State Assessment**

*Figure 1: Entity-Relationship Diagram (ERD) of the WSZLLP database schema.* This diagram shows the primary tables and their relationships. Key tables include **cases**, **contacts**, **case\_contacts** (junction between cases and contacts), **documents**, **hearings**, **contact\_communications**, and **case\_parties**. Each table uses a UUID primary key (`id`) and most have a foreign key reference to an **auth.users** `id` for multi-tenant user ownership (via a `user_id` column).

* **Cases:** Represents legal cases. Columns include `id` (UUID PK), `plaintiff`, `defendant`, `address`, and `status` (default “Intake” in early schema). Cases have a `user_id` referencing the owner (Supabase auth user). Timestamps (`createdAt/updatedAt`) track creation and updates. No explicit foreign keys to other domain tables, but **cases** form the hub of relationships.

* **Contacts:** Represents people or entities (clients, attorneys, etc.). Columns include `id` (UUID PK), `name`, `role` (enumerated as Attorney/Paralegal/PM/Client/Other), `email`, phone, etc. Contacts also have an owner `user_id` (who created the contact).

* **Case\_Contacts:** A junction table linking many contacts to many cases (e.g. associating attorneys or clients with a case). Each entry has `id` (PK), a `case_id` FK to **cases**, a `contact_id` FK to **contacts**, and a `relationship_type` (Plaintiff, Defendant, Attorney, etc.). Uniqueness on `(case_id, contact_id, relationship_type)` prevents duplicate links. **On Delete Cascade** is set for both FKs, so deleting a case or contact removes related junction records. This table enables querying all contacts for a given case (and vice versa). For example, one case can have multiple associated contacts and one contact can link to multiple cases.

* **Documents:** Stores documents associated with cases (e.g. complaints, motions). Columns include `id` (PK), `case_id` (FK to cases), `type` (Complaint, Summons, etc.), `file_url` (storage link), `status` (Pending/Served/Failed), `service_date`, etc. **On Delete Cascade** on `case_id` ensures that if a case is deleted, its documents are removed. *Additional e-filing fields* have been added: `envelope_id`, `filing_id`, `efile_status`, `efile_timestamp` (for integration with an e-filing system), as well as `original_filename` for user-friendly file names. These columns support tracking submission to the court’s e-filing service.

* **Hearings:** Stores court hearing events for cases. Columns include `id` (PK), `case_id` (FK to cases), `court_name`, `hearing_date`, `participants` (array of participant names), and `outcome`. **On Delete Cascade** on `case_id` means deleting a case will remove its hearings. Hearings are associated one-to-one with a case (each hearing links to exactly one case, a case can have many hearings). Participants are currently stored as plain text array, not linked to contacts (this is a design simplification).

* **Contact\_Communications:** Logs interactions with contacts (calls, emails, meetings, etc.). Columns include `id` (PK), `contact_id` (FK to contacts), an optional `case_id` (FK to cases, can be null if communication isn’t tied to a case), `communication_type` (Email, Phone Call, etc.), `subject`, `content` (message details), `direction` (Incoming/Outgoing), `communication_date`, `follow_up_required` (flag), and `follow_up_date`. On the `contact_id` FK, **Delete Cascade** ensures if a contact is deleted, their communications are removed. The `case_id` FK uses **ON DELETE SET NULL**, meaning if a case is deleted, communications are not deleted but simply lose the case reference. This prevents orphan communications from a contact perspective (the comm log still exists under the contact, just not tied to a now-nonexistent case). Each communication optionally ties a contact with a case context.

* **Case\_Parties:** Stores structured info for petitioners and defendants in a case for e-filing (added in “Phase A” enhancements). Columns: `id` (PK), `case_id` (FK to cases), `party_type` ('petitioner' or 'defendant'), `is_business` (boolean), `business_name`, `first_name`, `last_name`, and address fields (city, state, zip, etc.). This table captures party details needed for court filings (which may include businesses or individuals). It is related 1-to-many with **cases** (a case can have one petitioner and multiple defendants entries). **On Delete Cascade** on `case_id` applies – deleting a case will remove its party records.

**Foreign Key Constraints & Relationships:** All relationships are enforced at the database level through foreign keys. For example, **case\_contacts.case\_id** references **cases.id** and **case\_contacts.contact\_id** references **contacts.id**. Similarly, **documents.case\_id** references **cases.id**, **hearings.case\_id** references **cases.id**, **contact\_communications.contact\_id** references **contacts.id** and **contact\_communications.case\_id** references **cases.id**. These constraints maintain referential integrity (you cannot have, say, a document linked to a non-existent case).

**Row-Level Security (RLS):** The project uses Supabase RLS extensively to enforce data isolation per user. Initially, the tables were created with very permissive policies (allowing any authenticated/anon user full access). However, **enhanced RLS policies** were later applied to secure data on a per-owner basis:

* A `user_id` column was added to core tables **cases**, **contacts**, **case\_contacts**, **contact\_communications**, **documents**, and **hearings** to mark row ownership. Each of these now references `auth.users(id)` with **ON DELETE CASCADE** (if a user is deleted, all their owned data is removed). For example, after migration, **contacts.user\_id** and **cases.user\_id** link to the user who created them.

* RLS policies were tightened so that users can **only select or modify rows they own** or are authorized to see. For instance, for **contacts**: users can select contacts where `contacts.user_id = auth.uid()` (their own contacts) or contacts linked to cases they own. Insert/Update/Delete on contacts requires `auth.uid() = contacts.user_id` (i.e. you can only create or change contacts as your own). Similar policies exist for **cases** (a user can only see and mutate their own cases), **documents** (can access documents either they created or that belong to their case), **hearings**, and **communications**. The policies often include an `EXISTS(...)` subquery to allow access if the item’s related case is owned by the user. For example, a hearing satisfies the select policy if `hearing.user_id = auth.uid()` **OR** the associated case’s `user_id` is the user. This means even if a hearing row was inserted by another user (in practice triggers set `user_id` to the case owner, see below), the case ownership grants viewing rights.

* **Automatic user tagging:** Triggers (`BEFORE INSERT`) on these tables set the `user_id` to the current `auth.uid()` at insertion time. For example, when a new contact is inserted, the `set_contacts_user_id` trigger populates `NEW.user_id` \= the authenticated user’s ID. This ensures all new records are correctly attributed to the creator and satisfy the RLS checks (the user who inserts a record becomes its owner by default). This pattern is repeated for cases, documents, hearings, case\_contacts, etc. after the security migrations.

* The initial overly broad policies (and any temporary anonymous-access policies used during development) have been removed in production mode. For example, the open “Users can view all cases” and similar rules were dropped, as were the special dev-only anonymous policies that allowed unauthenticated access to contacts and other tables. Now, only authenticated users with matching `user_id` (or case ownership) can access data. This RLS configuration is crucial in a multi-tenant setting to prevent data leaks across accounts.

**Database Triggers & Functions:** Aside from user-assignment triggers, the schema defines triggers for maintaining timestamps and refreshing analytics:

* **Updated Timestamp Triggers:** A function `update_updated_at_column()` updates an `updated_at`/`updatedAt` timestamp on any row before update. All main tables use a trigger calling this function on each update to automatically bump the modified timestamp. For instance, `update_cases_updated_at` on the cases table and similar triggers on contacts, documents, etc. ensure `updated_at` stays current. (Note: The cases table originally named these columns in camelCase, but the trigger function covers both naming conventions in different migrations.)

* **Materialized Views & Dashboard:** There are materialized views (`dashboard_cases_summary`, `dashboard_documents_summary`, etc.) created to aggregate stats for dashboards. For example, `dashboard_cases_summary` pre-computes counts of active/intake/closed cases and average case duration; `dashboard_hearings_summary` counts upcoming vs. completed hearings; `dashboard_documents_summary` counts documents by status and type; etc. A combined view `dashboard_combined_metrics` joins all these metrics into one row for quick dashboard reads. Triggers `AFTER INSERT/UPDATE/DELETE` on cases, hearings, documents, and contacts call a function `refresh_dashboard_materialized_views()` to refresh these summaries in real-time. This ensures that any data change is reflected in dashboard stats immediately (albeit at some performance cost, as noted in comments). These refresh triggers log their actions in a **schema\_monitoring** table (storing operation status). The **schema\_monitoring** and related tables (like **schema\_versions**, **migration\_logs**, **system\_health**) were introduced to track schema migrations and system health metrics, which is more meta-level and not directly part of core case management, but useful for DevOps/monitoring.

In summary, the current database schema is fairly comprehensive in modeling the core entities of a legal case management system. **Cases** are central, linking to contacts (via **case\_contacts**), documents, hearings, communications, and case parties. All references are enforced with foreign keys, and cleanup rules (cascades) are in place to avoid orphaned child records in most cases. RLS is configured to enforce a per-user tenancy model: each record is owned by a user, and policies combined with triggers ensure users only access their own cases and related data. The schema supports upcoming features like e-filing integration (with extra fields and case party details) and analytics via materialized views. The ERD above and Table 1 (below) summarize the key tables and their relationships:

**Table 1 – Key Database Tables and Relationships**

| Table | Key Columns (PK ⇢ FK) | Related Table (Relationship) |
| ----- | ----- | ----- |
| **cases** | id (PK), user\_id ⇢ auth.users | – owns→ case\_contacts (1–*), documents (1–*), hearings (1–*), contact\_communications (1–*), case\_parties (1–\*) |
| **contacts** | id (PK), user\_id ⇢ auth.users | – owns→ case\_contacts (1–*), contact\_communications (1–*) |
| **case\_contacts** | id (PK), case\_id ⇢ cases, contact\_id ⇢ contacts | cases (*–1), contacts (*–1) (many-to-many link between cases & contacts) |
| **documents** | id (PK), case\_id ⇢ cases, user\_id ⇢ auth.users | cases (\*–1) (each document belongs to one case) |
| **hearings** | id (PK), case\_id ⇢ cases, user\_id ⇢ auth.users | cases (\*–1) (each hearing belongs to one case) |
| **contact\_communications** | id (PK), contact\_id ⇢ contacts, case\_id ⇢ cases, user\_id ⇢ auth.users | contacts (*–1); cases (*–1, optional) (communications tied to a contact, optionally to a case) |
| **case\_parties** | id (PK), case\_id ⇢ cases | cases (\*–1) (petitioners/defendants for a case) |

(Other meta tables like **schema\_versions**, **migration\_logs**, etc. omitted for brevity.)

## **2\. Gap Analysis**

Despite the solid schema, a few **relationship gaps and missing links** exist:

* **Document–Contact Relationships:** There is **no direct junction table between documents and contacts** (no “case\_documents” or “document\_recipients” table). In practice, each document is linked only to a case, not to a specific contact (e.g. the person who uploaded or was served the document). For example, if a Summons document is intended for a particular defendant, the schema does not explicitly tie that document to the defendant’s contact record. This could be a modeling gap if the system needs to record which contact was served or who authored a document. The design currently assumes documents are case-wide, with service details tracked separately (the concept of a “ServiceLog” is present in code for this purpose). The **ServiceLog** concept (for service of process attempts on documents) is defined in the TypeScript types but no corresponding table exists yet in the database. This indicates a planned feature not yet implemented: without a service\_log table, tracking which contacts received a document or when service was attempted is incomplete. As a result, documents can be uploaded and marked “Served” or “Failed”, but the system has no structured way to link that outcome to a specific contact or service attempt record – a potential gap for compliance/audit trails.

* **Hearing Participants Unlinked:** Similarly, **hearing participants are stored as plain text** (an array of names) rather than references to contacts. This means if an attorney or witness is listed in a hearing’s participants, that is not enforced as an existing contact. It’s possible to have a typo or a name that isn’t in the contacts list. The lack of a junction between hearings and contacts is a minor data integrity gap. It was likely done for simplicity (to avoid complex linking for ad-hoc participant names), but it forgoes relational consistency – e.g., you cannot easily click a participant name to view their contact record. As an improvement, a join table (e.g., **hearing\_participants**) or using the existing contacts list to populate participants would ensure consistency.

* **Case Parties vs Contacts:** The **case\_parties** table introduced for e-filing (petitioner/defendant info) is **not integrated with the contacts table**. These party records duplicate contact information (names, addresses) but live separately. For instance, when creating a new case via the e-filing flow, the code inserts into **case\_parties** for the petitioner and defendants, but **does not create or link to entries in contacts**. This can lead to data duplication – the same person might exist as a Contact and also as a CaseParty with overlapping info. There is no junction or foreign key between **case\_parties** and **contacts**. If a client is added as a petitioner during e-filing, that client’s details live in case\_parties only, meaning they **won’t appear in the main contacts list** unless separately entered as a contact. This separation might cause inconsistent updates (updating an address in contacts would not update case\_parties or vice versa). It’s a gap where a junction table or a unification strategy (perhaps linking case\_parties to a contact\_id) is missing. This is especially relevant because other parts of the app (communications, general contact management) revolve around the contacts table.

* **Row-Level Security coverage:** Most tables have proper RLS now, but **case\_parties lacks user-scoping**. When case\_parties was added, it was given broad RLS rules (allow all authenticated users full access) similar to initial tables. Unlike cases or contacts, **case\_parties has no `user_id`** and no policy tying it to case ownership beyond enabling RLS. In the current state, any logged-in user could potentially select or manipulate case\_parties records for any case, since the policies are `USING (true)` (i.e., no restriction). This is a security gap: case\_parties is essentially world-readable/writable to authenticated users unless additional unseen policies were added. Given that case\_parties contains sensitive personally identifiable information (names/addresses of litigants), this is likely an oversight. The expectation is that case\_parties should inherit the same access control as cases (only owners of a case can see its parties). The absence of user scoping or a join in RLS is a red flag for data privacy. This likely needs a policy similar to hearings or documents (“Users can view case parties for their cases”) that checks the related case’s `user_id`. As of now, that appears to be missing, making **case\_parties a potential query blocker** for legitimate use (if RLS was later tightened without user\_id, nobody could access them) or conversely a data leak (if left too open). In summary, **RLS is not consistently applied to the new tables**.

* **Orphaned Records & Cascades:** Thanks to cascade deletes, most child records are cleaned up when a parent is removed. For example, deleting a case will cascade-delete related case\_contacts, documents, hearings, and case\_parties. One exception is **contact\_communications**: deleting a case sets `contact_communications.case_id` to NULL rather than deleting the communication. This means communications tied to a now-deleted case “live on” under the contact. This could be intentional (to preserve a full interaction history for the contact), but it also means such communication records become semi-orphan – they have no case context, yet they remain in the database. If those communications are never surfaced anywhere once the case is gone, they might accumulate as effectively orphan data. On the other hand, from the **contact’s perspective, they aren’t orphaned** (still linked to a contact). Whether this is a gap depends on requirements: if communications should always be viewed in a case context, losing the case link diminishes their value. A possible improvement could be to also delete communications when a case is deleted, or mark them differently.

* Another orphan scenario: If a **contact** is deleted, the cascade will remove case\_contacts and communications linked to them. The case itself remains, but now lacks that contact association. This is expected behavior, not exactly a gap, but it raises a workflow question: should a case still be “active” if its plaintiff contact was deleted? Currently the system would allow it (the case would have no plaintiff contact in case\_contacts anymore). There is no enforcement that a case must have at least one plaintiff/defendant contact. Since **case\_parties** holds the canonical party info for court, the deletion of a Contact doesn’t remove the party from the case’s perspective (because case\_parties is separate). This highlights the earlier duplication issue: if a user deleted a contact that happened to be the petitioner, the **case\_parties entry remains** (so the case still has a petitioner for e-filing, but the contact list doesn’t). It’s an inconsistency gap to be aware of.

* **Missing Cascade on User Deletion for New Tables:** The `user_id` foreign key added to cases/contacts/etc. is set to cascade on delete of a user. If a user account is ever removed, all their cases and related data will be wiped. One gap here: **case\_parties and materialized views have no `user_id`**, so they won’t automatically clear. Case\_parties will be removed if the case is removed (and case would be removed if its owning user is gone), so that’s fine. The dashboard materialized views simply become empty for that user since their cases/docs/hearings are gone. This is mostly consistent. However, consider **shared data**: a contact could be linked to cases owned by two different users (via case\_contacts). In such a scenario, the contact is owned by one user (has one `user_id`), and simply shared via a case link to another user. If the owning user deletes their account, that contact record and all its communications will be deleted (cascade by user\_id), even though another user’s case was using it. That case will lose the contact link (the junction entry is gone), effectively dropping that party from the case. The second user might be surprised that a contact in their case vanished. In a multi-user environment where data can be shared, this is a logical gap: **shared contacts are not truly shared ownership**. The system currently doesn’t have a concept of multi-owner or organization-level contacts – one user owns it, others just get read access through a case link. This can lead to “ghost” scenarios if the owning user’s account is removed. Addressing this might require reassigning ownership or preventing deletion if a contact is linked to other users’ active cases.

* **Cascade vs. Nullify Trade-offs:** The developers have to balance when to cascade delete and when to preserve data by nullifying foreign keys. The choices made (cascade for most, nullify for communications) reveal assumptions: cases are the primary aggregator, so if a case is gone, its dependent data is mostly useless (hence deletion). Communications might have independent value linked to a contact, hence retained. These are reasonable, but the implications are that after a case deletion, any leftover records (like comms) could clutter unless handled. Possibly an **admin cleanup or archiving strategy** is needed for communications with no case. Alternatively, **ON DELETE SET NULL** is fine as long as the application knows to handle/display those appropriately (e.g., show communications in a contact’s timeline even if case is “\[Deleted\]”). Currently, the UI does not seem to surface communications at all yet, so this is latent.

In summary, the primary gaps are **missing relationship linkages** (documents to contacts, hearings to contacts), **duplicate data models** (case\_parties vs contacts) and a few **RLS/security oversights** (case\_parties policies). These gaps can lead to either **functional limitations** (e.g., not seeing all related data in one place) or **data integrity issues** (inconsistent updates, accidental data exposure). None of these gaps are catastrophic – the core functionality is intact – but addressing them would improve data consistency and the user experience.

## **3\. Technical Debt and Code Issues**

Beyond schema design, we identified technical debt in the TypeScript code and React application architecture that could impede maintainability and cross-entity consistency:

* **TypeScript Schema Mismatches:** The file `/src/types/schema.ts` defines Zod schemas and types for the entities, but there are discrepancies between these types and the actual database schema. For example, the `Case` type in code uses `caseId`, `createdAt` fields in **camelCase** and enumerates `status` values like `'SPS NOT SERVED'`, `'SPS PENDING'`, `'SEND TO SPS'`, `'SPS SERVED'` – which differ from the statuses in the database (the DB’s cases.status started with values like 'Intake', 'Active', 'Closed'). It appears the frontend is assuming a different status workflow (perhaps updated to service process statuses) that wasn’t updated in the database constraints. This mismatch could cause confusion or bugs if the front-end expects a case to have status "SPS PENDING" but the DB still contains "Intake" or "Active". Similarly, the TypeScript `Contact` interface uses `contactId` instead of `id`, and `createdAt` instead of `created_at`, reflecting an earlier state or a naming convention difference. The migration plan explicitly noted changing these to match Supabase (e.g., using `id` for contacts), but if the code still has `contactId`, that’s a technical debt from refactoring.

   Furthermore, the TS types do not yet include fields recently added to the DB. For instance, the `Document` type doesn’t show `envelope_id` or `efile_status` – the code’s `Document` schema lists only `docId, caseId, type, fileURL, status, serviceDate, createdAt, updatedAt`, with no mention of e-filing fields. This indicates the types were not updated after the e-filing migrations. The **lack of synchronization between DB schema and TS types** can lead to runtime errors or missing data (e.g., the app might not display `efile_status` because the type definition didn’t include it). Similarly, the code defines types like `ServiceLog`, `Invoice`, `PaymentPlan` in schema.ts which have no backing tables yet – a sign of planned features. These lingering unused types are harmless but contribute to clutter and potential confusion for new developers. They also hint that certain features (billing, service tracking) are only partially implemented (types exist, UI components exist, but no persistence layer yet).

* **React State Management (Context vs Refine):** The project is in a transition from a custom React Context state management to using **Refine** (a React framework for CRUD apps with built-in data provider). We see a **DataContext** (`src/context/DataContext.tsx`) that holds a giant in-memory state of cases, contacts, documents, etc. and provides reducer actions to add/update/delete them. For example, `state.cases` and `state.hearings` are arrays in this context, and CaseDetail pages access them via `useData()` to display info. This suggests originally the app managed everything client-side (maybe syncing with localStorage or a simple REST API). Now, with Supabase integration, parts of the app use **Refine’s data provider** that directly queries Supabase. Indeed, the **Contacts section** has been refactored to use a `<ContactsProvider>` that wraps Refine’s `<Refine>` component with a Supabase data provider. Inside, components like `ContactList` and `ContactDetail` use `useOne` and `useDelete` hooks from Refine to fetch data from Supabase on the fly. For instance, `ContactDetail` calls `useOne<Contact>({ resource: 'contacts', id })` to get a single contact from the DB, instead of relying on DataContext.

   This **hybrid state approach** is a technical debt because it can lead to inconsistent data views and duplicated logic. Right now, *cases/hearings/documents rely on DataContext*, whereas *contacts use Refine/Supabase directly*. So if a contact is updated via Refine (Supabase), the DataContext (which also holds a copy of contacts in `state.contacts`) might become stale unless explicitly synced. In practice, they might not be using DataContext for contacts anymore (the Contact pages are inside `<ContactsProvider>` which likely does not even initialize DataContext for contacts), but DataContext still manages cases, etc. This split is visible: on the **CaseDetail** page, the code accesses context state (`state.cases.find(c => c.caseId === id)`) and does filtering like `state.documents.filter(d => d.caseId === id)` to show documents for the case. Meanwhile, on **Contacts pages**, they no longer reference `state.contacts` at all, using hooks instead. The technical risk is that until everything is moved to a unified data fetching strategy, actions in one area may not reflect elsewhere. For example, deleting a contact via the Refine hook will remove it in the database and navigate away, but the in-memory `state.contacts` (if still in use somewhere, say in DataContext for other components) won’t automatically update. Similarly, if a case is created via the new Supabase API (e.g., through the e-filing Next.js API route), the current UI might not have a live subscription or refresh in DataContext to pick it up.

   There is also duplication of validation logic between front-end and DB: e.g., the **schema.ts** Zod schemas for cases and contacts enforce certain checks (string lengths, valid email format) which overlap with the database constraints and Supabase RLS conditions. The DB already has CHECK constraints on contacts (email regex, name length). Maintaining these in parallel is extra work and a potential source of bugs if they diverge.

* **Custom Hooks & Data Sync:** Several custom React hooks are used to fetch and sync data, some performing manual relational logic. For example, `useDocuments` fetches documents from Supabase and then separately fetches the related case for each document to attach case info (plaintiff/defendant names). This is essentially performing a client-side join that Supabase could do server-side with a foreign table query. They likely did this to avoid needing to define a foreign key relationship in Supabase’s API or to have more control over filtering. But it’s inefficient and adds complexity (two round-trips to the DB, and manual merging). If the schema had been defined in Supabase with a foreign relationship (which it is, via FKs), one could use `.select('*, case:cases(plaintiff, defendant)')` in the Supabase query to get case data in one request. Alternatively, a database VIEW or a stored procedure could return documents with case info. The manual approach works, but it’s technical debt in terms of performance and code maintenance. It also illustrates that **the front-end might be compensating for missing backend endpoints**: since there is no dedicated API to get “documents with case names”, the hook does it manually.

   Similarly, no custom hook yet exists to fetch “contacts with related cases” – as seen in ContactDetail, the related cases section is just a placeholder saying “No cases associated…”. Implementing that would require a join on case\_contacts (or another hook to fetch case\_contacts by contact and then cases). The absence of these hooks means certain UI features are incomplete. The **Contacts page** as delivered doesn’t show which cases a contact is in, because that query isn’t being made. This is both a functional gap and technical debt (the logic is pending).

   Another aspect is **lack of realtime sync**: Supabase can provide realtime subscriptions to table changes, but the current codebase (from what we see) is not yet using them. DataContext is updated via dispatch when actions happen locally, but if two users are using the system, or if an external process inserts a record (say via the new API routes), those changes won’t reflect in another user’s UI unless they refresh or implement subscriptions. For example, if a new hearing is scheduled via one client, another client wouldn’t know. Introducing Supabase’s realtime or Refine’s live features would eventually be needed – not critical for MVP if usage is mostly single-user, but a debt for multi-user interactivity.

* **API Logic & Transactional Consistency:** The project includes custom Next.js API routes (in `/api/*.js`) for certain operations, especially around e-filing. These use the Supabase service role key to bypass RLS and call stored procedures for atomic operations. This is good practice for multi-table operations. For instance, `api/cases.js` calls `create_case_with_transaction()` to insert a case and its parties in one go. `api/documents.js` calls `create_document_with_validation()` to insert a document with checks. However, we noticed these RPC functions currently focus only on their immediate task and do not handle some **cross-entity updates** that one might expect.

   **Case status updates**: One example is when an e-filing is submitted. The `create_document_with_validation` function inserts a new document record (with status and timestamp from the e-filing system). But it does not update the parent case’s status. If a case was in “Intake” status and then an e-filing (complaint) is filed, typically one might mark the case as “Filed” or “Active”. Currently, that logic isn’t in the RPC or the API handler. Unless the front-end explicitly updates the case status, it will remain in the old status. This is a consistency issue: the **case status is not automatically synced with filing events**. The tests or use cases might catch this (“Confirm e-filing submissions update the case status and maintain relational integrity”) – currently, nothing in the backend ensures that, so it likely does **not** happen, which is a functional gap. The technical debt is the need to either incorporate such updates in the transaction or handle them in the application layer.

   **Multi-table rollbacks**: The custom RPCs do not wrap multiple inserts in an explicit transaction block, except for `create_case_with_transaction` which does use `BEGIN; ... COMMIT;` in the migration script. `create_document_with_validation` as defined doesn’t show an explicit transaction, but each function in plpgsql is atomic by default (if an error is raised, it will rollback that function’s actions). That function does multiple checks and a single insert, which is fine. However, think of a scenario like: after creating a document, we might want to update case status and perhaps log an activity. If those are done in separate calls (one RPC for doc, one update for case), a failure in the second step could leave things inconsistent. Right now, since the case status update isn’t done at all, the inconsistency is “case remains in old status when a doc exists that implies it should be filed”. As technical debt, adding such logic should be done carefully (maybe extend the `create_document` RPC to also update case status in one atomic call).

   **Lack of comprehensive RPCs for other relations**: We see no dedicated RPC for creating a hearing with related updates, or linking a contact to a case (case\_contacts insertion). These operations are likely done via direct supabase JS calls in the front-end. For instance, adding a contact to a case might be done by simply calling `supabase.from('case_contacts').insert({ case_id, contact_id, relationship_type })` from the client. That works, but if any additional logic is needed on such linking (like ensuring uniqueness beyond the DB constraint, or writing an audit log, etc.), it’s not centralized. The project did define some audit log types and workflow triggers (like a WorkflowTask type for “UpdateStatus” etc.), but we don’t see evidence these are executed. The **AuditLog** type suggests an intent to record every create/update/delete in an audit trail, but no trigger or function is populating an audit\_logs table (we didn’t find an `audit_logs` table in migrations). This is a piece of technical debt – planning for audit logging but not implementing it means less observability of changes, and if needed for compliance, it’s a missing piece.

* **State Synchronization and Cross-Module Effects:** As noted, certain actions do not trigger expected updates across modules. A concrete example: when a new case is created via the `/api/cases` endpoint (for e-filing), it returns a `caseId` but does not automatically insert a corresponding **contact** for the petitioner in the contacts table, nor does it notify the front-end to refresh the case list. The onus is on the front-end to use that returned ID and perhaps fetch the new case or navigate to it. If the DataContext is still being used for the main Cases page, it would need to dispatch an action to add that case to state (with all its properties). There’s complexity in bridging the old context state with the new API-created data. This might not be fully handled, leading to scenarios where after creating a case via the new modal, the UI might not immediately show it in the list unless refreshed.

   Similarly, deleting a contact via Refine will remove it from the DB and redirect, but any cases that had that contact will now have a dangling reference in their UI (the case detail might try to show that contact and fail). Because case\_contacts for that contact are cascaded away, the case detail should ideally update to remove the contact from its list. If using DataContext, an action for DELETE\_CONTACT would remove the contact and also perhaps remove related case\_contacts. The DataContext `DELETE_CONTACT` reducer does exist, but it simply removes the contact from state.contacts – it doesn’t explicitly purge case\_contacts entries or update cases. Possibly they rely on a fresh query when viewing the case detail. This indicates a **lack of reactive coupling** between related entities in the state management. Ideally, a single source of truth or a more normalized state would handle that.

* **UI/UX Incompleteness:** Some UI components are present but not fully wired. For instance, in ContactDetail, the “Related Cases” card is static placeholder text – meaning the feature to list a contact’s cases is not done. In CaseDetail, there is no explicit section listing involved contacts (though one can infer plaintiff/defendant from the case fields and case\_contacts might not be surfaced). The plan (as per docs) was to show related contacts on case detail and related cases on contact detail, which is standard in case management. This is a functional debt: without these, users might have to cross-reference manually. Also, communications logging exists in the schema but no UI yet to display or create communications (no form for adding a phone call record, etc.). So the presence of data model without front-end usage is technical debt (dead code / unused features). It might be intentional (phased rollout), but it’s worth noting for completeness.

To summarize, the **technical debt** centers on consistency: consistency between TypeScript definitions and the actual database, consistency between different parts of the app using state vs. direct queries, and consistency of data updates propagating through the system. Refactoring to a single source of truth (likely Supabase \+ Refine, dropping the old DataContext) will resolve many of these issues, but until that’s complete, developers must carefully update both the client state and the database to keep things in sync. The current partial integration means **potential bugs** like stale data in UI, missing updates, or mismatch in expected values. Reducing these inconsistencies will greatly stabilize the application.

## **4\. Implementation Roadmap**

Based on the issues found, here is a prioritized roadmap to improve the system’s robustness and data integrity:

**A. Fix Security and Data Consistency Gaps (High Priority):**

1. **Lock Down Case\_Parties Access:** Implement RLS policies on **case\_parties** to restrict access to case owners. E.g., *SELECT/UPDATE on case\_parties where `EXISTS(SELECT 1 FROM cases c WHERE c.id = case_parties.case_id AND c.user_id = auth.uid())`*. Also consider adding a `user_id` to case\_parties (mirroring cases) for simpler policy, or at least use the case join. This will prevent unauthorized viewing of sensitive party info. In the interim, the broad policy created should be removed or replaced. **File reference:** `supabase/migrations/20250529000000_phase_a_enhanced_efile.sql` (where case\_parties is created with open policies) would be updated with new RLS rules.

2. **Sync TypeScript Types with DB Schema:** Update `/src/types/schema.ts` to reflect current DB fields and naming. For example: use `id` (not `caseId` or `contactId`) to match Supabase records, include new fields like `payment_account_id` on cases, `original_filename` and `efile_status` on documents, etc. Also update the allowed `status` values for cases if needed (the DB doesn’t enforce specific statuses, but front-end enum should match whatever business statuses are used in practice). By aligning these, functions like Refine’s hooks will not drop unknown fields. This reduces runtime surprises where, say, `document.efile_status` is `undefined` because the type didn’t expect it. The contacts migration doc already outlines some of these needed changes. After updating types, run through the app and tests to catch places that assumed old field names.

3. **Remove or Refactor Unused Types:** Consider removing placeholders like `ServiceLog`, `Invoice`, etc., or marking them as future. Better, stub out backend support or hide related UI to avoid confusion. If service logging is imminent, implement the `service_logs` table (with doc\_id FK) and corresponding UI in one go. If not, keeping the types without usage is technical debt – developers might assume the feature exists.

4. **Complete the Migration to Supabase Data Provider:** Gradually eliminate the custom DataContext in favor of direct Supabase queries (via Refine or custom hooks) for all entities:

   * Implement a CasesProvider similar to ContactsProvider, using `Refine` with resource definitions for cases, hearings, documents, etc. Then refactor CaseList, CaseDetail to use `useList`/`useOne` from Refine instead of context state. This will unify data handling and ensure that operations like deleting a contact will automatically reflect in cases (because the UI would always pull fresh from the DB or use subscriptions).

   * Integrate real-time subscriptions for key tables if immediate sync is needed (Supabase can broadcast changes, and Refine supports live mode). This can replace manual polling or page refresh requirements.

   * During this transition, ensure that when one part of the app modifies data, the rest either listens to changes or refetches. For instance, after adding a hearing via a modal, the hearings list should refresh. Using Refine’s mutation hooks with `invalidateQueries` or Supabase’s onInsert subscription can handle this.

   * Finally, retire the DataContext and its reducer logic once all components are switched. This will greatly simplify state management and avoid dual sources of truth.

5. **Improve Cross-Entity UI Linking:** Implement the UI features to display related data across entities:

   * **Contacts \<-\> Cases:** In ContactDetail, list the cases that contact is involved in. This can be done by querying the **case\_contacts** table for that contact (via a `useMany` or custom `supabase.from('case_contacts').select('case_id, relationship_type, cases(plaintiff, defendant, status)')`). For example, a query joining case\_contacts and cases would provide case names. Then display each case as a link. If no cases, explicitly show “No cases” (as is placeholder). This addresses the current placeholder. On the flip side, in CaseDetail, list the contacts (plaintiff/defendant/attorneys) associated. The data is already there in case\_contacts; it’s a matter of fetching and displaying it (and deciding if plaintiff/defendant from case\_parties should be merged in display).

   * **Communications:** Provide a view (maybe on ContactDetail or CaseDetail or a separate Communications page) to display communications from the **contact\_communications** table. E.g., on a Contact’s page, list all communications with that contact (optionally filter by selected case). This uses `contact_id = contact.id` (and perhaps order by date). This will give end-users visibility into the interaction history that is being recorded in the DB but not surfaced. Also, add the ability to create a communication log (a form to insert a phone call note, etc.). Hook this into Supabase (simple insert into contact\_communications).

   * **Party Info on Case:** Decide how to handle **case\_parties vs contacts** on the Case UI. Currently, case.parties (petitioner/defendant info) might not be shown at all. It would be beneficial to display those on the Case detail (so the user knows the parties as filed). For instance, a section “Case Parties” listing the petitioner name (with possibly a link if that petitioner corresponds to a saved Contact) and defendants. Since case\_parties might contain info not in contacts, showing it at least as static text is important for completeness. Longer term, consider linking a case\_party to a contact (perhaps by letting user select an existing contact as a party, or offering to create a contact from party info).

   * **Workflow/Audit**: If workflow tasks and audit logs are on the roadmap, integrate those UI components as well (the CaseDetail has an `activity` tab planned that shows auditLogs, and a Workflow tasks list). Currently, `caseAuditLogs` are computed from context state in CaseDetail, but since no audit log is actually recorded, this likely shows nothing. In the roadmap, implementing the actual audit logging (on each create/update) and then populating that activity tab would be a nice-to-have, but this is lower priority than core features above.

**B. Enhance Data Integrity and Relations (Medium Priority):**

6. **Implement ServiceLog Table (if required):** To properly link **documents to the contacts they are served to**, introduce a `service_logs` table (or similarly named) with `id, document_id (FK to documents), contact_id (FK to contacts, maybe null if served to an unregistered party), attempt_date, method, result` (these fields were in the TS type). This will allow multiple service attempts per document. Use ON DELETE CASCADE on `document_id` (so if a document is deleted, its service attempts are too) and on `contact_id` (if a contact is deleted, perhaps service attempts are also removed, though one might argue to set null to keep a history that something was served to someone who’s now gone). Implement appropriate RLS (likely same as documents – user can access if they own the document’s case). This feature would close the gap of tracking document delivery and tie into case status (e.g., case status could automatically become “Served” when a related service\_log is marked success). If implementing this, update the UI: e.g., allow logging a service attempt on a document (maybe through the Document detail or as part of updating document status). If this is too heavy for now, an alternative is to reuse **contact\_communications** to log service communications – but better to keep separate, as service attempts have specific outcomes.

7. **Automate Case Status Updates:** Add logic either in database triggers or in application code to update case status based on certain events:

   * For example, a **trigger on documents** could set the parent case’s status to “Filed” when a document of type “Complaint” is inserted with status “Pending” (meaning it’s been filed) – or perhaps when `efile_status` changes to "Accepted". Or simply, when any document is filed, mark case Active. Alternatively, an **RPC function** could be created, e.g., `file_document(case_id, ...)` that internally creates the document and updates case status in one transaction. Since case statuses can vary by business rules, this needs discussion, but implementing at least a basic rule will save manual steps. According to the front-end types, statuses like “SPS PENDING” or “SPS SERVED” might correspond to service process state. If so, then similarly an update to service (via service\_log or otherwise) could flip case status to “SPS SERVED” automatically.

   * Another place is **hearings:** e.g., if a hearing outcome is entered as “Judgment” or something, maybe update case status to Closed. This is speculative, but the idea is to encode business workflow in either triggers or in the client.

   * These automations ensure **relational integrity of business state** – e.g., you can’t have a case that remains “Intake” even after filing has happened.

   * If implementing triggers, ensure RLS policies allow it (using `auth.uid()` in triggers requires security definer or exempt roles). Alternatively, do it in the API after calling `create_document_with_validation` – that API handler could follow up with a case status update (since it has service key access). Indeed, modifying the API as such might be simplest: after successful document creation, call `supabase.from('cases').update({ status: 'Filed' }).eq('id', caseId)` (with appropriate new status). Because the API uses the service role, it can override RLS to do this. This approach keeps it in application logic.

   * **File reference:** `api/documents.js` where the doc is created is a place to add this – after line 70, on success, fetch the case’s current status and decide if an update is needed, then do it.

8. **Database Indexes & Performance:** Ensure all foreign key columns have indexes (the migration `20250527000001_add_foreign_key_indexes.sql` took care of many). Notably, it attempted to add `user_id` indexes on all tables. Verify that **case\_parties.case\_id** has an index (it does from creation). Also that any frequent query fields (like documents status, or contacts email) have indexes – they do as per initial migrations. One potential index: if showing communications per contact sorted by date, ensure an index on `contact_communications.contact_id, communication_date` (there is index on contact\_id alone and date alone, which is okay). Overall, performance is likely fine for now, but as data grows, these help.

9. **Data Cleanup & Consistency Rules:** Implement measures for scenarios like the shared contact deletion issue. For example, if a contact is linked to a case not owned by them, maybe prevent deletion or warn the user. This could be at the application layer (don’t allow deleting a contact that’s in another user’s case without additional handling). Or consider **transferring ownership**: if user A created a contact that user B also uses via a case, maybe set `user_id` of that contact to user B if A deletes? However, that’s tricky with current design (no concept of multi-owner). A simpler approach: disallow contact deletion if it’s in any case that is still active (the user can instead mark it inactive). This can be enforced via a trigger or just handled in UI (Supabase RLS could also incorporate that logic but would need a complicated policy with a join to case\_contacts). For now, documenting this edge case might suffice.

10. **Testing & QA Scenarios:** As part of this roadmap, define tests for the **validation scenarios** mentioned (see next section). For each scenario (document upload, e-filing, case creation flows, etc.), write integration tests to verify the expected outcomes after implementing fixes. For example, test that after an e-filing API call, the case status indeed changes in the database (and the UI reflects it) – this ensures item 7 is done. Test that a contact associated with multiple users’ cases cannot be deleted by the owning user (or if deleted, see that it’s removed from other case views gracefully). These tests will prevent regressions as you refactor state management.

**C. Code Quality and Maintainability (Lower Priority):**

11. **Refine Error Handling and Messaging:** As the application transitions to using Refine and Supabase, ensure proper error catching and user feedback. For example, if a user tries to add a duplicate case\_contact (same contact twice to a case), the DB will throw a unique constraint error. Currently, if that happens via `useInsert` or supabase call, it should be caught and an error message shown (perhaps surfaced via the ToastContext). Auditing these edge cases and adding friendly messages will improve UX.

12. **Documentation & Comments:** Update documentation (like the developer guide) to match the new architecture. The current docs reflect planning stages (MVP features, migration steps) – once changes are implemented, ensure they are documented. For instance, document that “case\_contacts are how contacts link to cases” and maybe note any differences between case\_parties and contacts. Future developers will benefit from an updated README or code comments explaining these intricacies (e.g., why we keep case\_parties separate).

13. **Optimize Materialized View Refresh Strategy:** Not urgent, but as noted in the code comment, refreshing all dashboard views on every insert/update/delete can become expensive. In the long run, consider revising the trigger to batch refresh (maybe using a cron or listening to a notification). For now, if performance is okay, it’s fine – just keep an eye on it as case volume grows.

By following this roadmap, the platform will tighten security (especially multi-tenant concerns), eliminate data inconsistencies, and flesh out all planned features. The initial focus should be on any **security holes and data loss bugs**, then on the **feature completeness** (so users can fully utilize contacts-cases-documents relations), and finally on **refactoring for maintainability**.

Below are some example code snippets and file references for key fixes:

* **RLS Policy for Case Parties (example migration snippet):**

\-- In a new migration file e.g., 20250701000000\_secure\_case\_parties.sql  
alter table public.case\_parties add column if not exists user\_id uuid references auth.users(id) default null;  
update public.case\_parties cp  
  set user\_id \= c.user\_id  
  from public.cases c  
  where cp.case\_id \= c.id;  \-- assign existing rows to case owner

\-- Enable RLS (if not already enabled) and add policies  
alter table public.case\_parties enable row level security;  
drop policy if exists "Authenticated users can view all case parties" on public.case\_parties;  
drop policy if exists "Authenticated users can insert case parties" on public.case\_parties;  
drop policy if exists "Authenticated users can update case parties" on public.case\_parties;  
drop policy if exists "Authenticated users can delete case parties" on public.case\_parties;

create policy "Users can manage their own case parties"  
  on public.case\_parties for all  
  to authenticated  
  using ( auth.uid() \= user\_id )  
  with check ( auth.uid() \= user\_id );

*Rationale:* This adds a `user_id` to case\_parties set to the owning case’s user, and restricts all operations to that user. Now case\_parties aligns with the multi-tenant model (only case owner manipulates the parties). In the code above, we dropped the overly-permissive policies created initially and replaced them.

* **TypeScript model alignment (Contact example):**

// Before:  
export interface Contact {  
  contactId: string;  
  name: string;  
  // ...  
  createdAt: string;  
  updatedAt: string;  
}

// After:  
export interface Contact {  
  id: string;  
  name: string;  
  role: 'Attorney' | 'Paralegal' | 'PM' | 'Client' | 'Other';  
  email: string;  
  phone?: string;  
  company?: string;  
  address?: string;  
  notes?: string;  
  created\_at: string;  
  updated\_at: string;  
}

This change follows the plan outlined in documentation and matches the DB (note the snake\_case for created\_at). Similar changes would apply for Case (use `id`, `created_at`, etc., and update the status enum if needed).

* **Front-end contact-case linking (snippet for ContactDetail showing cases):**

// Inside ContactDetail component, after fetching contact:  
const { data: casesData } \= useMany\<CaseContacts\>({  
    resource: 'case\_contacts',  
    filters: \[{ field: 'contact\_id', operator: 'eq', value: id }\],  
    meta: { include: 'cases(id, plaintiff, defendant, status)' }  // pseudo-code: refine meta to include relational fields  
});  
const caseLinks \= casesData?.data || \[\];

// ... in JSX:  
\<Card\>  
  \<h2\>Related Cases\</h2\>  
  {caseLinks.length \> 0 ? (  
    \<ul\>  
      {caseLinks.map(cc \=\> (  
        \<li key={cc.case\_id}\>  
           {/\* assume cc has embedded case data \*/}  
           \<Link to={\`/cases/${cc.case\_id}\`}\>{cc.cases.plaintiff} vs {cc.cases.defendant}\</Link\>   
           \<span\>({cc.relationship\_type})\</span\>  
        \</li\>  
      ))}  
    \</ul\>  
  ) : (  
    \<p\>No cases associated with this contact.\</p\>  
  )}  
\</Card\>

This pseudo-code uses a hypothetical `useMany` hook to fetch case\_contacts for the contact and join the related case info. The actual implementation might require adjusting how to get the join (Refine’s data provider might not support deep include; alternatively, perform two queries: get case\_ids then fetch those cases). The end result is the UI populating the previously empty “Related Cases” section with real data.

* **Case status update after e-filing (inside `api/documents.js`):**

// After inserting the document successfully  
if (\!error) {  
  // If the e-filing was submitted successfully, update case status to "Filed"  
  const updateRes \= await supabase  
    .from('cases')  
    .update({ status: 'Active' })  // or 'Filed', depending on terminology  
    .eq('id', caseId);  
  if (updateRes.error) {  
    console.error('Failed to update case status:', updateRes.error);  
    // Not critical to throw; log for now.  
  }  
}

This ensures that once a document (like a complaint) is filed, the case’s status reflects it. Note: `'Active'` is assumed to be the intended status after intake. In the materialized views, they count 'Active' and 'Closed' cases, implying those statuses are used in practice, even if the TS enum hadn’t listed them.

* **Service log table creation (migration example):**

create table public.service\_logs (  
  id uuid primary key default gen\_random\_uuid(),  
  document\_id uuid not null references public.documents(id) on delete cascade,  
  contact\_id uuid references public.contacts(id) on delete set null,  
  method text not null check (method in ('Sheriff', 'Process Server', 'Certified Mail', 'Email')),  
  attempt\_date timestamptz not null default now(),  
  result text not null check (result in ('Success', 'Failed', 'Pending')),  
  notes text,  
  created\_at timestamptz default now()  
);  
\-- Index for performance:  
create index idx\_service\_logs\_doc on public.service\_logs(document\_id);  
alter table public.service\_logs enable row level security;  
create policy "Service logs same access as document"  
  on public.service\_logs for select using (  
    auth.uid() \= (select user\_id from public.documents d where d.id \= service\_logs.document\_id)  
  );  
\-- (and similar policies for insert/update if needed)

This is optional but if added, it plugs the gap for tracking service attempts. The policy piggybacks on the document’s user\_id (assuming document.user\_id is set to case owner by trigger). The front-end then can fetch service\_logs for a document to show whether service was successful, and potentially automatically update document.status based on the latest service log result.

Implementing the above fixes and enhancements in a staged manner will significantly strengthen the platform. Focus first on **data security (RLS fixes)** and **core consistency (type alignment and single-source-of-truth state)**, then tackle the **user-facing improvements (UI linking, auto-updates)**. By the end, the system will be more secure, easier to maintain, and provide a more seamless user experience across the case, contact, document, and hearing modules.

## **5\. Validation Scenarios**

After applying the fixes, we should verify several key usage scenarios to ensure the system functions as intended and that our changes resolved the identified issues:

* **Document Upload Association:** When a user uploads a document (e.g., via an “Add Document” form on a case page), confirm that the document is correctly linked to the chosen case and visible in that case’s document list. For instance, create a new document of type "Complaint" for Case \#123. In the database, check that `documents.case_id = 123` for the new record, and that `documents.user_id` was auto-set to the case’s owner. In the UI, navigate to Case \#123’s detail page and ensure the document appears under its Documents tab (with correct type, status). Also verify the RLS does not block the view: the case owner should retrieve their document (policy allows it), and other users cannot (policy requires matching case ownership). This tests that **our RLS and triggers for documents are working** and that the front-end correctly refreshes the case’s document list (especially after refactoring to remove DataContext, ensure a refetch or subscription updates the list immediately).

* **E-Filing Submission Effects:** Submit an e-filing (this might involve calling the `api/documents` endpoint or simulating the process if UI isn’t there yet). Use the e-filing context or Cypress tests to send a POST to `/api/documents` with a valid caseId and sample envelopeId/filingId. Expected outcomes:

  1. A new document is created in the **documents** table with the given `envelope_id` and `efile_status` (“Submitted” or similar). The `create_document_with_validation` function should prevent duplicates – test by submitting the same envelopeId/filingId twice and expect a **409 Conflict** error (“already exists”). This validates the function’s uniqueness check.

  2. The related case’s status should update to "Active/Filed" (if we implemented that). So after submission, fetch the case from the DB or via the UI – its status field should now reflect the new state (no longer “Intake”). This confirms our additional logic triggers correctly.

  3. Check relational integrity: the document’s `case_id` points to the right case, and if you fetch documents for that case, it’s included. Also, verify that the **dashboard metrics** updated (the materialized views should count this new document in “new\_documents\_last\_7\_days” etc., which indicates the refresh trigger fired).

  4. If applicable, check that a petitioner was created. The e-filing case creation (`api/cases`) allows sending petitioner/defendant info. If we run through a full e-filing case creation (Case with parties \+ then a filing), ensure the **case\_parties** entries exist and are correct (petitioner’s name, etc.), and that they are retrievable via a secure path (since we added RLS, verify the case owner can still query case\_parties). This scenario touches many parts: case creation, party insert, document insert, case update. It’s a comprehensive integration test of the “enhanced e-filing” Phase A.

* **Case Creation Integration:** Create a new case through the regular app flow (not e-filing, if such a form exists, or via an admin interface). Typically, this might be a form in the UI that calls Supabase `.insert()` on cases or uses the API. After creation:

  1. Ensure the case appears in the Cases list for that user. If using Refine, this should update automatically or after navigation. If we removed DataContext, confirm the list is refreshed. If using DataContext still, ensure the dispatch to add case was done.

  2. Immediately try to add a document or schedule a hearing for that case to ensure that workflow is smooth. The new case ID should be selectable in the document form or passed in context so that the new document/hearing automatically links to it. This validates that the **case creation and subsequent related operations are integrated**. In the old state, if DataContext didn’t have the new case, the document form might lack it – after refactor, perhaps we directly call API so it’s fine. This test will catch any missing state updates.

  3. If the case form includes adding initial contacts (some systems allow adding plaintiff/defendant contacts as part of case open), ensure those create appropriate **case\_contacts** entries and that those contacts appear in the contact list. Given current UI, this might not be present; instead, one would add contacts to case after creation. Test adding a contact to the case via the UI (if implemented) or directly by inserting into case\_contacts table. Then verify on CaseDetail that the contact shows up, and on ContactDetail that the case shows up (covering our new UI linking).

* **Document Serving and Status Change:** (If service logging implemented) upload a document, then log a service attempt (e.g., mark as Served via a form or directly inserting a service\_log with result 'Success'). After this:

  1. The document’s status might auto-change to "Served" (if we decide to do that in a trigger when service\_log is inserted, or perhaps the user manually updates it). Verify the cascade of effects: case status might change from "Active" to "Waiting for Hearing" or something – this depends on business rules, which might not be automated yet. At least, confirm no referential errors (e.g., the service\_log’s contact\_id correctly references a contact involved in the case).

  2. Ensure that the UI reflects the service attempt – e.g., the Document detail page could show "Served on \[date\]" if we expose service\_logs or update the document record.

* **Row-Level Security scenario tests:** Try accessing data as a different user to ensure RLS is correctly blocking/allowing:

  1. Log in as User A, create a case and some contacts, etc. Log out, log in as User B (a completely separate account). Ensure User B **cannot query User A’s case or related records**. This can be tested by calling the Supabase REST API or using Refine: e.g., `useList({ resource: 'cases' })` for User B should not return User A’s cases. Or attempt to directly fetch by ID – it should return nothing due to RLS (unless we explicitly allowed shared contacts via case, which we did in policy for viewing but insertion/update are still forbidden). Also, ensure that **case\_parties** for User A’s case are not visible to User B after we fix RLS (before fix, they would have been visible).

  2. If you intentionally violate a policy (like attempt to insert a case\_contact linking your contact to someone else’s case), it should fail. For example, User B attempts to insert `case_contacts` with `case_id` \= User A’s case and `contact_id` \= User B’s contact. The RLS “WITH CHECK (auth.uid() \= user\_id AND case.user\_id \= auth.uid())” on case\_contacts should prevent this (since the case’s user\_id is not B). Confirm that Supabase returns a permission error. This validates that our enhanced security model is working as intended to block cross-tenant data tampering.

* **Contact Deletion edge case:** As described, if a contact is used in another user’s case, see what happens on deletion:

  1. Share scenario: User A creates Contact X and adds to Case A1. User B creates Case B1 and also adds Contact X to it (this is possible because User A’s contact is visible to B via the case link policy, and presumably the UI might allow selecting existing contacts). Now User A deletes Contact X. In the DB, contact X (owned by A) will be deleted (since A is owner), and cascading will remove the link from case\_contacts for both A1 and B1, and any communications. Now check Case B1’s contacts – Contact X is gone from case\_contacts (so effectively removed from the case without B explicitly doing so). This scenario is currently allowed (there’s no constraint to stop A from deleting a contact that B is merely “using”). We should validate how the system behaves: Case B1 now lacks a contact it used to have – if that contact was the only plaintiff, the case is missing a party in UI (though case\_parties might still have that defendant if it was also entered there separately).

  2. This reveals a design decision: maybe *contacts should be personal and not shareable at all*, forcing each user to create their own contact record even if it’s the same person. The system did allow viewing shared contacts, but not transferring ownership. If this deletion scenario is considered problematic, we might implement a prevention: do not allow deletion if the contact is linked to another user’s case. This could be done via a trigger that checks for any case\_contacts where case.user\_id \!= contact.user\_id, and abort if found.

  3. For validation, see if any trigger or logic currently prevents deletion in such a scenario – likely not. So the expected outcome is contact deletion cascades relationships and leaves the other case without that contact. We should then confirm that the Case B1 UI doesn’t break – probably it will just show no contact where previously one was. This isn’t a crashing bug, but a logical one. Document this behavior or adjust accordingly. For now, a QA note is that **deleting a shared contact removes it from other cases** – ensure users are aware or the UI restricts it.

* **End-to-End Use Case:** Finally, simulate a typical end-to-end workflow as a user:

  1. Create a new case (enter basic info).

  2. Add an existing contact as a plaintiff or create a new contact and associate as plaintiff.

  3. Upload a document for the case (like a Complaint).

  4. Mark the document as filed/served (depending on process).

  5. Schedule a hearing for the case.

  6. Verify that after each step, the relevant data appears in the dashboards (the metrics counts increment appropriately), and on the case detail all entities show (contact in contacts list, document in docs list, hearing in hearings list).

  7. Then close the case (change status to Closed) and ensure it disappears from “Active cases” on dashboard, etc.

This broad scenario will confirm that all pieces – contacts, cases, documents, hearings – work in concert after our improvements. It will also exercise any triggers and policies to ensure nothing is erroneously blocked (for example, check that our triggers setting user\_id do not interfere with the service role inserts – they shouldn’t, as they use `auth.uid()` which for service key might be null; in testing we may need to adjust triggers to handle service key context, possibly by using `current_setting('request.jwt.claims.sub')` instead, as partially addressed by the `get_current_user_id()` function in the migrations).

By performing these validation steps, we can be confident that the codebase enhancements have achieved the desired outcomes: **each document is properly linked and visible in its case** (and only its case’s owner can see it), **e-filing updates propagate to case status** maintaining consistency, **case creation flows into other modules smoothly**, and **contacts and associated entities behave predictably** (with no unauthorized data leakage and improved UI visibility of relationships). Any anomalies discovered during this testing phase can then be addressed before deployment, ensuring a robust case management platform for WSZLLP.

**Sources:**

* Database schema and RLS policies from Supabase migration files

* Application context and type definitions

* API route implementations for case and document creation

