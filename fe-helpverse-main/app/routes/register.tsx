import RegisterPage from '~/pages/registerpage';

export function meta() {
  return [
    { title: "Register - Helpverse" },
    { name: "description", content: "Daftar akun Helpverse untuk memesan tiket event" },
  ];
}

export default function Register() {
  return (
    <RegisterPage />
  )
} 