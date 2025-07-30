import { FC, useRef, useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface UserPopupProps {
  username: string;
  userId: string;
  userType: 'FREE' | 'PAID' | 'MENTOR';
  currentUser: { id: string; userType: 'FREE' | 'PAID' | 'MENTOR'; image?: string | null } | null;
  onDM: () => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  userImage?: string | null;
}

const UserPopup: FC<UserPopupProps> = ({
  username,
  userId,
  userType,
  currentUser,
  onDM,
  onClose,
  anchorRef,
  userImage,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, anchorRef]);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (anchorRef.current && popupRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPopupStyle({
        position: 'absolute',
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        zIndex: 1000,
        minWidth: 220,
      });
    }
  }, [anchorRef]);
  const isSelf = currentUser && currentUser.id === userId;
  const canDM =
    currentUser &&
    (currentUser.userType === 'PAID' || currentUser.userType === 'MENTOR') &&
    (userType === 'PAID' || userType === 'MENTOR') &&
    !isSelf;
  return (
    <div
      ref={popupRef}
      style={popupStyle}
      className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 flex flex-col items-center min-w-[220px]"
    >
      <UserAvatar user={{ name: username, image: userImage }} className='h-12 w-12 mb-2' />
      <div className={`text-lg font-bold mb-2 ${
        userType === 'MENTOR' ? 'text-blue-600' :
        userType === 'PAID' ? 'text-yellow-500' : 
        'text-zinc-900'
      }`}>u/{username}</div>
      <div className={`text-xs font-semibold mb-2 ${
        userType === 'MENTOR' ? 'text-blue-600' :
        userType === 'PAID' ? 'text-yellow-500' : 
        'text-zinc-500'
      }`}>
        {userType === 'MENTOR' ? 'Mentor' : userType === 'PAID' ? 'Paid User' : 'Free User'}
      </div>
      {canDM && (
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition text-base font-medium shadow mt-2"
          onClick={onDM}
        >
          <MessageSquare className="w-5 h-5" /> DM
        </button>
      )}
    </div>
  );
};

export default UserPopup; 