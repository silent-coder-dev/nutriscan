import ProfileClient from './ProfileClient';

// AuthGuard (layout) renders this page only after the browser-side session check,
// so the server never prerenders it; opt it out of instant-navigation validation.
export const instant = false;

export default function ProfilePage() {
  return <ProfileClient />;
}
