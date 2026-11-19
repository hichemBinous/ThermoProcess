import { useState } from "react"
import { createDomain } from "../api/domainApi"

interface Props {
  onCreated: () => void
}

export default function DomainForm({ onCreated }: Props) {

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    await createDomain({
      name,
      description
    })

    setName("")
    setDescription("")

    onCreated()
  }

  return (

    <form onSubmit={handleSubmit}>

      <h2>Create Domain</h2>

      <input
        placeholder="Domain name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button type="submit">
        Create
      </button>

    </form>

  )
}