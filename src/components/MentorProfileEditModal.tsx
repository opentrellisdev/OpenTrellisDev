import { useState } from 'react'
import { UserAvatar } from './UserAvatar'
import DMModal from './DMModal'

export default function MentorProfileEditModal({ open, onClose, profile, onSave, bioNote, readOnly = false, avatar, username, name, age, experience: experienceProp, canDM, dmUserId }: {
  open: boolean,
  onClose: () => void,
  profile: any,
  onSave: (profile: any) => void,
  bioNote?: string,
  readOnly?: boolean,
  avatar?: string,
  username?: string,
  name?: string,
  age?: number,
  experience?: string,
  canDM?: boolean,
  dmUserId?: string
}) {
  const [bio, setBio] = useState(profile?.bio || '')
  const [tags, setTags] = useState(profile?.tags?.map((t: { tag: string }) => t.tag).join(', ') || '')
  const [experience, setExperience] = useState(experienceProp || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDMModal, setShowDMModal] = useState(false)

  if (!open) return null

  async function handleSave() {
    setLoading(true)
    setError('')
    const tagArr = tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    const res = await fetch('/api/mentors/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, tags: tagArr, name, age, experience })
    })
    if (res.ok) {
      const data = await res.json()
      onSave(data)
      onClose()
    } else {
      setError('Failed to save profile')
    }
    setLoading(false)
  }

  function handleDM() {
    setShowDMModal(true)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative">
          <button className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600 text-2xl" onClick={onClose}>&times;</button>
          <div className="flex items-center gap-6 mb-6">
            <UserAvatar user={{ name: username || null, image: avatar || null }} className="h-24 w-24" />
            <div>
              <div className="font-bold text-2xl">u/{username}</div>
              <div className="text-lg text-zinc-700">{name}</div>
              {age && <div className="text-sm text-zinc-500">Age: {age}</div>}
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">{readOnly ? 'Mentor Profile' : 'Edit Mentor Profile'}</h2>
          {bioNote && !readOnly && <div className="mb-2 text-sm text-blue-700 bg-blue-50 rounded p-2">{bioNote}</div>}
          {readOnly ? (
            <>
              <div className="mb-4">
                <div className="block text-base font-medium mb-1">Experience</div>
                <div className="text-zinc-700 whitespace-pre-line min-h-[40px]">{experienceProp || <span className="italic text-zinc-400">No experience listed</span>}</div>
              </div>
              <div className="mb-4">
                <div className="block text-base font-medium mb-1">Bio</div>
                <div className="text-zinc-700 whitespace-pre-line min-h-[80px]">{profile?.bio || <span className="italic text-zinc-400">No bio yet</span>}</div>
              </div>
              <div className="mb-4">
                <div className="block text-base font-medium mb-1">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {profile?.tags?.length > 0 ? profile.tags.map((t: { tag: string }) => (
                    <span key={t.tag} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{t.tag}</span>
                  )) : <span className="text-xs text-zinc-400">No tags</span>}
                </div>
              </div>
              {canDM && dmUserId && (
                <button className="mt-4 w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white text-lg font-semibold shadow hover:from-blue-600 hover:to-blue-800 transition" onClick={handleDM}>
                  DM this Mentor
                </button>
              )}
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-base font-medium mb-1">Name</label>
                <input
                  className="w-full border rounded px-3 py-2 text-lg"
                  value={name || ''}
                  onChange={() => {}}
                  disabled
                />
              </div>
              <div className="mb-4">
                <label className="block text-base font-medium mb-1">Age</label>
                <input
                  className="w-full border rounded px-3 py-2 text-lg"
                  value={age || ''}
                  onChange={() => {}}
                  disabled
                />
              </div>
              <div className="mb-4">
                <label className="block text-base font-medium mb-1">Experience</label>
                <textarea
                  className="w-full border rounded px-3 py-2 min-h-[60px] text-base"
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="mb-4">
                <label className="block text-base font-medium mb-1">Bio</label>
                <textarea
                  className="w-full border rounded px-3 py-2 min-h-[80px] text-base"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="mb-4">
                <label className="block text-base font-medium mb-1">Tags (comma separated)</label>
                <input
                  className="w-full border rounded px-3 py-2 text-base"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="e.g. React, Career, Python"
                  maxLength={100}
                />
              </div>
              {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
              <button
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white text-lg font-semibold shadow hover:from-blue-600 hover:to-blue-800 transition"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* DM Modal */}
      {showDMModal && dmUserId && username && (
        <DMModal
          receiverId={dmUserId}
          receiverUsername={username as string}
          onClose={() => setShowDMModal(false)}
        />
      )}
    </>
  )
} 