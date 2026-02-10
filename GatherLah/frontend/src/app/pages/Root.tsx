import { Outlet, useLocation, Link } from "react-router";
import { Home, Users, Calendar, Compass, User } from "lucide-react";

export function Root() {
  const location = useLocation();

  const tabs = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/friends", icon: Users, label: "Friends" },
    { path: "/events", icon: Calendar, label: "Events" },
    { path: "/explore", icon: Compass, label: "Explore" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isEventDetail = location.pathname.startsWith('/events/') && location.pathname !== '/events';

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation - Hide on event detail page */}
      {!isEventDetail && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 safe-area-bottom">
          <div className="flex justify-around items-center h-16">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-colors active:bg-gray-50 ${
                    isActive ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? "" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
