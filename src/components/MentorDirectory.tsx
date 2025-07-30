"use client"
import { useEffect, useState } from 'react'
import { UserAvatar } from './UserAvatar'
import MentorProfileEditModal from './MentorProfileEditModal'
import { Edit3 } from 'lucide-react'
import { Button } from './ui/Button'

export default function MentorDirectory({ currentUser }: { currentUser: any }) {
  const [mentors, setMentors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editProfile, setEditProfile] = useState(false)
  const [viewProfile, setViewProfile] = useState<any | null>(null)
  const [myProfile, setMyProfile] = useState<any>(null)
  const [businessFilters, setBusinessFilters] = useState<string[]>([]);
  const businessTypes = [
    'Startup',
    'Small Business',
    'Enterprise',
    'Nonprofit',
    'Freelancer',
  ];

  useEffect(() => {
    fetchMentors()
  }, [search])

  async function fetchMentors() {
    setLoading(true)
    const res = await fetch(`/api/mentors/profile?q=${encodeURIComponent(search)}`)
    const data = await res.json()
    setMentors(data)
    setLoading(false)
    if (currentUser) {
      const mine = data.find((u: any) => u.id === currentUser.id)
      setMyProfile(mine)
    }
  }

  // Filter mentors by business type tags if any are selected
  const filteredMentors = businessFilters.length > 0
    ? mentors.filter((mentor: any) =>
        mentor.MentorProfile?.tags?.some((tag: any) => businessFilters.includes(tag.tag))
      )
    : mentors;

  return (
    <div className="flex flex-row gap-16 w-full max-w-[2000px] mx-auto">
      {/* Sidebar Filters */}
      <div className="w-80 flex flex-col gap-4 pt-2">
        <div className="font-semibold text-zinc-700 text-xl mb-4">Business Type</div>
        {businessTypes.map((type, index) => {
          const isEven = index % 2 === 0;
          const bgColor = isEven ? 'bg-yellow-100' : 'bg-green-100';
          const textColor = isEven ? 'text-yellow-800' : 'text-green-800';
          const borderColor = isEven ? 'border-yellow-300' : 'border-green-300';
          const hoverBgColor = isEven ? 'hover:bg-yellow-200' : 'hover:bg-green-200';
          
          return (
            <label key={type} className={`flex items-center gap-3 p-3 rounded-lg border ${bgColor} ${borderColor} ${hoverBgColor} transition cursor-pointer`}>
              <input
                type="checkbox"
                checked={businessFilters.includes(type)}
                onChange={e => {
                  setBusinessFilters(f =>
                    e.target.checked
                      ? [...f, type]
                      : f.filter(t => t !== type)
                  );
                }}
                className="w-5 h-5"
              />
              <span className={`text-lg font-medium ${textColor} ${businessFilters.includes(type) ? 'font-bold' : ''}`}>{type}</span>
            </label>
          );
        })}
      </div>
      
      {/* Main Directory */}
      <div className="flex-1 bg-white border-4 border-blue-300 rounded-3xl p-12 min-h-[1000px] flex flex-col shadow-xl">
        <div className="mb-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <input
              type="text"
              placeholder="Search mentors by name, tag, or bio..."
              className="w-full max-w-md border border-blue-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {currentUser && currentUser.userType === 'MENTOR' && (
              <button
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white text-base font-semibold shadow hover:bg-blue-600 transition"
                onClick={() => setEditProfile(true)}
              >
                <Edit3 className="w-4 h-4" />
                Edit My Profile
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-20 text-zinc-500 text-lg">Loading mentors...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredMentors.map((mentor: any) => {
                const app = mentor.MentorApplications?.[0];
                return (
                  <div
                    key={mentor.id}
                    className="w-full bg-white border-2 border-blue-300 rounded-2xl p-6 flex flex-col items-center shadow-md relative cursor-pointer transition hover:shadow-xl hover:border-blue-400 group hover:scale-105 duration-200"
                    onClick={() => setViewProfile(mentor)}
                  >
                    <UserAvatar user={{ name: mentor.username, image: mentor.image }} className="h-20 w-20 mb-4 shadow" />
                    <div className="font-semibold text-xl mb-1 group-hover:text-blue-700 transition">u/{mentor.username}</div>
                    <div className="text-base text-zinc-500 mb-1">{mentor.name || app?.name || <span className="italic text-zinc-400">No name</span>}</div>
                    <div className="text-sm text-zinc-400 mb-2">{mentor.age || app?.age ? `Age: ${mentor.age || app?.age}` : ''}</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {mentor.MentorProfile?.tags?.length > 0 ? mentor.MentorProfile.tags.map((tag: any) => (
                        <span key={tag.id} className="bg-blue-100 text-blue-900 text-xs px-3 py-1 rounded-full font-medium shadow-sm">{tag.tag}</span>
                      )) : <span className="text-xs text-zinc-400">No tags</span>}
                    </div>
                    <div className="text-sm text-zinc-700 mb-2 text-center min-h-[40px]">
                      {mentor.MentorProfile?.bio || <span className="italic text-zinc-400">No bio yet</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Mentor Profile Modal (edit for self, view for others) */}
        <MentorProfileEditModal
          open={!!editProfile}
          onClose={() => setEditProfile(false)}
          profile={myProfile?.MentorProfile || null}
          onSave={async (updated) => {
            setEditProfile(false)
            await fetchMentors()
          }}
          bioNote="Write a helpful, detailed bio. Include keywords and business types (e.g., Startup, Small Business) so others can find you!"
          avatar={myProfile?.image}
          username={myProfile?.username}
          name={myProfile?.name || myProfile?.MentorApplications?.[0]?.name}
          age={myProfile?.age || myProfile?.MentorApplications?.[0]?.age}
          experience={myProfile?.MentorApplications?.[0]?.experience}
        />
        {/* View Profile Modal for other mentors */}
        {viewProfile && (
          <MentorProfileEditModal
            open={!!viewProfile}
            onClose={() => setViewProfile(null)}
            profile={viewProfile.MentorProfile || null}
            onSave={() => setViewProfile(null)}
            readOnly
            avatar={viewProfile.image}
            username={viewProfile.username}
            name={viewProfile.name || viewProfile.MentorApplications?.[0]?.name}
            age={viewProfile.age || viewProfile.MentorApplications?.[0]?.age}
            experience={viewProfile.MentorApplications?.[0]?.experience}
            canDM={currentUser && currentUser.userType !== 'FREE' && currentUser.id !== viewProfile.id}
            dmUserId={viewProfile.id}
          />
        )}
      </div>
    </div>
  )
} 