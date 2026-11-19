import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "16px", borderBottom: "1px solid #ddd" }}>
      <Link to="/" style={{ marginRight: "12px" }}>Upload</Link>
      <Link to="/mapping" style={{ marginRight: "12px" }}>Mapping</Link>
      <Link to="/analysis" style={{ marginRight: "12px" }}>Analysis</Link>
      <Link to="/process-explorer" style={{ marginRight: "12px" }}>Process Explorer </Link>
      <Link to="/context-discovery" style={{ marginRight: "12px" }}>
        Context Discovery
      </Link>
    </nav>
  );
}

export default Navbar;