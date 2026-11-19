import axios from "axios"
import type { Domain } from "../types/domain"

const API_URL = "http://localhost:8000"

export const getDomains = async (): Promise<Domain[]> => {
  const res = await axios.get(`${API_URL}/domains`)
  return res.data
}

export const createDomain = async (domain: {
  name: string
  description?: string
}) => {

  const res = await axios.post(`${API_URL}/domains`, domain)

  return res.data
}