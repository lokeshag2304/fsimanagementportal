"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout"
import { GlassCard, GlassButton, GlassInput } from "@/components/glass"
import { useTheme } from "@/contexts/theme-context"
import { Slider } from "@/components/ui/slider"
import {
  User,
  Bell,
  Palette,
  Globe,
  Shield,
  Mail,
  Phone,
  Camera,
  Save,
  Check,
  Type,
  Layers,
  ChevronDown,
  Lock,
  Sun,
  Moon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import axios from "@/lib/axios"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

export default function SettingsPage() {
  const { user, getToken } = useAuth()
  const token = getToken()
  const { toast } = useToast()

  const {
    themeColor,
    setThemeColor,
    availableColors,
    themeFont,
    setThemeFont,
    availableFonts,
    backgroundColor,
    setBackgroundColor,
    themeMode,
    setThemeMode,
    glassSettings,
    setGlassPreset,
    setGlassCustomValue,
    resetGlassToPreset
  } = useTheme()

  const [glassAdvancedOpen, setGlassAdvancedOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    number: "",
    address: "",
    company_name: "",
    website: "",
    country: "",
    profile: ""
  })
  const [loading, setLoading] = useState(false)
  const [profileImage, setProfileImage] = useState<string>("")
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Fetch profile data
  useEffect(() => {
    if (user === null) return
    fetchProfileData()
  }, [user])

  console.log(user)

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const response = await axios.post(
        `${BASE_URL}/secure/Profile/Get-Profile`,
        {
          s_id: user?.id
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        const data = response.data.data
        setProfileData({
          name: data.name || "",
          email: data.email || "",
          number: data.number || "",
          address: data.address || "",
          company_name: data.company_name || "",
          website: data.website || "",
          country: data.country || "",
          profile: data.profile || ""
        })

        // Set profile image if available
        if (data.profile) {
          setProfileImage(data.profile)
        }
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch profile data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setLoading(true)

      // API call to update profile
      const response = await axios.post(
        `${BASE_URL}/Profile/Update-Profile`,
        {
          s_id: user.id,
          name: profileData.name,
          email: profileData.email,
          number: profileData.number,
          address: profileData.address,
          company_name: profileData.company_name,
          website: profileData.website,
          country: profileData.country,
          // Add other fields as needed
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message || "Profile updated successfully",
          variant: "default",
        })
      } else {
        throw new Error(response.data.message || "Failed to update profile")
      }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirm password do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const response = await axios.post(
        `${BASE_URL}/Profile/Change-Password`, // Update this endpoint as per your API
        {
          s_id: user?.id,
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message || "Password changed successfully",
          variant: "default",
        })
        // Clear password fields
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      } else {
        throw new Error(response.data.message || "Failed to change password")
      }
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('profile_image', file)
      formData.append('s_id', user?.id?.toString() || '')

      const response = await axios.post(
        `${BASE_URL}/Profile/Update-Profile-Image`, // Update this endpoint as per your API
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        setProfileImage(response.data.profile_url)
        toast({
          title: "Success",
          description: "Profile image updated successfully",
          variant: "default",
        })
      }
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "appearance", name: "Appearance", icon: Palette },
  ]

  return (
    <div className="min-h-screen pb-8">
      <Header title="Settings" />

      <div className="px-4 sm:px-6 space-y-4 sm:space-y-6 mt-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="lg:w-56">
            <GlassCard className="p-3">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <Button
                      key={tab.id}
                      variant="ghost"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full justify-start gap-2.5 h-9 px-3 text-sm font-normal glass ${activeTab === tab.id
                        ? "ring-1 ring-[rgba(var(--theme-primary-rgb),0.5)] text-theme"
                        : "text-[var(--text-tertiary)] hover:text-theme"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.name}
                    </Button>
                  )
                })}
              </nav>
            </GlassCard>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <>
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
                      <User className="w-5 h-5 text-theme" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">Profile Information</h3>
                      <p className="text-[var(--text-muted)] text-sm">Update your personal details</p>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            {profileData.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      <label htmlFor="profile-upload" className="absolute -bottom-1 -right-1 p-2 rounded-full glass-button cursor-pointer">
                        <Camera className="w-4 h-4 text-white" />
                        <input
                          id="profile-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfileImageUpload}
                          disabled={loading}
                        />
                      </label>
                    </div>
                    <div>
                      <p className="text-white font-medium">{profileData.name || "User"}</p>
                      <p className="text-[var(--text-muted)] text-sm">Admin</p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-theme text-sm mb-2">Full Name</label>
                        <GlassInput
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-theme text-sm mb-2">Email</label>
                        <GlassInput
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-theme text-sm mb-2">Phone Number</label>
                        <GlassInput
                          value={profileData.number}
                          onChange={(e) => setProfileData({ ...profileData, number: e.target.value })}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-theme text-sm mb-2">Company Name</label>
                        <GlassInput
                          value={profileData.company_name}
                          onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-theme text-sm mb-2">Address</label>
                      <GlassInput
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-theme text-sm mb-2">Website</label>
                        <GlassInput
                          value={profileData.website}
                          onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-theme text-sm mb-2">Country</label>
                        <GlassInput
                          value={profileData.country}
                          onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <h4 className="text-lg font-medium text-white mt-8 mb-4">Change Password</h4>

                    <div>
                      <label className="block text-theme text-sm mb-2">Current Password</label>
                      <GlassInput
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-theme text-sm mb-2">New Password</label>
                        <GlassInput
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Enter new password"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-theme text-sm mb-2">Confirm New Password</label>
                        <GlassInput
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <GlassButton
                        variant="primary"
                        onClick={handleSaveProfile}
                        disabled={loading}
                      >
                        {loading ? (
                          "Saving..."
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Profile Changes
                          </>
                        )}
                      </GlassButton>

                      <GlassButton
                        variant="default"
                        className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 border border-gray-500/50"
                        onClick={handleChangePassword}
                        disabled={loading}
                      >
                        {loading ? (
                          "Updating..."
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Change Password
                          </>
                        )}
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              </>
            )}

            {/* Appearance Settings - Same as before */}
            {activeTab === "appearance" && (
              // ... (Your existing appearance settings code remains the same)
              <div className="space-y-6">
                {/* Your existing appearance settings UI */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}







// "use client"

// import { useState } from "react"
// import { Header } from "@/components/layout"
// import { GlassCard, GlassButton, GlassInput } from "@/components/glass"
// import { useTheme } from "@/contexts/theme-context"
// import { Slider } from "@/components/ui/slider"
// import {
//   User,
//   Bell,
//   Palette,
//   Globe,
//   Shield,
//   Mail,
//   Phone,
//   Camera,
//   Save,
//   Check,
//   Type,
//   Layers,
//   ChevronDown,
//   Lock,
//   Sun,
//   Moon
// } from "lucide-react"
// import { Button } from "@/components/ui/button"

// export default function SettingsPage() {
//   const {
//     themeColor,
//     setThemeColor,
//     availableColors,
//     themeFont,
//     setThemeFont,
//     availableFonts,
//     backgroundColor,
//     setBackgroundColor,
//     themeMode,
//     setThemeMode,
//     glassSettings,
//     setGlassPreset,
//     setGlassCustomValue,
//     resetGlassToPreset
//   } = useTheme()
//   const [glassAdvancedOpen, setGlassAdvancedOpen] = useState(false)
//   const [activeTab, setActiveTab] = useState("profile")
//   const [profileData, setProfileData] = useState({
//     name: "John Doe",
//     email: "john@clasy.com",
//     phone: "+1 234 567 890",
//     bio: "Admin at Clasy Learning Platform"
//   })
//   const [notifications, setNotifications] = useState({
//     email: true,
//     push: true,
//     sms: false,
//     marketing: false
//   })

//   const handleSaveProfile = () => {
//     alert("Profile saved successfully!")
//   }

//   const handleSaveNotifications = () => {
//     alert("Notification preferences saved!")
//   }

//   const tabs = [
//     { id: "profile", name: "Profile", icon: User },
//     { id: "notifications", name: "Notifications", icon: Bell },
//     { id: "appearance", name: "Appearance", icon: Palette },
//     { id: "security", name: "Security", icon: Shield },
//   ]

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Settings" />

//       <div className="px-4 sm:px-6 space-y-4 sm:space-y-6 mt-6">
//         <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
//           {/* Sidebar */}
//           <div className="lg:w-56">
//             <GlassCard className="p-3">
//               <nav className="space-y-1">
//                 {tabs.map((tab) => {
//                   const Icon = tab.icon
//                   return (
//                     <Button
//                       key={tab.id}
//                       variant="ghost"
//                       onClick={() => setActiveTab(tab.id)}
//                       className={`w-full justify-start gap-2.5 h-9 px-3 text-sm font-normal glass ${
//                         activeTab === tab.id
//                           ? "ring-1 ring-[rgba(var(--theme-primary-rgb),0.5)] text-theme"
//                           : "text-[var(--text-tertiary)] hover:text-theme"
//                       }`}
//                     >
//                       <Icon className="w-4 h-4" />
//                       {tab.name}
//                     </Button>
//                   )
//                 })}
//               </nav>
//             </GlassCard>
//           </div>

//           {/* Content */}
//           <div className="flex-1 space-y-6">
//             {/* Profile Settings */}
//             {activeTab === "profile" && (
//               <>
//                 <GlassCard className="p-6">
//                   <div className="flex items-center gap-3 mb-6">
//                     <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
//                       <User className="w-5 h-5 text-theme" />
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-medium text-white">Profile Information</h3>
//                       <p className="text-[var(--text-muted)] text-sm">Update your personal details</p>
//                     </div>
//                   </div>

//                   {/* Avatar */}
//                   <div className="flex items-center gap-6 mb-6">
//                     <div className="relative">
//                       <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
//                         <span className="text-white text-2xl font-bold">JD</span>
//                       </div>
//                       <button className="absolute -bottom-1 -right-1 p-2 rounded-full glass-button">
//                         <Camera className="w-4 h-4 text-white" />
//                       </button>
//                     </div>
//                     <div>
//                       <p className="text-white font-medium">{profileData.name}</p>
//                       <p className="text-[var(--text-muted)] text-sm">Admin</p>
//                     </div>
//                   </div>

//                   {/* Form */}
//                   <div className="space-y-3 sm:space-y-4">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
//                       <div>
//                         <label className="block text-theme text-sm mb-2">Full Name</label>
//                         <GlassInput
//                           value={profileData.name}
//                           onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-theme text-sm mb-2">Email</label>
//                         <GlassInput
//                           type="email"
//                           value={profileData.email}
//                           onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-theme text-sm mb-2">Phone Number</label>
//                       <GlassInput
//                         value={profileData.phone}
//                         onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-theme text-sm mb-2">Bio</label>
//                       <textarea
//                         className="w-full px-4 py-2.5 rounded-lg glass-input text-white placeholder:text-[var(--text-muted)] text-sm resize-none h-24"
//                         value={profileData.bio}
//                         onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
//                       />
//                     </div>
//                     <GlassButton variant="primary" onClick={handleSaveProfile}>
//                       <Save className="w-4 h-4" />
//                       Save Changes
//                     </GlassButton>
//                   </div>
//                 </GlassCard>
//               </>
//             )}

//             {/* Notification Settings */}
//             {activeTab === "notifications" && (
//               <GlassCard className="p-6">
//                 <div className="flex items-center gap-3 mb-6">
//                   <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
//                     <Bell className="w-5 h-5 text-theme" />
//                   </div>
//                   <div>
//                     <h3 className="text-lg font-medium text-white">Notification Preferences</h3>
//                     <p className="text-[var(--text-muted)] text-sm">Manage how you receive notifications</p>
//                   </div>
//                 </div>

//                 <div className="space-y-3 sm:space-y-4">
//                   {[
//                     { key: "email", label: "Email Notifications", desc: "Receive email updates about your account", icon: Mail },
//                     { key: "push", label: "Push Notifications", desc: "Receive push notifications on your device", icon: Bell },
//                     { key: "sms", label: "SMS Notifications", desc: "Receive text messages for important updates", icon: Phone },
//                     { key: "marketing", label: "Marketing Emails", desc: "Receive news and promotional content", icon: Globe },
//                   ].map((item) => {
//                     const Icon = item.icon
//                     return (
//                       <div
//                         key={item.key}
//                         className="flex items-center justify-between p-4 rounded-xl glass"
//                       >
//                         <div className="flex items-center gap-4">
//                           <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
//                             <Icon className="w-5 h-5 text-theme" />
//                           </div>
//                           <div>
//                             <p className="text-white font-medium">{item.label}</p>
//                             <p className="text-[var(--text-muted)] text-sm">{item.desc}</p>
//                           </div>
//                         </div>
//                         <button
//                           onClick={() => setNotifications({
//                             ...notifications,
//                             [item.key]: !notifications[item.key as keyof typeof notifications]
//                           })}
//                           className={`w-12 h-6 rounded-full transition-colors relative ${
//                             notifications[item.key as keyof typeof notifications]
//                               ? "bg-theme-gradient"
//                               : "bg-theme-gradient"
//                           }`}
//                         >
//                           <div
//                             className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
//                               notifications[item.key as keyof typeof notifications]
//                                 ? "translate-x-7"
//                                 : "translate-x-1"
//                             }`}
//                           />
//                         </button>
//                       </div>
//                     )
//                   })}

//                   <GlassButton variant="primary" onClick={handleSaveNotifications}>
//                     <Save className="w-4 h-4" />
//                     Save Preferences
//                   </GlassButton>
//                 </div>
//               </GlassCard>
//             )}

//             {/* Appearance Settings */}
//             {activeTab === "appearance" && (
//               <div className="space-y-6">
//                 {/* Theme Mode Toggle */}
//                 <GlassCard className="p-6">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
//                         {themeMode === 'light' ? (
//                           <Sun className="w-5 h-5 text-theme" />
//                         ) : (
//                           <Moon className="w-5 h-5 text-theme" />
//                         )}
//                       </div>
//                       <div>
//                         <h3 className="text-lg font-medium text-[var(--text-primary)]">Theme Mode</h3>
//                         <p className="text-[var(--text-muted)] text-sm">Switch between light and dark mode</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <button
//                         onClick={() => setThemeMode('light')}
//                         className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all glass ${
//                           themeMode === 'light'
//                             ? "ring-1 ring-[rgba(var(--theme-primary-rgb),0.5)] text-theme"
//                             : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
//                         }`}
//                       >
//                         <Sun className="w-4 h-4" />
//                         Light
//                       </button>
//                       <button
//                         onClick={() => setThemeMode('dark')}
//                         className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all glass ${
//                           themeMode === 'dark'
//                             ? "ring-1 ring-[rgba(var(--theme-primary-rgb),0.5)] text-theme"
//                             : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
//                         }`}
//                       >
//                         <Moon className="w-4 h-4" />
//                         Dark
//                       </button>
//                     </div>
//                   </div>
//                 </GlassCard>
//                 {/* Theme Color Selection */}
//                 <GlassCard className="p-6">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
//                         <Palette className="w-5 h-5 text-theme" />
//                       </div>
//                       <div>
//                         <h3 className="text-lg font-medium text-[var(--text-primary)]">Theme Color</h3>
//                         <p className="text-[var(--text-muted)] text-sm">Choose your accent color</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       {availableColors.map(({ key, colors }) => (
//                         <button
//                           key={key}
//                           onClick={() => setThemeColor(key)}
//                           className={`w-6 h-6 rounded-full transition-all ${
//                             themeColor === key
//                               ? "ring-2 ring-white ring-offset-1 ring-offset-black/50 scale-110"
//                               : "hover:scale-110"
//                           }`}
//                           style={{ background: colors.gradientFrom }}
//                           title={colors.name}
//                         />
//                       ))}
//                     </div>
//                   </div>
//                 </GlassCard>

//                 {/* Glass Effect */}
//                 <GlassCard className="p-6">
//                   <div className="flex items-center gap-3 mb-6">
//                     <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
//                       <Layers className="w-5 h-5 text-theme" />
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-medium text-[var(--text-primary)]">Glass Effect</h3>
//                       <p className="text-[var(--text-muted)] text-sm">Control the glassmorphism intensity</p>
//                     </div>
//                   </div>

//                   {/* Preset Buttons */}
//                   <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
//                     {(["off", "subtle", "normal", "strong", "custom"] as const).map((preset) => (
//                       <button
//                         key={preset}
//                         onClick={() => preset !== "custom" && setGlassPreset(preset)}
//                         disabled={preset === "custom"}
//                         className={`px-3 py-2 rounded-lg text-sm font-medium transition-all glass ${
//                           glassSettings.preset === preset
//                             ? "ring-1 ring-[rgba(var(--theme-primary-rgb),0.5)] text-theme"
//                             : preset === "custom"
//                               ? "text-white/30 cursor-not-allowed"
//                               : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
//                         }`}
//                       >
//                         {preset.charAt(0).toUpperCase() + preset.slice(1)}
//                       </button>
//                     ))}
//                   </div>

//                   {/* Advanced Settings */}
//                   <div>
//                     <button
//                       onClick={() => setGlassAdvancedOpen(!glassAdvancedOpen)}
//                       className="flex items-center justify-between w-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
//                     >
//                       <span className="text-sm font-medium">Advanced Settings</span>
//                       <ChevronDown className={`w-4 h-4 transition-transform ${glassAdvancedOpen ? "rotate-180" : ""}`} />
//                     </button>

//                     {glassAdvancedOpen && (
//                       <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-[rgba(255,255,255,var(--glass-border-opacity))]">
//                         <Slider
//                           label="Background Opacity"
//                           value={Math.round(glassSettings.opacity * 100)}
//                           onChange={(v) => setGlassCustomValue("opacity", v / 100)}
//                           min={0}
//                           max={20}
//                           step={1}
//                           valueLabel={`${Math.round(glassSettings.opacity * 100)}%`}
//                         />

//                         <Slider
//                           label="Blur Amount"
//                           value={glassSettings.blur}
//                           onChange={(v) => setGlassCustomValue("blur", v)}
//                           min={0}
//                           max={40}
//                           step={2}
//                           valueLabel={`${glassSettings.blur}px`}
//                         />

//                         <Slider
//                           label="Border Opacity"
//                           value={Math.round(glassSettings.borderOpacity * 100)}
//                           onChange={(v) => setGlassCustomValue("borderOpacity", v / 100)}
//                           min={0}
//                           max={30}
//                           step={1}
//                           valueLabel={`${Math.round(glassSettings.borderOpacity * 100)}%`}
//                         />

//                         <Slider
//                           label="Saturation"
//                           value={glassSettings.saturation}
//                           onChange={(v) => setGlassCustomValue("saturation", v)}
//                           min={100}
//                           max={200}
//                           step={10}
//                           valueLabel={`${glassSettings.saturation}%`}
//                         />

//                         {glassSettings.preset === "custom" && (
//                           <div className="pt-2">
//                             <GlassButton
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => resetGlassToPreset("normal")}
//                             >
//                               Reset to Normal
//                             </GlassButton>
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 </GlassCard>

//                 {/* Background Color */}
//                 <GlassCard className="p-6">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
//                         <Palette className="w-5 h-5 text-theme" />
//                       </div>
//                       <div>
//                         <h3 className="text-lg font-medium text-[var(--text-primary)]">Background Color</h3>
//                         <p className="text-[var(--text-muted)] text-sm">Set the main background color</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       {(themeMode === 'dark' ? [
//                         { color: "#0a0a0a", name: "Midnight" },
//                         { color: "#0d1117", name: "GitHub Dark" },
//                         { color: "#1a1b26", name: "Tokyo Night" },
//                         { color: "#191724", name: "Rosé Pine" },
//                         { color: "#11111b", name: "Catppuccin" },
//                         { color: "#1e1e2e", name: "Mocha" },
//                         { color: "#0f172a", name: "Slate" },
//                         { color: "#18181b", name: "Zinc" },
//                       ] : [
//                         { color: "#f8fafc", name: "Slate" },
//                         { color: "#ffffff", name: "White" },
//                         { color: "#f9fafb", name: "Gray" },
//                         { color: "#fefefe", name: "Snow" },
//                         { color: "#f5f5f5", name: "Smoke" },
//                         { color: "#fafafa", name: "Ghost" },
//                         { color: "#f8f9fa", name: "Light" },
//                         { color: "#f1f5f9", name: "Cool" },
//                       ]).map((preset) => (
//                         <button
//                           key={preset.color}
//                           onClick={() => setBackgroundColor(preset.color)}
//                           className={`w-6 h-6 rounded-full transition-all border ${
//                             themeMode === 'dark' ? 'border-white/20' : 'border-black/20'
//                           } ${
//                             backgroundColor === preset.color
//                               ? "ring-2 ring-[var(--theme-gradient-from)] ring-offset-1 ring-offset-[var(--theme-bg-color)] scale-110"
//                               : "hover:scale-110"
//                           }`}
//                           style={{ backgroundColor: preset.color }}
//                           title={preset.name}
//                         />
//                       ))}
//                     </div>
//                   </div>
//                 </GlassCard>

//                 {/* Font Selection */}
//                 <GlassCard className="p-6">
//                   <div className="flex items-center gap-3 mb-6">
//                     <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
//                       <Type className="w-5 h-5 text-theme" />
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-medium text-[var(--text-primary)]">Font Family</h3>
//                       <p className="text-[var(--text-muted)] text-sm">Select your preferred font</p>
//                     </div>
//                   </div>

//                   <div className="space-y-1.5 sm:space-y-2">
//                     {availableFonts.map(({ key, config }) => (
//                       <button
//                         key={key}
//                         onClick={() => setThemeFont(key)}
//                         className={`w-full flex items-center justify-between p-4 rounded-xl glass transition-all ${
//                           themeFont === key ? "ring-1 ring-[rgba(var(--theme-primary-rgb),0.5)]" : ""
//                         }`}
//                       >
//                         <div className="flex items-center gap-4">
//                           <span
//                             className="text-2xl text-[var(--text-secondary)]"
//                             style={{ fontFamily: config.fontFamily }}
//                           >
//                             Aa
//                           </span>
//                           <span className="text-sm text-theme">
//                             {config.name}
//                           </span>
//                         </div>
//                         {themeFont === key && (
//                           <div className="w-6 h-6 rounded-full bg-[rgba(255,255,255,var(--ui-opacity-15))] flex items-center justify-center">
//                             <Check className="w-4 h-4 text-theme" />
//                           </div>
//                         )}
//                       </button>
//                     ))}
//                   </div>
//                 </GlassCard>

//               </div>
//             )}

//             {/* Security Settings */}
//             {activeTab === "security" && (
//               <div className="space-y-6">
//                 {/* Password Card */}
//                 <GlassCard className="p-6">
//                   <div className="flex items-center gap-3 mb-6">
//                     <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
//                       <Shield className="w-5 h-5 text-theme" />
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-medium text-white">Change Password</h3>
//                       <p className="text-[var(--text-muted)] text-sm">Update your password regularly</p>
//                     </div>
//                   </div>

//                   <div className="space-y-3 sm:space-y-4">
//                     <div>
//                       <label className="block text-theme text-sm mb-2">Current Password</label>
//                       <GlassInput type="password" placeholder="Enter current password" />
//                     </div>
//                     <div>
//                       <label className="block text-theme text-sm mb-2">New Password</label>
//                       <GlassInput type="password" placeholder="Enter new password" />
//                     </div>
//                     <div>
//                       <label className="block text-theme text-sm mb-2">Confirm New Password</label>
//                       <GlassInput type="password" placeholder="Confirm new password" />
//                     </div>

//                     <GlassButton variant="primary">
//                       <Shield className="w-4 h-4" />
//                       Update Password
//                     </GlassButton>
//                   </div>
//                 </GlassCard>

//                 {/* 2FA Card */}
//                 <GlassCard className="p-6">
//                   <div className="flex items-center gap-3 mb-6">
//                     <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center">
//                       <Lock className="w-5 h-5 text-theme" />
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
//                       <p className="text-[var(--text-muted)] text-sm">Add an extra layer of security</p>
//                     </div>
//                   </div>

//                   <div className="flex items-center justify-between p-4 rounded-xl glass">
//                     <div>
//                       <p className="text-white font-medium">2FA Status</p>
//                       <p className="text-[var(--text-muted)] text-sm">Currently disabled</p>
//                     </div>
//                     <GlassButton variant="primary">Enable 2FA</GlassButton>
//                   </div>
//                 </GlassCard>
//               </div>
//             )}

//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
