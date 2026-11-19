import { useEffect, useState } from "react";
import axios from "axios";

type Domain = {
  id: number;
  name: string;
};

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/domains/")
      .then((res) => {
        console.log("Domains loaded:", res.data);
        setDomains(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Domains</h1>

      <ul>
        {domains.map((d) => (
          <li key={d.id}>{d.name}</li>
        ))}
      </ul>
    </div>
  );
}