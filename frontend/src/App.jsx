import { Link, Route, Routes } from 'react-router-dom';
import { CustomerPreview } from './features/design/CustomerPreview.jsx';
import { AdminPreview } from './features/design/AdminPreview.jsx';
import { ControlsPreview } from './features/design/ControlsPreview.jsx';

function Home() {
  return (
    <main>
      <p className="eyebrow">Stillwater Hotels</p>
      <h1>Hotels worth arriving for.</h1>
      <p>Our reservation experience is coming soon.</p>
    </main>
  );
}

function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>This page is unavailable.</p>
      <Link to="/">Return home</Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={import.meta.env.DEV ? <CustomerPreview /> : <Home />}
      />
      {import.meta.env.DEV && (
        <>
          <Route path="/design/customer" element={<CustomerPreview />} />
          <Route path="/design/admin" element={<AdminPreview />} />
          <Route path="/design/components" element={<ControlsPreview />} />
        </>
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
