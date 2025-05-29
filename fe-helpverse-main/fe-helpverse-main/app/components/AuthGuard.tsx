import { useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/auth";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'eventOrganizer' | 'user')[];
  fallbackPath?: string;
}

export function AuthGuard({ 
  children, 
  allowedRoles = [], 
  fallbackPath = "/login" 
}: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading) {
      // If not authenticated, redirect to login page
      if (!isAuthenticated) {
        navigate(fallbackPath, { 
          state: { from: window.location.pathname } 
        });
        return;
      }
      
      // If there are allowedRoles and user's role is not included in allowedRoles
      if (allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role as any)) {
        // Redirect to homepage if role doesn't match
        navigate("/", { 
          state: { 
            error: "You don't have access to this page" 
          } 
        });
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, navigate, fallbackPath]);

  // Display loading or content if authenticated and has appropriate role
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated or role doesn't match, component will redirect
  // So we only need to display children if already authenticated and role matches
  if (isAuthenticated && (allowedRoles.length === 0 || (user?.role && allowedRoles.includes(user.role as any)))) {
    return <>{children}</>;
  }

  // Display loading during redirect process
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
} 