import { NavLink } from 'react-router-dom';
import styles from './Preview.module.css';

export function PreviewBar() {
  return (
    <div className={styles.previewBar}>
      <span>Design preview. Sample data only.</span>
      <nav aria-label="Design previews">
        <NavLink to="/design/customer">Guest</NavLink>
        <NavLink to="/design/admin">Admin</NavLink>
        <NavLink to="/design/components">Controls</NavLink>
      </nav>
    </div>
  );
}
