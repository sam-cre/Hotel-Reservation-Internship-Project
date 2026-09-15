import { Link, Route, Routes } from 'react-router-dom';

function Home() {
  return (
    <main>
      <p className="eyebrow">Stillwater Hotels</p>
      <h1>A quieter place to stay.</h1>
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
      <Route path="/" element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
