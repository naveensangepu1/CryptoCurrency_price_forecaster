// The five sections in the sidebar. Each one lives at its own hash URL
// (#/markets, #/forecast ...) so refresh and the back button work without a router.

export type ViewId = 'overview' | 'markets' | 'forecast' | 'history' | 'about';

export interface ViewInfo {
  id: ViewId;
  label: string;
  description: string;
}

export const VIEWS: ViewInfo[] = [
  { id: 'overview', label: 'Overview', description: 'Price, chart and 24h numbers for the selected coin.' },
  { id: 'markets', label: 'Markets', description: 'All eight coins side by side. Click a row to open it.' },
  { id: 'forecast', label: 'Forecast', description: 'Where the regression line points over the next 1 to 30 days.' },
  { id: 'history', label: 'Past data', description: 'Open, high, low, close and volume for a chosen range, with CSV download.' },
  { id: 'about', label: 'About the model', description: 'How the forecast is made, what it ignores, and where the data comes from.' },
];

export function viewFromHash(hash: string): ViewId {
  const id = hash.replace(/^#\/?/, '');
  return VIEWS.some((v) => v.id === id) ? (id as ViewId) : 'overview';
}
