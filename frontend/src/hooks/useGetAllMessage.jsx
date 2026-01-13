import { setMessages, clearMessages, setConversationStatus } from "@/redux/chatSlice";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const API_URL = import.meta.env.VITE_API_URL;

const useGetAllMessage = () => {
    const dispatch = useDispatch();
    const { selectedUser } = useSelector(store => store.auth);
    useEffect(() => {
        const fetchAllMessage = async () => {
            if (!selectedUser?._id) {
                dispatch(clearMessages()); // Clear messages when no user is selected
                return;
            }
            // Clear previous messages before fetching new ones
            dispatch(clearMessages());
            try {
                const res = await axios.get(`${API_URL}/api/v1/message/all/${selectedUser._id}`, { withCredentials: true });
                if (res.data.success) {
                    dispatch(setMessages(res.data.messages));
                    // Set conversation status (declined info)
                    dispatch(setConversationStatus({
                        isDeclined: res.data.isDeclined || false,
                        declinedBy: res.data.declinedBy || null
                    }));
                }
            } catch (error) {
                console.log(error);
            }
        }
        fetchAllMessage();
    }, [selectedUser]);
};
export default useGetAllMessage;