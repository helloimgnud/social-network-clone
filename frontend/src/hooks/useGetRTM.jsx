import { addIncomingMessage, addMessageRequest } from "@/redux/chatSlice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const useGetRTM = () => {
    const dispatch = useDispatch();
    const { socket } = useSelector(store => store.socketio);
    const { selectedUser } = useSelector(store => store.auth);
    const { user } = useSelector(store => store.auth);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            // If the message is from the currently selected user, show it directly
            if (selectedUser?._id === newMessage.senderId) {
                dispatch(addIncomingMessage({
                    message: newMessage,
                    senderId: newMessage.senderId,
                    selectedUserId: selectedUser?._id
                }));
                return;
            }

            // Check if the message is from a user we follow
            const isFromFollowedUser = user?.following?.includes(newMessage.senderId);

            if (!isFromFollowedUser && newMessage.senderId !== user?._id) {
                // Message from non-followed user AND not currently chatting with them
                dispatch(addMessageRequest({
                    senderId: newMessage.senderId,
                    message: newMessage,
                    createdAt: new Date().toISOString()
                }));
            } else {
                // Normal message from followed user (background update)
                dispatch(addIncomingMessage({
                    message: newMessage,
                    senderId: newMessage.senderId,
                    selectedUserId: selectedUser?._id
                }));
            }
        };

        socket.on('newMessage', handleNewMessage);

        return () => {
            socket.off('newMessage', handleNewMessage);
        }
    }, [socket, selectedUser?._id, user?.following, dispatch]);
};

export default useGetRTM;