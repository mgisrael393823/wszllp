import { supabase } from '../lib/supabaseClient';

// Dashboard metrics types
export interface DashboardMetrics {
  // Cases
  totalCases: number;
  activeCases: number;
  intakeCases: number;
  closedCases: number;
  newCasesLast30Days: number;
  newCasesLast7Days: number;
  avgCaseDurationDays: number;
  
  // Hearings
  totalHearings: number;
  upcomingHearings: number;
  hearingsNext30Days: number;
  hearingsNext7Days: number;
  hearingsNext24Hours: number;
  completedHearings: number;
  missedHearings: number;
  
  // Documents
  totalDocuments: number;
  pendingDocuments: number;
  servedDocuments: number;
  failedDocuments: number;
  newDocumentsLast30Days: number;
  newDocumentsLast7Days: number;
  casesWithDocuments: number;
  complaintDocuments: number;
  summonsDocuments: number;
  motionDocuments: number;
  
  // Contacts
  totalContacts: number;
  clientContacts: number;
  opposingPartyContacts: number;
  attorneyContacts: number;
  courtContacts: number;
  newContactsLast30Days: number;
  newContactsLast7Days: number;
  
  // Activity
  casesUpdatedLast24h: number;
  casesUpdatedLast7Days: number;
  hearingsUpdatedLast24h: number;
  hearingsUpdatedLast7Days: number;
  documentsUpdatedLast24h: number;
  documentsUpdatedLast7Days: number;
  totalActivityLast24h: number;
  
  // Computed KPIs
  activeCasesPercentage: number;
  pendingDocumentsPercentage: number;
  hearingsNext30DaysPercentage: number;
  
  // Metadata
  lastRefreshed: string;
}

export interface KPICard {
  id: string;
  title: string;
  value: number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  progress?: {
    current: number;
    max: number;
    variant: 'primary' | 'success' | 'warning' | 'error';
  };
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'error' | 'info';
  };
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  entityType: 'Case' | 'Hearing' | 'Document' | 'Contact';
  entityId: string;
  action: 'Create' | 'Update' | 'Delete';
}

class DashboardService {
  /**
   * Fetch all dashboard metrics from materialized views
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const { data, error } = await supabase
        .from('dashboard_combined_metrics')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching dashboard metrics:', error);
        // If table doesn't exist, fall back to direct queries
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('Dashboard metrics table not found, using direct queries...');
          return await this.getDashboardMetricsDirect();
        }
        // For any error, try direct queries as fallback
        console.log('Falling back to direct queries due to error');
        return await this.getDashboardMetricsDirect();
      }

      return {
        // Cases
        totalCases: data.total_cases || 0,
        activeCases: data.active_cases || 0,
        intakeCases: data.intake_cases || 0,
        closedCases: data.closed_cases || 0,
        newCasesLast30Days: data.new_cases_last_30_days || 0,
        newCasesLast7Days: data.new_cases_last_7_days || 0,
        avgCaseDurationDays: data.avg_case_duration_days || 0,
        
        // Hearings
        totalHearings: data.total_hearings || 0,
        upcomingHearings: data.upcoming_hearings || 0,
        hearingsNext30Days: data.hearings_next_30_days || 0,
        hearingsNext7Days: data.hearings_next_7_days || 0,
        hearingsNext24Hours: data.hearings_next_24_hours || 0,
        completedHearings: data.completed_hearings || 0,
        missedHearings: data.missed_hearings || 0,
        
        // Documents
        totalDocuments: data.total_documents || 0,
        pendingDocuments: data.pending_documents || 0,
        servedDocuments: data.served_documents || 0,
        failedDocuments: data.failed_documents || 0,
        newDocumentsLast30Days: data.new_documents_last_30_days || 0,
        newDocumentsLast7Days: data.new_documents_last_7_days || 0,
        casesWithDocuments: data.cases_with_documents || 0,
        complaintDocuments: data.complaint_documents || 0,
        summonsDocuments: data.summons_documents || 0,
        motionDocuments: data.motion_documents || 0,
        
        // Contacts
        totalContacts: data.total_contacts || 0,
        clientContacts: data.client_contacts || 0,
        opposingPartyContacts: data.opposing_party_contacts || 0,
        attorneyContacts: data.attorney_contacts || 0,
        courtContacts: data.court_contacts || 0,
        newContactsLast30Days: data.new_contacts_last_30_days || 0,
        newContactsLast7Days: data.new_contacts_last_7_days || 0,
        
        // Activity
        casesUpdatedLast24h: data.cases_updated_last_24h || 0,
        casesUpdatedLast7Days: data.cases_updated_last_7_days || 0,
        hearingsUpdatedLast24h: data.hearings_updated_last_24h || 0,
        hearingsUpdatedLast7Days: data.hearings_updated_last_7_days || 0,
        documentsUpdatedLast24h: data.documents_updated_last_24h || 0,
        documentsUpdatedLast7Days: data.documents_updated_last_7_days || 0,
        totalActivityLast24h: data.total_activity_last_24h || 0,
        
        // Computed KPIs
        activeCasesPercentage: data.active_cases_percentage || 0,
        pendingDocumentsPercentage: data.pending_documents_percentage || 0,
        hearingsNext30DaysPercentage: data.hearings_next_30_days_percentage || 0,
        
        // Metadata
        lastRefreshed: data.last_refreshed || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Dashboard service error:', error);
      // Return fallback empty metrics
      return this.getEmptyMetrics();
    }
  }

  /**
   * Generate KPI cards from metrics data
   */
  generateKPICards(metrics: DashboardMetrics): KPICard[] {
    return [
      {
        id: 'total-cases',
        title: 'Total Cases',
        value: metrics.totalCases,
        subtitle: `${metrics.activeCases} active cases`,
        progress: {
          current: metrics.activeCases,
          max: metrics.totalCases,
          variant: 'primary'
        },
        trend: {
          value: metrics.newCasesLast7Days,
          isPositive: metrics.newCasesLast7Days > 0,
          label: 'new this week'
        }
      },
      {
        id: 'upcoming-hearings',
        title: 'Upcoming Hearings',
        value: metrics.upcomingHearings,
        subtitle: `${metrics.hearingsNext30Days} in next 30 days`,
        badge: metrics.hearingsNext24Hours > 0 ? {
          text: `${metrics.hearingsNext24Hours} urgent`,
          variant: 'warning'
        } : undefined,
        trend: {
          value: metrics.hearingsNext7Days,
          isPositive: true,
          label: 'next 7 days'
        }
      },
      {
        id: 'document-status',
        title: 'Document Status',
        value: metrics.totalDocuments,
        subtitle: `${metrics.pendingDocuments} pending review`,
        progress: {
          current: metrics.servedDocuments,
          max: metrics.totalDocuments,
          variant: metrics.pendingDocuments > 5 ? 'warning' : 'success'
        },
        badge: metrics.failedDocuments > 0 ? {
          text: `${metrics.failedDocuments} failed`,
          variant: 'error'
        } : undefined
      },
      {
        id: 'system-activity',
        title: 'System Activity',
        value: metrics.totalActivityLast24h,
        subtitle: `${metrics.casesUpdatedLast24h + metrics.hearingsUpdatedLast24h + metrics.documentsUpdatedLast24h} updates today`,
        trend: {
          value: metrics.totalActivityLast24h,
          isPositive: metrics.totalActivityLast24h > 0,
          label: 'last 24 hours'
        }
      },
      {
        id: 'contacts',
        title: 'Contacts',
        value: metrics.totalContacts,
        subtitle: `${metrics.clientContacts} clients`,
        trend: {
          value: metrics.newContactsLast7Days,
          isPositive: metrics.newContactsLast7Days > 0,
          label: 'new this week'
        }
      },
      {
        id: 'case-efficiency',
        title: 'Case Efficiency',
        value: Math.round(metrics.activeCasesPercentage),
        subtitle: 'Active case percentage',
        progress: {
          current: metrics.activeCases,
          max: metrics.totalCases,
          variant: metrics.activeCasesPercentage > 70 ? 'warning' : 'success'
        }
      }
    ];
  }

  /**
   * Get recent activity from database
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      // Get recent case updates
      const { data: caseUpdates } = await supabase
        .from('cases')
        .select('id, plaintiff, defendant, updatedat, createdat')
        .order('updatedat', { ascending: false })
        .limit(limit);

      // Get recent hearing updates
      const { data: hearingUpdates } = await supabase
        .from('hearings')
        .select('id, court_name, hearing_date, updated_at, created_at, case_id')
        .order('updated_at', { ascending: false })
        .limit(limit);

      // Get recent document updates
      const { data: documentUpdates } = await supabase
        .from('documents')
        .select('id, type, status, updated_at, created_at, case_id')
        .order('updated_at', { ascending: false })
        .limit(limit);

      // Combine and sort all activities
      const activities: RecentActivity[] = [];

      // Process case updates
      caseUpdates?.forEach(item => {
        const isNew = new Date(item.updatedat).getTime() === new Date(item.createdat).getTime();
        activities.push({
          id: `case-${item.id}`,
          title: isNew ? 'New Case Created' : 'Case Updated',
          description: `${item.plaintiff} v. ${item.defendant}`,
          timestamp: item.updatedat,
          entityType: 'Case',
          entityId: item.id,
          action: isNew ? 'Create' : 'Update'
        });
      });

      // Process hearing updates
      hearingUpdates?.forEach(item => {
        const isNew = new Date(item.updated_at).getTime() === new Date(item.created_at).getTime();
        activities.push({
          id: `hearing-${item.id}`,
          title: isNew ? 'Hearing Scheduled' : 'Hearing Updated',
          description: `${item.court_name} - ${new Date(item.hearing_date).toLocaleDateString()}`,
          timestamp: item.updated_at,
          entityType: 'Hearing',
          entityId: item.id,
          action: isNew ? 'Create' : 'Update'
        });
      });

      // Process document updates
      documentUpdates?.forEach(item => {
        const isNew = new Date(item.updated_at).getTime() === new Date(item.created_at).getTime();
        activities.push({
          id: `document-${item.id}`,
          title: isNew ? 'Document Added' : 'Document Updated',
          description: `${item.type} - ${item.status}`,
          timestamp: item.updated_at,
          entityType: 'Document',
          entityId: item.id,
          action: isNew ? 'Create' : 'Update'
        });
      });

      // Sort by timestamp and return top activities
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  /**
   * Manually refresh materialized views
   */
  async refreshDashboardData(): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('refresh_dashboard_materialized_views');
      
      if (error) {
        console.error('Error refreshing dashboard data:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      return false;
    }
  }

  /**
   * Check if dashboard data is stale (older than 1 hour)
   */
  isDashboardDataStale(lastRefreshed: string): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(lastRefreshed) < oneHourAgo;
  }

  /**
   * Get dashboard metrics directly from tables (fallback when materialized view doesn't exist)
   */
  private async getDashboardMetricsDirect(): Promise<DashboardMetrics> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Fetch case metrics
      const { data: cases } = await supabase
        .from('cases')
        .select('*');
      
      const totalCases = cases?.length || 0;
      const activeCases = cases?.filter(c => !['CLOSED', 'DISMISSED'].includes(c.status)).length || 0;
      const intakeCases = cases?.filter(c => c.status === 'INTAKE').length || 0;
      const closedCases = cases?.filter(c => ['CLOSED', 'DISMISSED'].includes(c.status)).length || 0;
      const newCasesLast30Days = cases?.filter(c => new Date(c.createdat) >= thirtyDaysAgo).length || 0;
      const newCasesLast7Days = cases?.filter(c => new Date(c.createdat) >= sevenDaysAgo).length || 0;
      const casesUpdatedLast24h = cases?.filter(c => new Date(c.updatedat) >= twentyFourHoursAgo).length || 0;
      const casesUpdatedLast7Days = cases?.filter(c => new Date(c.updatedat) >= sevenDaysAgo).length || 0;

      // Calculate average case duration for closed cases
      const closedCasesWithDuration = cases?.filter(c => 
        ['CLOSED', 'DISMISSED'].includes(c.status) && c.createdat && c.updatedat
      ) || [];
      
      const avgCaseDurationDays = closedCasesWithDuration.length > 0
        ? closedCasesWithDuration.reduce((sum, c) => {
            const duration = (new Date(c.updatedat).getTime() - new Date(c.createdat).getTime()) / (1000 * 60 * 60 * 24);
            return sum + duration;
          }, 0) / closedCasesWithDuration.length
        : 0;

      // Fetch hearing metrics
      const { data: hearings } = await supabase
        .from('hearings')
        .select('*');
      
      const totalHearings = hearings?.length || 0;
      const upcomingHearings = hearings?.filter(h => new Date(h.hearing_date) > now).length || 0;
      const hearingsNext30Days = hearings?.filter(h => {
        const hearingDate = new Date(h.hearing_date);
        return hearingDate > now && hearingDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }).length || 0;
      const hearingsNext7Days = hearings?.filter(h => {
        const hearingDate = new Date(h.hearing_date);
        return hearingDate > now && hearingDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }).length || 0;
      const hearingsNext24Hours = hearings?.filter(h => {
        const hearingDate = new Date(h.hearing_date);
        return hearingDate > now && hearingDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }).length || 0;
      const completedHearings = hearings?.filter(h => h.status === 'COMPLETED').length || 0;
      const missedHearings = hearings?.filter(h => 
        h.status === 'MISSED' || (new Date(h.hearing_date) < now && h.status === 'SCHEDULED')
      ).length || 0;
      const hearingsUpdatedLast24h = hearings?.filter(h => new Date(h.updated_at) >= twentyFourHoursAgo).length || 0;
      const hearingsUpdatedLast7Days = hearings?.filter(h => new Date(h.updated_at) >= sevenDaysAgo).length || 0;

      // Fetch document metrics
      const { data: documents } = await supabase
        .from('documents')
        .select('*');
      
      const totalDocuments = documents?.length || 0;
      const pendingDocuments = documents?.filter(d => d.status === 'PENDING').length || 0;
      const servedDocuments = documents?.filter(d => d.status === 'SERVED').length || 0;
      const failedDocuments = documents?.filter(d => d.status === 'FAILED').length || 0;
      const newDocumentsLast30Days = documents?.filter(d => new Date(d.created_at) >= thirtyDaysAgo).length || 0;
      const newDocumentsLast7Days = documents?.filter(d => new Date(d.created_at) >= sevenDaysAgo).length || 0;
      const casesWithDocuments = new Set(documents?.map(d => d.case_id)).size || 0;
      const complaintDocuments = documents?.filter(d => d.type === 'COMPLAINT').length || 0;
      const summonsDocuments = documents?.filter(d => d.type === 'SUMMONS').length || 0;
      const motionDocuments = documents?.filter(d => d.type === 'MOTION').length || 0;
      const documentsUpdatedLast24h = documents?.filter(d => new Date(d.updated_at) >= twentyFourHoursAgo).length || 0;
      const documentsUpdatedLast7Days = documents?.filter(d => new Date(d.updated_at) >= sevenDaysAgo).length || 0;

      // Fetch contact metrics
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*');
      
      const totalContacts = contacts?.length || 0;
      const clientContacts = contacts?.filter(c => c.type === 'CLIENT').length || 0;
      const opposingPartyContacts = contacts?.filter(c => c.type === 'OPPOSING_PARTY').length || 0;
      const attorneyContacts = contacts?.filter(c => c.type === 'ATTORNEY').length || 0;
      const courtContacts = contacts?.filter(c => c.type === 'COURT').length || 0;
      const newContactsLast30Days = contacts?.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length || 0;
      const newContactsLast7Days = contacts?.filter(c => new Date(c.created_at) >= sevenDaysAgo).length || 0;

      // Calculate computed metrics
      const totalActivityLast24h = casesUpdatedLast24h + hearingsUpdatedLast24h + documentsUpdatedLast24h;
      const activeCasesPercentage = totalCases > 0 ? (activeCases / totalCases) * 100 : 0;
      const pendingDocumentsPercentage = totalDocuments > 0 ? (pendingDocuments / totalDocuments) * 100 : 0;
      const hearingsNext30DaysPercentage = totalHearings > 0 ? (hearingsNext30Days / totalHearings) * 100 : 0;

      return {
        // Cases
        totalCases,
        activeCases,
        intakeCases,
        closedCases,
        newCasesLast30Days,
        newCasesLast7Days,
        avgCaseDurationDays,
        
        // Hearings
        totalHearings,
        upcomingHearings,
        hearingsNext30Days,
        hearingsNext7Days,
        hearingsNext24Hours,
        completedHearings,
        missedHearings,
        
        // Documents
        totalDocuments,
        pendingDocuments,
        servedDocuments,
        failedDocuments,
        newDocumentsLast30Days,
        newDocumentsLast7Days,
        casesWithDocuments,
        complaintDocuments,
        summonsDocuments,
        motionDocuments,
        
        // Contacts
        totalContacts,
        clientContacts,
        opposingPartyContacts,
        attorneyContacts,
        courtContacts,
        newContactsLast30Days,
        newContactsLast7Days,
        
        // Activity
        casesUpdatedLast24h,
        casesUpdatedLast7Days,
        hearingsUpdatedLast24h,
        hearingsUpdatedLast7Days,
        documentsUpdatedLast24h,
        documentsUpdatedLast7Days,
        totalActivityLast24h,
        
        // Computed KPIs
        activeCasesPercentage,
        pendingDocumentsPercentage,
        hearingsNext30DaysPercentage,
        
        // Metadata
        lastRefreshed: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching direct metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get empty/fallback metrics
   */
  private getEmptyMetrics(): DashboardMetrics {
    return {
      totalCases: 0,
      activeCases: 0,
      intakeCases: 0,
      closedCases: 0,
      newCasesLast30Days: 0,
      newCasesLast7Days: 0,
      avgCaseDurationDays: 0,
      totalHearings: 0,
      upcomingHearings: 0,
      hearingsNext30Days: 0,
      hearingsNext7Days: 0,
      hearingsNext24Hours: 0,
      completedHearings: 0,
      missedHearings: 0,
      totalDocuments: 0,
      pendingDocuments: 0,
      servedDocuments: 0,
      failedDocuments: 0,
      newDocumentsLast30Days: 0,
      newDocumentsLast7Days: 0,
      casesWithDocuments: 0,
      complaintDocuments: 0,
      summonsDocuments: 0,
      motionDocuments: 0,
      totalContacts: 0,
      clientContacts: 0,
      opposingPartyContacts: 0,
      attorneyContacts: 0,
      courtContacts: 0,
      newContactsLast30Days: 0,
      newContactsLast7Days: 0,
      casesUpdatedLast24h: 0,
      casesUpdatedLast7Days: 0,
      hearingsUpdatedLast24h: 0,
      hearingsUpdatedLast7Days: 0,
      documentsUpdatedLast24h: 0,
      documentsUpdatedLast7Days: 0,
      totalActivityLast24h: 0,
      activeCasesPercentage: 0,
      pendingDocumentsPercentage: 0,
      hearingsNext30DaysPercentage: 0,
      lastRefreshed: new Date().toISOString(),
    };
  }

  /**
   * Subscribe to real-time dashboard changes
   */
  subscribeToUpdates(callback: (payload: unknown) => void) {
    // Subscribe to cases changes
    const casesSubscription = supabase
      .channel('dashboard-cases-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'cases' }, 
          callback)
      .subscribe();

    // Subscribe to hearings changes
    const hearingsSubscription = supabase
      .channel('dashboard-hearings-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'hearings' }, 
          callback)
      .subscribe();

    // Subscribe to documents changes
    const documentsSubscription = supabase
      .channel('dashboard-documents-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'documents' }, 
          callback)
      .subscribe();

    // Return cleanup function
    return () => {
      casesSubscription.unsubscribe();
      hearingsSubscription.unsubscribe();
      documentsSubscription.unsubscribe();
    };
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;