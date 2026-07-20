import { Navigate } from 'react-router-dom'

export default function Signup() {
  return <Navigate to="/signup?mode=signup" replace />
}
