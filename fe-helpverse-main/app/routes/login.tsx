import LoginPage from '~/pages/loginpage';
export function meta() {
  return [
    { title: "Login - Helpverse" },
    { name: "description", content: "Login to your account" },
  ];
}

export default function Login() {
  return (
    <LoginPage />
  )
} 