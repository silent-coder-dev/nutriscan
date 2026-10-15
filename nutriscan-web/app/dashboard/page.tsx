import DashboardClient from './DashboardClient';

// AuthGuard (layout) renders this page only after the browser-side session check,
// so the server never prerenders it; opt it out of instant-navigation validation.
export const instant = false;

export default function DashboardPage() {
  return <DashboardClient />;
}
