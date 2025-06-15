'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Settings, User, LogIn, Trash2, AlertTriangle } from "lucide-react"
import { SignInForm } from "@/components/auth/sign-in-form"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { useRouter } from 'next/navigation'

export function UserProfile() {
  const { user, profile, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Failed to sign out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignInClick = () => {
    setAuthMode('signin')
    setShowAuthDialog(true)
  }

  const switchToSignUp = () => {
    setAuthMode('signup')
  }

  const switchToSignIn = () => {
    setAuthMode('signin')
  }

  const handleDeleteAllData = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/delete-user-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmed: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user data');
      }

      const result = await response.json();
      console.log('User data deleted successfully:', result);
      
      // Redirect to home page after successful deletion
      // The user will be automatically logged out due to account deletion
      router.push('/');
      
    } catch (error) {
      console.error('Error deleting user data:', error);
      alert('Failed to delete user data. Please try again.');
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // If user is not logged in, show sign in button
  if (!user || !profile) {
    return (
      <>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignInClick}
          className="px-3 flex items-center gap-2"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Sign In</span>
        </Button>

        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="sm:max-w-md p-0 bg-transparent border-none shadow-none">
            <div className="flex items-center justify-center">
              {authMode === 'signin' ? (
                <SignInForm onSwitchToSignUp={switchToSignUp} />
              ) : (
                <SignUpForm onSwitchToSignIn={switchToSignIn} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const displayName = profile.full_name || user.email?.split('@')[0] || 'User'
  const initials = getInitials(displayName)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile.avatar_url} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete All Data</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleSignOut}
            disabled={isLoading}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete All Data Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete All Data
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-medium text-red-600">
                ⚠️ This action cannot be undone!
              </p>
              <p>
                This will permanently delete:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All your financial transactions</li>
                <li>All uploaded bank statements</li>
                <li>All email data and attachments</li>
                <li>All account balances and history</li>
                <li>Your user profile and preferences</li>
                <li>Your entire account from the system</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                You will be automatically logged out and your account will be completely removed from our system.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllData}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Everything
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 