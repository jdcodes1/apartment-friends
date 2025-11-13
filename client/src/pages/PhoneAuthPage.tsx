import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PhoneAuth from '../components/auth/PhoneAuth';

export default function PhoneAuthPage() {
  const navigate = useNavigate();

  const handleAuthSuccess = (token: string, user: any) => {
    // Store token and user in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Navigate to dashboard
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath);
    } else {
      navigate('/dashboard');
    }

    // Reload to trigger auth context refresh
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <PhoneAuth onSuccess={handleAuthSuccess} />
    </div>
  );
}
