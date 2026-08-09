import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LoginForm } from './login-form'

describe('LoginForm', () => {
  it('renders fields and submits credentials', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event) => event.preventDefault())
    const onUsernameChange = vi.fn()
    const onPasswordChange = vi.fn()

    render(
      <LoginForm
        username=""
        password=""
        isSubmitting={false}
        errors={{}}
        onUsernameChange={onUsernameChange}
        onPasswordChange={onPasswordChange}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText('Username'), 'alex')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(onUsernameChange).toHaveBeenCalled()
    expect(onPasswordChange).toHaveBeenCalled()
    expect(onSubmit).toHaveBeenCalled()
  })

  it('shows field and form errors', () => {
    render(
      <LoginForm
        username="alex"
        password=""
        isSubmitting={false}
        errors={{
          username: 'Username is required',
          password: 'Password is required',
          form: 'Invalid credentials',
        }}
        onUsernameChange={vi.fn()}
        onPasswordChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText('Username is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()

    render(
      <LoginForm
        username=""
        password="secret"
        isSubmitting={false}
        errors={{}}
        onUsernameChange={vi.fn()}
        onPasswordChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('disables inputs and shows loading label while submitting', () => {
    render(
      <LoginForm
        username="alex"
        password="secret"
        isSubmitting
        errors={{}}
        onUsernameChange={vi.fn()}
        onPasswordChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Username')).toBeDisabled()
    expect(screen.getByLabelText('Password')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Logging in...' })).toBeDisabled()
  })
})
