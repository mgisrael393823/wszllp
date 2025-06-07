// Mock Tyler API responses for development
export const mockPaymentAccounts = {
  accounts: [
    { id: 'a04b9fd2-ab8f-473c-a080-78857520336b', name: 'CC - MasterCard ****5454' },
    { id: 'demo-account-2', name: 'Demo Payment Account 2' },
    { id: 'demo-account-3', name: 'Demo Payment Account 3' }
  ]
};

export const mockJurisdictions = {
  jurisdictions: [
    { code: 'cook:cvd1', name: 'Cook County District 1 - Civil' },
    { code: 'cook:m1', name: 'Cook County Municipal District 1' },
    { code: 'cook:m2', name: 'Cook County Municipal District 2' },
    { code: 'cook:m3', name: 'Cook County Municipal District 3' },
    { code: 'cook:m4', name: 'Cook County Municipal District 4' },
    { code: 'cook:m5', name: 'Cook County Municipal District 5' },
    { code: 'cook:m6', name: 'Cook County Municipal District 6' }
  ]
};

export const mockAttorneys = {
  items: [
    {
      id: '448c583f-aaf7-43d2-8053-2b49c810b66f',
      firm_id: '5f41beaa-13d4-4328-b87b-5d7d852f9491',
      bar_number: '1111111',
      first_name: 'Sam',
      last_name: 'Smith',
      display_name: 'Sam Smith - 1111111'
    }
  ]
};