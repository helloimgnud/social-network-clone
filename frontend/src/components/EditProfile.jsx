import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import axios from 'axios';
import { Loader2, ArrowLeft, ImagePlus } from 'lucide-react'; // Import thêm icon
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { setAuthUser } from '@/redux/authSlice';
const API_URL = import.meta.env.VITE_API_URL;

const EditProfile = () => {
  const imageRef = useRef();
  const { user } = useSelector(store => store.auth);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState({
    profilePhoto: user?.profilePicture,
    bio: user?.bio,
    gender: user?.gender
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fileChangeHandler = (e) => {
    const file = e.target.files?.[0];
    if (file) setInput({ ...input, profilePhoto: file });
  }

  const selectChangeHandler = (value) => {
    setInput({ ...input, gender: value });
  }

  const editProfileHandler = async () => {
    console.log(input);
    const formData = new FormData();
    formData.append("bio", input.bio);
    formData.append("gender", input.gender);
    if (input.profilePhoto) {
      formData.append("profilePhoto", input.profilePhoto);
    }
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/user/profile/edit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      if (res.data.success) {
        const updatedUserData = {
          ...user,
          bio: res.data.user?.bio,
          profilePicture: res.data.user?.profilePicture,
          gender: res.data.user.gender
        };
        dispatch(setAuthUser(updatedUserData));
        navigate(`/profile/${user?._id}`);
        toast.success(res.data.message);
      }

    } catch (error) {
      console.log(error);
      toast.error(error.response.data.messasge);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50/50">
      {/* Top Navigation Bar - Nút Back ở góc trái trên cùng */}
      <div className="w-full max-w-5xl mx-auto px-4 py-6 flex items-center gap-4">
        <Button
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-full bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 hover:text-black hover:shadow-md transition-all duration-200 flex items-center justify-center p-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 w-full max-w-xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-8">
          <h1 className="text-xl font-bold text-center">Chỉnh sửa trang cá nhân</h1>
          {/* Avatar Section - Centered for better UI */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group cursor-pointer" onClick={() => imageRef.current.click()}>
              <Avatar className="h-32 w-32 border-4 border-gray-50 shadow-sm group-hover:opacity-90 transition-opacity">
                <AvatarImage src={input.profilePhoto instanceof File ? URL.createObjectURL(input.profilePhoto) : user?.profilePicture} className="object-cover" />
                <AvatarFallback className="text-2xl bg-gray-200">CN</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full text-white shadow-lg hover:bg-blue-600 transition-colors">
                <ImagePlus className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold text-gray-900">{user?.username}</h2>
              <Button
                variant="link"
                onClick={() => imageRef.current.click()}
                className="text-[#0095F6] font-semibold text-sm hover:no-underline p-0 h-auto mt-1"
              >
                Thay đổi ảnh đại diện
              </Button>
            </div>
            <input
              ref={imageRef}
              onChange={fileChangeHandler}
              type="file"
              className="hidden"
            />
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            {/* Bio Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Tiểu sử</label>
              <Textarea
                value={input.bio}
                onChange={(e) => setInput({ ...input, bio: e.target.value })}
                placeholder="Tiểu sử"
                className="min-h-[100px] resize-none bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-400 focus:ring-0 rounded-xl transition-all p-4 text-base"
              />
              <p className="text-xs text-gray-400 text-right">
                {input.bio?.length || 0} kí tự
              </p>
            </div>

            {/* Gender Select */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Giới tính</label>
              <Select defaultValue={input.gender} onValueChange={selectChangeHandler}>
                <SelectTrigger className="w-full h-12 bg-gray-50 border-gray-200 focus:ring-0 focus:border-gray-400 rounded-xl px-4">
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectGroup>
                    <SelectItem value="male" className="cursor-pointer">Nam</SelectItem>
                    <SelectItem value="female" className="cursor-pointer">Nữ</SelectItem>
                    <SelectItem value="Other" className="cursor-pointer">Tùy chỉnh</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              {loading ? (
                <Button
                  disabled
                  className="w-full h-12 bg-[#0095F6]/70 text-white rounded-xl"
                >
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Lưu thay đổi ...
                </Button>
              ) : (
                <Button
                  onClick={editProfileHandler}
                  className="w-full h-12 bg-[#0095F6] hover:bg-[#1877F2] text-white font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]"
                >
                  Lưu thay đổi
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditProfile;