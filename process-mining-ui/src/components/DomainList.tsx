import type { Domain } from "../types/domain"

interface Props {
  domains: Domain[]
}

export default function DomainList({ domains }: Props) {

  return (

    <div>

      <h2>Domains</h2>

      {domains.map(domain => (

        <div key={domain.id}>

          <b>{domain.name}</b>

          <p>{domain.description}</p>

        </div>

      ))}

    </div>

  )
}