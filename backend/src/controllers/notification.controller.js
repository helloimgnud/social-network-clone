import { Notification } from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.id;
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'sender',
                select: 'username profilePicture'
            })
            .populate({
                path: 'post',
                select: 'image'
            });

        return res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications"
        });
    }
}

export const markAsRead = async (req, res) => {
    try {
        const userId = req.id;
        // Mark all as read for simplicity, or we could mark specific ones
        await Notification.updateMany(
            { recipient: userId, read: false },
            { read: true }
        );

        return res.status(200).json({
            success: true,
            message: "Notifications marked as read"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update notifications"
        });
    }
}

export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.id;
        await Notification.deleteMany({ recipient: userId });

        return res.status(200).json({
            success: true,
            message: "Notifications deleted"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete notifications"
        });
    }
}
