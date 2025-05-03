import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { isSupervisor } from '@/services'

function RadId() {
  const [userId, setUserId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!userId.trim()) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // Check if the user is a supervisor
      const userIsSupervisor = await isSupervisor(userId)
      
      if (userIsSupervisor) {
        // Navigate to supervisor dashboard
        console.log('Navigating to supervisor dashboard:', userId)
        navigate(`/supervisor/dashboard/${userId}`)
      } else {
        // Navigate to doctor cases
        console.log('Navigating to doctor cases:', userId)
        navigate(`/doctor/${userId}`)
      }
    } catch (err) {
      console.error('Error checking user role:', err)
      setError('Could not verify user ID. Please check the ID and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-center">X-Ray AI Insights Hub</CardTitle>
          <CardDescription className="text-center">Enter your ID to access the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter Your ID</label>
              <Input
                type="text"
                placeholder="Enter your ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                For testing, use: d7a13dc2-e96d-4e03-b400-9dc8537247ca (doctor) or 09624215-09ba-4a56-ad5e-251c74d0a74c (supervisor)
              </p>
            </div>

            <Button 
              type="submit"
              disabled={!userId.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Checking...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default RadId
