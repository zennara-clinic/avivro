import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bot, 
  BarChart3,
  Settings, 
  LogOut,
  Menu,
  X,
  Crown
} from 'lucide-react';
import { auth, db } from '../lib/supabase';

interface MainDashboardLayoutProps {
  children: ReactNode;
}

export default function MainDashboardLayout({ children }: MainDashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [userPlan, setUserPlan] = useState('Free');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await auth.getUser();
      if (!user) return;

      setUserEmail(user.email || '');

      const { data: profile } = await db.profiles.get(user.id);
      if (profile) {
        setUserName((profile as any).full_name || user.email?.split('@')[0] || 'User');
        const tier = (profile as any).subscription_tier || 'free';
        setUserPlan(tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  const navigation = [
    { name: 'Agents', href: '/dashboard', icon: Bot },
    { name: 'Usage', href: '/dashboard/usage', icon: BarChart3 },
    { name: 'Account Settings', href: '/dashboard/account', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Bot className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Avivro</span>
            </Link>
            <button 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Section */}
          <div className="border-t border-gray-200 p-4 bg-gradient-to-br from-gray-50 to-white">
            {/* User Info Card */}
            <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-600/20">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate mb-0.5">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>
              </div>
              
              {/* Plan Badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs ${
                userPlan === 'Free' 
                  ? 'bg-gray-100 text-gray-700' 
                  : userPlan === 'Pro' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm'
              }`}>
                {userPlan !== 'Free' && <Crown className="w-3.5 h-3.5" />}
                {userPlan} Plan
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all hover:shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary-600" />
              <span className="text-lg font-bold text-gray-900">Avivro</span>
            </div>
            <div className="w-6" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
