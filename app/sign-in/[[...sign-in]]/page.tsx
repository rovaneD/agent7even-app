import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <SignIn />
      <p className="mt-6 text-xs text-gray-400 text-center">
        By signing in you agree to our{' '}
        <a href="/terms" className="underline underline-offset-2 hover:text-gray-600 transition-colors">Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" className="underline underline-offset-2 hover:text-gray-600 transition-colors">Privacy Policy</a>.
      </p>
    </div>
  )
}
