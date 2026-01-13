import React from 'react'
import UserAvatar from './UserAvatar'

const Comment = ({ comment }) => {
    return (
        <div className='my-2'>
            <div className='flex gap-3 items-center'>
                <UserAvatar src={comment?.author?.profilePicture} />
                <h1 className='font-bold text-sm'>{comment?.author.username} <span className='font-normal pl-1'>{comment?.text}</span></h1>
            </div>
        </div>
    )
}

export default Comment