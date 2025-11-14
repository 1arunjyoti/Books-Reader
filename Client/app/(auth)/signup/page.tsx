import { AuthForm } from '@/components/auth/auth-form';

export const metadata = {
  title: 'Sign Up - BooksReader',
  description: 'Create a new BooksReader account',
};

export default function SignUpPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      
      <AuthForm type="signup" />
    </div>
  );
}
