import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './Layout';
import BoardPage from './pages/BoardPage';
import ChangeRequestPage from './pages/ChangeRequestPage';
import ChangeTaskPage from './pages/ChangeTaskPage';
import ChangesPage from './pages/ChangesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/board" replace />} />
        <Route path="board" element={<BoardPage />} />
        <Route path="changes" element={<ChangesPage />} />
        <Route path="changes/:chgNumber" element={<ChangeRequestPage />} />
        <Route
          path="changes/:chgNumber/tasks/:ctaskNumber"
          element={<ChangeTaskPage />}
        />
      </Route>
    </Routes>
  );
}
