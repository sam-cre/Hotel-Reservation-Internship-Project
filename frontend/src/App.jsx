import { Route, Routes } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop.jsx';
import { CustomerPreview } from './features/design/CustomerPreview.jsx';
import { AdminPreview } from './features/design/AdminPreview.jsx';
import { ControlsPreview } from './features/design/ControlsPreview.jsx';
import { AuthProvider } from './features/customer/AuthContext.jsx';
import { CustomerApplication } from './features/customer/CustomerApplication.jsx';
import { AdminApplication } from './features/admin/AdminApplication.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route
          path="/admin/*"
          element={
            <AuthProvider>
              <AdminApplication />
            </AuthProvider>
          }
        />
        <Route
          path="/*"
          element={
            <AuthProvider>
              <CustomerApplication />
            </AuthProvider>
          }
        />
        {import.meta.env.DEV && (
          <>
            <Route path="/design/customer" element={<CustomerPreview />} />
            <Route path="/design/admin" element={<AdminPreview />} />
            <Route path="/design/components" element={<ControlsPreview />} />
          </>
        )}
      </Routes>
    </>
  );
}
