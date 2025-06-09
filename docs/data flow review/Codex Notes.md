Notes

The current migrations define create\_case\_with\_transaction and create\_document\_with\_validation without assigning user\_id during insertion. Lines 53‑66 and 108‑129 in supabase/migrations/20250528214849\_add\_efile\_production.sql show the relevant INSERT statements, but no user\_id column is set.  
Row‑level security policies rely on the user\_id column to enforce ownership. The policies in supabase/migrations/20250527000000\_fix\_security\_and\_rls.sql enforce that auth.uid() must match user\_id when selecting or modifying cases and documents. Because the API endpoints invoke these functions with a service-role key, auth.uid() resolves to NULL, leaving user\_id unset and hiding the records from users.

The TypeScript schemas under src/types/schema.ts only include a minimal set of fields. For example, the caseSchema definition lists caseId, plaintiff, defendant, address, status, and timestamps, but lacks many columns added later in migrations.

Document uploads require manual case selection: DocumentUploadForm.tsx initializes selectedCaseId from a prop and fetches all cases to populate a dropdown. A similar pattern appears in EFileSubmissionForm.tsx, where new cases are created via API calls, then related documents are inserted with explicit caseId parameters.

Despite e‑filing submissions being recorded, there is no hook to update a case’s status afterward; the success handler in EFileSubmissionForm.tsx only logs notifications and resets the form, leaving case status unchanged. Additionally, the database lacks any table linking documents to contacts—no migration mentions a document\_contacts table.

### **Recommended Strategy**

1. Persist User Ownership  
   * Extend both RPC functions (create\_case\_with\_transaction and create\_document\_with\_validation) to accept user\_id and insert it explicitly. Ensure API handlers pass the authenticated user’s UUID when calling these functions.  
   * This prevents RLS from hiding newly created records.  
2. Synchronize TypeScript Models  
   * Update src/types/schema.ts to mirror the latest database schema, adding fields such as userId, paymentAccountId, envelopeId, efileStatus, and others introduced in recent migrations.  
3. Case Context Automation  
   * Modify DocumentUploadForm, HearingForm, and EFileSubmissionForm to detect the active case via route parameters or context so that case selection is automatic. This minimizes user errors and ensures new documents or hearings associate with the correct case.  
4. Associate Documents with Contacts  
   * Introduce a document\_contacts junction table and link uploaded or filed documents to all contacts tied to the same case. Update Supabase migrations and API logic accordingly.  
5. Update Case Status After E‑filing  
   * After a successful e‑filing submission, update the corresponding case record’s status (e.g., to “Filed”) and propagate the change through the DataContext so the UI reflects the new status.

Addressing these areas will align database operations with RLS policies, keep TypeScript definitions consistent, reduce manual steps in the UI, and ensure cross-entity links remain synchronized.

