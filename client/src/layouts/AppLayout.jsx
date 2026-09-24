import Topbar from '../components/Topbar';import MobileNav from '../components/MobileNav';
export default function AppLayout({children}){return <div className="page-shell"><Topbar/><main className="container-tx py-8">{children}</main><MobileNav/></div>}
