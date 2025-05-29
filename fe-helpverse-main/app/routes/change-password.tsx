import ChangePasswordPage from '~/pages/forgotPasswordPage';

export function meta() {
  return [
    { title: "Change Password - Helpverse" },
    { name: "description", content: "Update your account password" },
  ];
}

export default function ChangePassword() {
  return (
    <ChangePasswordPage />
  )
} 