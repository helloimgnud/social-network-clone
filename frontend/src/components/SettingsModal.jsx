import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL;

const SettingsModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);

    // Change Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    // Change Email State
    const [emailData, setEmailData] = useState({
        newEmail: '',
        password: ''
    });

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            toast.error("New passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`${API_URL}/api/v1/user/account/password`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            }, {
                withCredentials: true
            });

            if (res.data.success) {
                toast.success(res.data.message);
                setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                onClose();
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await axios.post(`${API_URL}/api/v1/user/account/email`, {
                newEmail: emailData.newEmail,
                password: emailData.password
            }, {
                withCredentials: true
            });

            if (res.data.success) {
                toast.success(res.data.message);
                setEmailData({ newEmail: '', password: '' });
                onClose();
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Failed to update email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#262626] border-none text-white fixed z-[100] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold">Cài đặt</DialogTitle>
                        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="password" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                        <TabsTrigger value="password">Đổi mật khẩu</TabsTrigger>
                        <TabsTrigger value="email">Đổi Email</TabsTrigger>
                    </TabsList>

                    <TabsContent value="password">
                        <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="bg-gray-800 border-gray-700 text-white focus:ring-0 focus:border-gray-500"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">Mật khẩu mới</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="bg-gray-800 border-gray-700 text-white focus:ring-0 focus:border-gray-500"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={passwordData.confirmNewPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                                    className="bg-gray-800 border-gray-700 text-white focus:ring-0 focus:border-gray-500"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="email">
                        <form onSubmit={handleEmailChange} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-email">Email mới</Label>
                                <Input
                                    id="new-email"
                                    type="email"
                                    value={emailData.newEmail}
                                    onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                                    className="bg-gray-800 border-gray-700 text-white focus:ring-0 focus:border-gray-500"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="verify-password">Xác nhận bằng mật khẩu</Label>
                                <Input
                                    id="verify-password"
                                    type="password"
                                    value={emailData.password}
                                    onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                                    className="bg-gray-800 border-gray-700 text-white focus:ring-0 focus:border-gray-500"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default SettingsModal;
