export default {
  // Login Page
  login: {
    title: 'Welcome Back',
    subtitle: 'Sign in to your account to continue',
    email: 'Email Address',
    password: 'Password',
    rememberMe: 'Remember me',
    signIn: 'Sign In',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    createOne: 'Create one',
    signingIn: 'Signing in...',
    error: {
      invalidCredentials: 'Invalid email or password',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      emailInvalid: 'Please enter a valid email address',
      passwordTooShort: 'Password must be at least 6 characters',
      networkError: 'Network error. Please try again.',
      serverError: 'An error occurred during login. Please try again.',
    },
    demo: {
      title: 'Demo Credentials',
      email: 'demo@example.com',
      password: 'demo123456',
    },
    copyright: '© 2026 ERP System. All rights reserved.',
  },

  // Forgot Password Page
  forgotPassword: {
    title: 'Reset Password',
    subtitle: 'Enter your email to receive a password reset link',
    email: 'Email Address',
    send: 'Send Reset Link',
    backToLogin: 'Back to login',
    sending: 'Sending...',
    success: 'Check your email for a password reset link',
    error: {
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      userNotFound: 'No account found with this email',
      serverError: 'Failed to send reset link. Please try again.',
    },
  },

  // Signup Page
  signup: {
    title: 'Create Account',
    subtitle: 'Join us to get started',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    agreeTerms: 'I agree to the Terms of Service',
    signUp: 'Create Account',
    haveAccount: 'Already have an account?',
    signIn: 'Sign in',
    creating: 'Creating account...',
    error: {
      firstNameRequired: 'First name is required',
      lastNameRequired: 'Last name is required',
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Password is required',
      passwordTooShort: 'Password must be at least 6 characters',
      passwordMismatch: 'Passwords do not match',
      termsRequired: 'You must agree to the terms',
      emailExists: 'Email already registered',
      serverError: 'Failed to create account. Please try again.',
    },
  },

  // Reset Password Page
  resetPassword: {
    title: 'Reset Password',
    subtitle: 'Enter your new password',
    password: 'New Password',
    confirmPassword: 'Confirm Password',
    reset: 'Reset Password',
    resetting: 'Resetting...',
    success: 'Password reset successful. You can now login.',
    error: {
      passwordRequired: 'Password is required',
      passwordTooShort: 'Password must be at least 6 characters',
      passwordMismatch: 'Passwords do not match',
      linkExpired: 'Password reset link has expired',
      invalidToken: 'Invalid reset token',
      serverError: 'Failed to reset password. Please try again.',
    },
  },
}