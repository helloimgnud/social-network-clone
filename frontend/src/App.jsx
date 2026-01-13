import { useEffect } from 'react'
import ChatPage from './components/ChatPage'
import EditProfile from './components/EditProfile'
import Home from './components/Home'
import Login from './components/Login'
import MainLayout from './components/MainLayout'
import Profile from './components/Profile'
import Signup from './components/Signup'
import Reels from './components/Reels'
import Explore from './components/Explore'
import ProtectedRoutes from './components/ProtectedRoutes'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import Archive from './components/Archive'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { io } from "socket.io-client";
import { useDispatch, useSelector } from 'react-redux'
import { setSocket } from './redux/socketSlice'
import { setOnlineUsers } from './redux/chatSlice'
import { setNotifications, addNotification } from './redux/rtnSlice'
import { setAuthUser } from './redux/authSlice';
import axios from 'axios';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';
const API_URL = import.meta.env.VITE_API_URL;

const browserRouter = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoutes>
        <MainLayout />
      </ProtectedRoutes>
    ),
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/profile/:id',
        element: <Profile />
      },
      {
        path: '/account/edit',
        element: <EditProfile />
      },
      {
        path: '/chat',
        element: <ChatPage />
      },
      {
        path: '/reels',
        element: <Reels />
      },
      {
        path: '/explore',
        element: <Explore />
      },
      {
        path: '/archive',
        element: <Archive />
      },
    ]
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/reset-password/:token',
    element: <ResetPassword />
  },
])

function App() {
  const { user } = useSelector(store => store.auth);
  const { socket } = useSelector(store => store.socketio);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) {
      // Verify user session persistence
      const verifySession = async () => {
        try {
          await axios.get(`${API_URL}/api/v1/user/${user._id}/profile`, {
            withCredentials: true
          });
        } catch (error) {
          // If user not found (deleted) or token invalid, log out
          if (error.response?.status === 404 || error.response?.status === 401) {
            dispatch(setAuthUser(null));
          }
        }
      };
      verifySession();

      const socketio = io(SOCKET_URL, {
        query: {
          userId: user?._id
        },
        transports: ['websocket']
      });
      dispatch(setSocket(socketio));

      socketio.on('getOnlineUsers', (onlineUsers) => {
        dispatch(setOnlineUsers(onlineUsers));
      });

      socketio.on('notification', (notification) => {
        dispatch(addNotification(notification));
      });

      // Fetch initial notifications
      const fetchNotifications = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/v1/notification`, {
            withCredentials: true
          });
          if (res.data.success) {
            dispatch(setNotifications(res.data.notifications));
          }
        } catch (error) {
          console.log(error);
        }
      }
      fetchNotifications();

      return () => {
        socketio.close();
        dispatch(setSocket(null));
      }
    } else if (socket) {
      socket.close();
      dispatch(setSocket(null));
    }
  }, [user, dispatch]);

  return (
    <>
      <RouterProvider router={browserRouter} />
    </>
  )
}

export default App