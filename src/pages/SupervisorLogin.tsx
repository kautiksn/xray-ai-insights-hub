import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function SupervisorLogin() {
  const [supervisorId, setSupervisorId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  function handleLogin(e) {
    e.preventDefault()
    if (!supervisorId.trim()) return
    
    console.log('Logging in as supervisor:', supervisorId)
    navigate(`/supervisor/dashboard/${supervisorId}`)
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-center">Supervisor Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter Supervisor ID</label>
              <Input
                type="text"
                placeholder="Enter your supervisor ID"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Enter your supervisor ID to access the dashboard
              </p>
            </div>

            <Button 
              type="submit"
              disabled={!supervisorId.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Loading...' : 'Login'}
            </Button>
            
            <div className="text-center">
              <Button 
                variant="link" 
                onClick={() => navigate('/')}
                className="text-xs"
              >
                Go to Doctor Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SupervisorLogin 