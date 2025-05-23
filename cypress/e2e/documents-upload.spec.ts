describe('Documents Upload', () => {
  beforeEach(() => {
    // Mock Supabase auth
    cy.window().then((win) => {
      win.localStorage.setItem('sb-karvbtpygbavvqydfcju-auth-token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'mock-user-id', email: 'test@example.com' }
      }));
    });

    // Intercept Supabase API calls
    cy.intercept('GET', '**/rest/v1/cases?select=id%2Cplaintiff%2Cdefendant*', {
      statusCode: 200,
      body: [
        {
          id: 'case-1',
          plaintiff: 'Smith Property LLC',
          defendant: 'John Doe'
        },
        {
          id: 'case-2', 
          plaintiff: 'Oak Apartments',
          defendant: 'Jane Smith'
        }
      ]
    }).as('getCases');

    // Mock storage upload
    cy.intercept('POST', '**/storage/v1/object/documents/**', {
      statusCode: 200,
      body: { Key: 'documents/test-file.pdf' }
    }).as('uploadFile');

    // Mock storage public URL
    cy.intercept('GET', '**/storage/v1/object/public/documents/**', {
      statusCode: 200,
      body: { publicUrl: 'https://mock-storage.supabase.co/documents/test-file.pdf' }
    }).as('getPublicUrl');

    // Mock document creation
    cy.intercept('POST', '**/rest/v1/documents', {
      statusCode: 201,
      body: [{
        id: 'doc-123',
        case_id: 'case-1',
        type: 'Complaint',
        file_url: 'https://mock-storage.supabase.co/documents/test-file.pdf',
        status: 'Pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]
    }).as('createDocument');

    // Mock documents list query for verification
    cy.intercept('GET', '**/rest/v1/documents?select=*', {
      statusCode: 200,
      body: [
        {
          id: 'doc-123',
          case_id: 'case-1', 
          type: 'Complaint',
          file_url: 'https://mock-storage.supabase.co/documents/test-file.pdf',
          status: 'Pending',
          service_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    }).as('getDocuments');

    // Visit the upload page
    cy.visit('/documents/upload');
  });

  it('should load the upload form with cases', () => {
    cy.wait('@getCases');
    
    // Check page title and description
    cy.contains('h1', 'Upload Documents').should('be.visible');
    cy.contains('Upload legal documents and associate them with cases').should('be.visible');

    // Check that case dropdown is populated
    cy.get('select[name="caseId"]').should('not.be.disabled');
    cy.get('select[name="caseId"] option').should('have.length.greaterThan', 1);
    
    // Check document type dropdown
    cy.get('select[name="documentType"]').should('be.visible');
    cy.get('select[name="documentType"]').should('have.value', 'Other');

    // Check upload area
    cy.contains('Drag and drop files here').should('be.visible');
    cy.contains('Supports PDF, DOC, DOCX files up to 10MB each').should('be.visible');
  });

  it('should validate file types', () => {
    cy.wait('@getCases');

    // Create a test file with invalid type
    const fileName = 'test-image.jpg';
    const fileContent = 'fake image content';
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: 'image/jpeg'
    }, { force: true });

    // Should show error for invalid file type
    cy.contains('Only PDF, DOC, and DOCX files are allowed').should('be.visible');
    
    // Upload button should be disabled or show error
    cy.get('button').contains('Upload').should('be.disabled');
  });

  it('should successfully upload a valid document', () => {
    cy.wait('@getCases');

    // Select a case
    cy.get('select').first().select('Smith Property LLC v. John Doe');
    
    // Select document type
    cy.get('select').eq(1).select('Complaint');

    // Upload a valid PDF file
    const fileName = 'test-complaint.pdf';
    const fileContent = '%PDF-1.4 fake pdf content';
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: 'application/pdf'
    }, { force: true });

    // Should show the file in the list
    cy.contains(fileName).should('be.visible');
    cy.contains('MB').should('be.visible'); // File size

    // Click upload button
    cy.get('button').contains('Upload').should('not.be.disabled');
    cy.get('button').contains('Upload').click();

    // Should show uploading state
    cy.contains('Uploading...').should('be.visible');
    
    // Wait for API calls
    cy.wait('@uploadFile');
    cy.wait('@createDocument');

    // Should show success state
    cy.contains('Upload Complete').should('be.visible');
    cy.contains('1 document uploaded successfully').should('be.visible');

    // Should show success icon for the file
    cy.get('[data-testid="success-icon"]').should('be.visible');

    // Should show "View Documents" button
    cy.get('button').contains('View Documents').should('be.visible');
  });

  it('should handle upload errors gracefully', () => {
    cy.wait('@getCases');

    // Mock storage upload failure
    cy.intercept('POST', '**/storage/v1/object/documents/**', {
      statusCode: 500,
      body: { error: 'Storage upload failed' }
    }).as('uploadFileFail');

    // Select a case and file
    cy.get('select').first().select('Smith Property LLC v. John Doe');
    
    const fileName = 'test-complaint.pdf';
    const fileContent = '%PDF-1.4 fake pdf content';
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: 'application/pdf'
    }, { force: true });

    // Click upload
    cy.get('button').contains('Upload').click();

    // Wait for failed upload
    cy.wait('@uploadFileFail');

    // Should show error state
    cy.contains('Upload Errors').should('be.visible');
    cy.contains('1 document failed to upload').should('be.visible');

    // File should show error icon
    cy.get('[data-testid="error-icon"]').should('be.visible');
  });

  it('should allow removing files before upload', () => {
    cy.wait('@getCases');

    // Upload multiple files
    const files = [
      {
        contents: Cypress.Buffer.from('%PDF-1.4 fake pdf 1'),
        fileName: 'test-1.pdf',
        mimeType: 'application/pdf'
      },
      {
        contents: Cypress.Buffer.from('%PDF-1.4 fake pdf 2'),
        fileName: 'test-2.pdf',
        mimeType: 'application/pdf'
      }
    ];
    
    cy.get('input[type="file"]').selectFile(files, { force: true });

    // Should show both files
    cy.contains('test-1.pdf').should('be.visible');
    cy.contains('test-2.pdf').should('be.visible');

    // Remove first file
    cy.get('button[aria-label="Remove file"]').first().click();

    // Should only show second file
    cy.contains('test-1.pdf').should('not.exist');
    cy.contains('test-2.pdf').should('be.visible');
  });

  it('should reset form correctly', () => {
    cy.wait('@getCases');

    // Fill out form
    cy.get('select').first().select('Smith Property LLC v. John Doe');
    cy.get('select').eq(1).select('Complaint');
    
    const fileName = 'test-complaint.pdf';
    const fileContent = '%PDF-1.4 fake pdf content';
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: 'application/pdf'
    }, { force: true });

    // Should show file
    cy.contains(fileName).should('be.visible');

    // Click reset
    cy.get('button').contains('Reset').click();

    // Form should be cleared
    cy.contains(fileName).should('not.exist');
    cy.get('select').eq(1).should('have.value', 'Other');
  });

  it('should navigate back to documents list', () => {
    // Click back button
    cy.get('button').contains('Back to Documents').click();
    
    // Should navigate to documents page
    cy.url().should('include', '/documents');
    cy.contains('Document Management').should('be.visible');
  });

  it('should navigate to documents list after successful upload', () => {
    cy.wait('@getCases');

    // Complete upload flow
    cy.get('select').first().select('Smith Property LLC v. John Doe');
    
    const fileName = 'test-complaint.pdf';
    const fileContent = '%PDF-1.4 fake pdf content';
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: 'application/pdf'
    }, { force: true });

    cy.get('button').contains('Upload').click();

    // Wait for upload completion
    cy.wait('@uploadFile');
    cy.wait('@createDocument');

    // Click "View Documents" button
    cy.get('button').contains('View Documents').click();
    
    // Should navigate to documents list
    cy.url().should('include', '/documents');
  });
});