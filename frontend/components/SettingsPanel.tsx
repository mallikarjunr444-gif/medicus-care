'use client'

import { useState } from 'react'
import { Save, Loader2, User, KeyRound, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '@/lib/api'
import { useStore } from '@/store/useStore'
import type { ApiError } from '@/lib/types'
import { ClinicalCard } from '@/components/ui/clinical-primitives'

export function SettingsPanel() {
  const { user, setAuth, token, clearAuth } = useStore()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Guests are real server-side accounts now, so trust the flag the API
  // returns rather than sniffing the token or a hardcoded user id.
  const isGuest = user?.is_guest === true || token === 'guest'

  const saveProfile = async () => {
    if (isGuest) {
      toast.error('Sign in with a real account to edit your profile')
      return
    }
    setSavingProfile(true)
    try {
      const update: Record<string, string> = {}
      if (fullName !== (user?.full_name || '')) update.full_name = fullName
      if (username && username !== user?.username) update.username = username
      if (email && email !== user?.email) update.email = email
      if (Object.keys(update).length === 0) {
        toast('Nothing to update', { icon: 'ℹ️' })
        return
      }
      const updated = await api.updateProfile(update)
      if (token) setAuth(token, updated)
      toast.success('Profile updated')
    } catch (err: unknown) {
      toast.error((err as ApiError)?.response?.data?.detail || 'Could not save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async () => {
    if (isGuest) {
      toast.error('Sign in with a real account to change your password')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      await api.updateProfile({ password: newPassword })
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password updated')
    } catch (err: unknown) {
      toast.error((err as ApiError)?.response?.data?.detail || 'Could not change password')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in sm:px-6 sm:py-12">
      <div className="mb-8 border-b border-[#d2d2d7] pb-6">
        <p className="inline-flex rounded-full border border-[#d2d2d7] bg-[#f5f5f7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0058b0]">Preferences</p>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-[-.035em] text-[#1d1d1f] sm:text-5xl">Settings</h1>
        <p className="mt-2 text-sm text-[#6e6e73]">Manage your account and preferences.</p>
      </div>

      {isGuest && (
        <div className="card mb-6 flex items-start gap-3">
          <User size={16} className="text-warning-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-900 font-semibold">You&apos;re signed in as a guest.</p>
            <p className="text-xs text-gray-500 mt-1">Sign out and register an account to save your profile and access multi-device sync.</p>
          </div>
        </div>
      )}

      {/* Profile card */}
      <ClinicalCard className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <User size={16} className="text-primary-400" />
          <h2 className="text-xl font-bold text-gray-900">Profile</h2>
        </div>
        <div className="divider" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="settings-full-name" className="text-sm font-medium text-gray-700">Full name</label>
            <input
              id="settings-full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              placeholder="Your name"
              disabled={isGuest}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="settings-username" className="text-sm font-medium text-gray-700">Username</label>
            <input
              id="settings-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="username"
              disabled={isGuest}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="settings-email" className="text-sm font-medium text-gray-700">Email</label>
            <input
              id="settings-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              disabled={isGuest}
            />
          </div>
        </div>
        <button
          onClick={saveProfile}
          disabled={savingProfile || isGuest}
          className="btn-primary w-full md:w-auto md:self-end"
        >
          {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save changes
        </button>
      </ClinicalCard>

      {/* Password card */}
      <ClinicalCard className="mt-6 flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-primary-400" />
          <h2 className="text-xl font-bold text-gray-900">Password</h2>
        </div>
        <div className="divider" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="settings-new-password" className="text-sm font-medium text-gray-700">New password</label>
            <input
              id="settings-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              placeholder="At least 8 characters"
              disabled={isGuest}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="settings-confirm-password" className="text-sm font-medium text-gray-700">Confirm new password</label>
            <input
              id="settings-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Repeat your password"
              disabled={isGuest}
              autoComplete="new-password"
            />
          </div>
        </div>
        <button
          onClick={changePassword}
          disabled={savingPassword || isGuest || !newPassword || !confirmPassword}
          className="btn-primary w-full md:w-auto md:self-end"
        >
          {savingPassword ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
          Update password
        </button>
      </ClinicalCard>

      {/* Danger zone */}
      <ClinicalCard className="mt-6 flex flex-col gap-5 border-error-600/20 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Trash2 size={16} className="text-error-600" />
          <h2 className="text-xl font-bold text-gray-900">Danger zone</h2>
        </div>
        <div className="divider" />
        <p className="text-sm text-gray-500">
          Sign out of this device. Your avatars, voices, and conversations remain on the server.
        </p>
        <button
          onClick={() => {
            void api.logout()
            clearAuth()
            toast('Signed out', { icon: '👋' })
          }}
          className="btn-secondary w-full md:w-auto md:self-end"
        >
          Sign out
        </button>
      </ClinicalCard>
    </div>
  )
}
