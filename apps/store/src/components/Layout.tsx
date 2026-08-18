import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import Footer from './Footer';

const HIDE_BOTTOM_NAV = ['/checkout'];

export default function Layout() {
  const location = useLocation();
  const hideNav = HIDE_BOTTOM_NAV.some((p) => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className={`flex-1 ${hideNav ? '' : 'pb-20'}`}>
        <Outlet />
      </main>
      {!hideNav && <Footer />}
      {!hideNav && <BottomNav />}
    </div>
  );
}
