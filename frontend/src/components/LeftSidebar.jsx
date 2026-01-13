import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Home,
  Search,
  Compass,
  Film,
  Send,
  Heart,
  PlusSquare,
  MoreHorizontal,
  LogOut,
  X,
  Activity,
  Settings
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import CreatePost from "./CreatePost";
import SettingsModal from "./SettingsModal";
import Notifications from "./Notifications";
import { setNotifications } from "@/redux/rtnSlice";
import { setAuthUser } from "@/redux/authSlice";
import axios from "axios";
import { toast } from "sonner";
import "../App.css";

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_AVATAR = 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2';

export default function LeftSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);
  const { suggestedUsers } = useSelector((store) => store.auth);
  const { notifications } = useSelector(
    (store) => store.realTimeNotification
  );
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const handleComingSoon = (feature) => {
    alert(`${feature} - Coming Soon!`);
  };

  const handleLogout = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/user/logout`, {
        withCredentials: true,
      });
      if (res.data.success) {
        dispatch(setAuthUser(null));
        navigate("/login");
        toast.success(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Đăng xuất thất bại");
    }
  };

  const handleSearchToggle = () => {
    setSearchOpen(!searchOpen);
    setNotificationOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleNotificationToggle = () => {
    setNotificationOpen(!notificationOpen);
    setSearchOpen(false);
  }

  const handleNotificationClose = () => {
    setNotificationOpen(false);
  }

  // Focus search input when panel opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Search users from backend API with debounce
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/api/v1/user/search`, {
          params: { query: searchQuery },
          withCredentials: true
        });
        if (res.data.success) {
          setSearchResults(res.data.users);
        }
      } catch (error) {
        console.log('Search error:', error);
        setSearchResults([]);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const unreadNotifications = notifications.length; // Or filter by read: false if you persist read status
  const isSidebarCollapsed = searchOpen || notificationOpen;

  return (
    <>
      {/* Sidebar - collapses when search is open or notification is open */}
      <aside className={`sidebar ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-logo">
          <img
            src="/instagram-logo.svg"
            alt="Instagram Logo"
            className={`instagram-logo ${isSidebarCollapsed ? "logo-hidden" : ""}`}
          />
          <img
            src="/instagram-icon.svg"
            alt="Instagram Icon"
            className={`instagram-icon ${isSidebarCollapsed ? "icon-visible" : ""}`}
          />
        </div>

        <nav className="sidebar-menu">
          <Link
            to="/"
            className={`sidebar-item ${!isSidebarCollapsed && isActive("/") ? "active" : ""}`}
            onClick={handleSearchClose}
          >
            <Home size={24} />
            <span>Trang chủ</span>
          </Link>

          <button
            onClick={handleSearchToggle}
            className={`sidebar-item ${searchOpen ? "active" : ""}`}
          >
            <Search size={24} />
            <span>Tìm kiếm</span>
          </button>

          <Link
            to="/explore"
            className={`sidebar-item ${!isSidebarCollapsed && isActive("/explore") ? "active" : ""}`}
            onClick={handleSearchClose}
          >
            <Compass size={24} />
            <span>Khám phá</span>
          </Link>

          <Link
            to="/reels"
            className={`sidebar-item ${!isSidebarCollapsed && isActive("/reels") ? "active" : ""}`}
            onClick={handleSearchClose}
          >
            <Film size={24} />
            <span>Reels</span>
          </Link>

          <Link
            to="/chat"
            className={`sidebar-item ${!isSidebarCollapsed && isActive("/chat") ? "active" : ""}`}
            onClick={handleSearchClose}
          >
            <Send size={24} />
            <span>Tin nhắn</span>
          </Link>

          <button
            onClick={handleNotificationToggle}
            className={`sidebar-item relative ${notificationOpen ? "active" : ""}`}
          >
            <div className="relative">
              <Heart size={24} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                  {unreadNotifications}
                </span>
              )}
            </div>
            <span>Thông báo</span>
          </button>

          <button onClick={() => setOpen(true)} className="sidebar-item">
            <PlusSquare size={24} />
            <span>Tạo</span>
          </button>

          <Link
            to={`/profile/${user?._id}`}
            className={`sidebar-item ${!isSidebarCollapsed && location.pathname === `/profile/${user?._id}` ? "active" : ""}`}
            onClick={handleSearchClose}
          >
            <img
              src={user?.profilePicture || DEFAULT_AVATAR}
              alt="avatar"
              className="sidebar-avatar"
            />
            <span>Trang cá nhân</span>
          </Link>
        </nav>

        <div className="sidebar-bottom">



          <button onClick={handleLogout} className="sidebar-item sidebar-logout-btn">
            <LogOut size={24} />
            <span>Đăng xuất</span>
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="sidebar-item cursor-pointer">
                <MoreHorizontal size={24} />
                <span>Xem thêm</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 p-2 bg-[#262626] border-none rounded-xl ml-4 mb-2 shadow-xl z-[200]">
              <div className="flex flex-col gap-1">
                <Link to="/archive" className="flex items-center gap-3 p-3 text-white hover:bg-[#3C3C3C] rounded-lg transition-colors cursor-pointer">
                  <Activity size={20} />
                  <span className="text-sm font-medium">Kho lưu trữ</span>
                </Link>
                <div onClick={() => setSettingsOpen(true)} className="flex items-center gap-3 p-3 text-white hover:bg-[#3C3C3C] rounded-lg transition-colors cursor-pointer">
                  <Settings size={20} />
                  <span className="text-sm font-medium">Cài đặt</span>
                </div>
                {/* Add more options if needed */}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </aside>

      {/* Search Panel Overlay */}
      <div className={`search-panel ${searchOpen ? "search-panel-open" : ""}`}>
        <div className="search-panel-header">
          <h2 className="search-panel-title">Tìm kiếm</h2>
          <button onClick={handleSearchClose} className="search-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="search-input-wrapper">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="search-clear-btn"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="search-results">
          {searchQuery.trim() === "" ? (
            <div className="search-recent">
              <p className="search-section-title">Gần đây</p>
              <p className="search-no-recent">Không có tìm kiếm gần đây.</p>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((result) => (
              <Link
                key={result._id}
                to={`/profile/${result._id}`}
                className="search-result-item"
                onClick={handleSearchClose}
              >
                <img
                  src={result.profilePicture || DEFAULT_AVATAR}
                  alt={result.username}
                  className="search-result-avatar"
                />
                <div className="search-result-info">
                  <p className="search-result-username">{result.username}</p>
                  <p className="search-result-name">
                    {result.bio || "Instagram User"}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="search-no-results">Không tìm thấy kết quả.</p>
          )}
        </div>
      </div>

      {/* Overlay backdrop when search is open */}
      {searchOpen && (
        <div className="search-backdrop" onClick={handleSearchClose}></div>
      )}

      {/* Overlay backdrop when notification is open */}
      {notificationOpen && (
        <div className="notification-backdrop" onClick={handleNotificationClose}></div>
      )}

      <Notifications isOpen={notificationOpen} onClose={handleNotificationClose} />
      <CreatePost open={open} setOpen={setOpen} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}