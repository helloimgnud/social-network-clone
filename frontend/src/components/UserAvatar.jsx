import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2';

const UserAvatar = ({ className, src, alt = "user-avatar" }) => {
    return (
        <Avatar className={className}>
            <AvatarImage src={src || DEFAULT_AVATAR} alt={alt} />
            <AvatarFallback className="bg-gray-800 text-white flex items-center justify-center">
                <img src={DEFAULT_AVATAR} alt="default" className="w-full h-full object-cover" />
            </AvatarFallback>
        </Avatar>
    );
};

export default UserAvatar;
