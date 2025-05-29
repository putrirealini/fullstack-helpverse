import ForgotPasswordPage from '~/pages/forgotPasswordPage';

export function meta() {
  return [
    { title: "Lupa Password - Helpverse" },
    { name: "description", content: "Reset password akun Anda" },
  ];
}

export default function ForgotPassword() {
  return (
    <ForgotPasswordPage />
  )
} 