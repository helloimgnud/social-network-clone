import React, { useEffect, useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import axios from 'axios';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL;

const Signup = () => {
    const [input, setInput] = useState({
        username: "",
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { user } = useSelector(store => store.auth);
    const navigate = useNavigate();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    }

    const signupHandler = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await axios.post(`${API_URL}/api/v1/user/register`, input, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            if (res.data.success) {
                navigate("/login");
                toast.success(res.data.message);
                setInput({
                    username: "",
                    email: "",
                    password: ""
                });
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [])

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            {/* Signup Card */}
            <div className="relative w-full max-w-md">
                <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700/50">
                    {/* Logo & Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            Create Account
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Join us to connect with friends and share moments
                        </p>
                    </div>

                    {/* Signup Form */}
                    <div className="space-y-5">
                        {/* Username Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                Username
                            </label>
                            <Input
                                type="text"
                                name="username"
                                value={input.username}
                                onChange={changeEventHandler}
                                placeholder="Enter your username"
                                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                            />
                        </div>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                Email
                            </label>
                            <Input
                                type="email"
                                name="email"
                                value={input.email}
                                onChange={changeEventHandler}
                                placeholder="Enter your email"
                                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-gray-400" />
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={input.password}
                                    onChange={changeEventHandler}
                                    placeholder="Create a strong password"
                                    className="pr-12 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Must be at least 8 characters long
                            </p>
                        </div>

                        {/* Submit Button */}
                        <Button
                            onClick={signupHandler}
                            disabled={loading}
                            className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating account...
                                </span>
                            ) : (
                                'Sign Up'
                            )}
                        </Button>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-sm text-gray-400 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                            Log in
                        </Link>
                    </p>

                    {/* Terms */}
                    <p className="text-xs text-center text-gray-500 mt-4">
                        By signing up, you agree to our{' '}
                        <Link to="/terms" className="text-purple-400 hover:underline">Terms</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-purple-400 hover:underline">Privacy Policy</Link>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    )
}

export default Signup