import { Sidebar } from './Sidebar';

export const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 flex-1 h-screen overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
};
