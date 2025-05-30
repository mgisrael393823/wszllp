export interface Jurisdiction {
  code: string;
  label: string;
  state: string;
}

export const JURISDICTIONS: Jurisdiction[] = [
  { code: 'cook:cvd1', label: 'Cook County - Municipal Civil - District 1 - Chicago', state: 'il' },
];