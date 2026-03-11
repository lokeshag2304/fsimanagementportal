// // app/auth/verify-otp/page.tsx
// "use client";

// import { useState, useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { GlassCard } from "@/components/glass/glass-card";
// import { GlassButton } from "@/components/glass/glass-button";
// import { ThemeToggle } from "@/components/ui/theme-toggle";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/useToast";
// import { ArrowLeft, RefreshCw } from "lucide-react";
// import { authApi } from "@/components/shared/api";

// export default function VerifyOTPPage() {
//   const [otp, setOtp] = useState(["", "", "", ""]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [timer, setTimer] = useState(60);
//   const [userId, setUserId] = useState<number | null>(null);
//   const [selectedMethod, setSelectedMethod] = useState<
//     "email" | "sms" | "whatsapp" | null
//   >(null);
//   const [userEmail, setUserEmail] = useState("");
//   const [isForgotPasswordFlow, setIsForgotPasswordFlow] = useState(false);
//   const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
//   const router = useRouter();
//   const {  setAuthData } = useAuth();
//   const { toast } = useToast();

//   useEffect(() => {
//     // Check if this is forgot password flow
//     const forgotFlow = localStorage.getItem("forgot_password_flow");
//     setIsForgotPasswordFlow(forgotFlow === "true");

//     if (forgotFlow === "true") {
//       // Get data for forgot password flow
//       const userIdStr = localStorage.getItem("forgot_user_id");
//       const method = localStorage.getItem("forgot_method") as
//         | "email"
//         | "sms"
//         | "whatsapp"
//         | null;
//       const contact = localStorage.getItem("reset_contact");

//       if (userIdStr) setUserId(parseInt(userIdStr));
//       if (method) setSelectedMethod(method);
//       if (contact) setUserEmail(contact);
//     } else {
//       // Get data for login flow
//       const userIdStr = localStorage.getItem("otp_user_id");
//       const method = localStorage.getItem("otp_method") as
//         | "email"
//         | "sms"
//         | "whatsapp"
//         | null;
//       const email = localStorage.getItem("user_email");

//       if (userIdStr) setUserId(parseInt(userIdStr));
//       if (method) setSelectedMethod(method);
//       if (email) setUserEmail(email);
//     }

//     // Start countdown timer
//     const interval = setInterval(() => {
//       setTimer((prev) => (prev > 0 ? prev - 1 : 0));
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   const handleOtpChange = (index: number, value: string) => {
//     if (!/^\d*$/.test(value)) return;
//     if (value.length > 1) return;

//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);
//     setError("");

//     if (value && index < 3) {
//       inputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//   };

//   const handleVerify = async () => {
//     const otpCode = otp.join("");

//     if (otpCode.length !== 4) {
//       setError("Please enter complete 4-digit OTP");
//       return;
//     }

//     if (!/^\d{4}$/.test(otpCode)) {
//       setError("OTP must be 4 digits");
//       return;
//     }

//     if (!userId || !selectedMethod) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Session expired. Please try again.",
//       });
//       router.push("/auth/login");
//       return;
//     }

//     setIsLoading(true);
//     setError("");

//     try {
//       if (isForgotPasswordFlow) {
//         // Forgot password flow - verify OTP for forgot password
//         const response = await authApi.verifyOtpForForget(
//           otpCode,
//           selectedMethod === "sms" ? "phone" : selectedMethod,
//           userId,
//         );

//         if (response.status && response.changepasswordurl) {
//           toast({
//             variant: "success",
//             title: "Success",
//             description: response.message || "OTP verified successfully!",
//           });

//           // Extract token from URL
//           const token = response.changepasswordurl.split("/").pop();
//           if (token) {
//             localStorage.setItem("reset_token", token);
//             localStorage.setItem("forgot_user_id", userId.toString());

//             // Clear temp data
//             localStorage.removeItem("forgot_method");
//             localStorage.removeItem("reset_contact");

//             // Redirect to change password page
//             setTimeout(() => {
//               router.push(`/auth/change-password?token=${token}`);
//             }, 1000);
//           }
//         } else {
//           setError(response.message || "Invalid OTP");
//           toast({
//             variant: "destructive",
//             title: "Error",
//             description: response.message || "Invalid OTP",
//           });
//           setOtp(["", "", "", ""]);
//           inputRefs.current[0]?.focus();
//         }
//       } else {
//         // Login flow - verify OTP for login
//         const response = await authApi.verifyOtp(
//           otpCode,
//           selectedMethod,
//           userId,
//         );

//         if (response.status && response.route_access_token) {
//           toast({
//             variant: "success",
//             title: "Success",
//             description: response.message || "OTP verified successfully!",
//           });

//           // if (response.Data) {
//           //   const userData = response.Data;

//           //   // Update auth context with user data
//           //   updateUser(userData);

//           //   // Store token
//           //   localStorage.setItem("authToken", response.route_access_token);

//           //   // Clear temp data
//           //   localStorage.removeItem("temp_user_data");
//           //   localStorage.removeItem("otp_user_id");
//           //   localStorage.removeItem("otp_method");
//           //   localStorage.removeItem("user_email");

//           //   // Redirect based on login type
//           //   setTimeout(() => {
//           //     switch (userData.login_type) {
//           //       case 1:
//           //         router.push("/SuperAdmin/dashboard");
//           //         break;
//           //       case 2:
//           //         router.push("/UserAdmin/dashboard");
//           //         break;
//           //       case 3:
//           //         router.push("/ClientAdmin/dashboard");
//           //         break;
//           //       default:
//           //         router.push("/");
//           //     }
//           //   }, 1000);
//           // }
//           if (response.Data) {
//   const apiUser = response.Data;

//   // Transform API data to match User interface (same as AuthContext)
//   const userData: User = {
//     id: apiUser.id,
//     name: apiUser.name,
//     email: apiUser.email,
//     profile: apiUser.profile,
//     login_type: apiUser.login_type,
//     role: apiUser.login_type === 1 
//       ? 'superadmin' 
//       : apiUser.login_type === 2 
//       ? 'useradmin' 
//       : 'clientadmin',
//     whatsapp_status: 1,
//     email_status: 1,
//     sms_status: 1,
//     subadmin_id: apiUser.subadmin_id ?? undefined,
//   };

//   // Use setAuthData from context - this will properly set user AND localStorage ✅
//  // const { setAuthData } = useAuth(); // Add this to your destructuring
//   setAuthData(userData, response.route_access_token);

//   // Clear temp data
//   localStorage.removeItem("temp_user_data");
//   localStorage.removeItem("otp_user_id");
//   localStorage.removeItem("otp_method");
//   localStorage.removeItem("user_email");

//   // Redirect based on login type
//   setTimeout(() => {
//     switch (apiUser.login_type) {
//       case 1:
//         router.push("/SuperAdmin/dashboard");
//         break;
//       case 2:
//         router.push("/UserAdmin/dashboard");
//         break;
//       case 3:
//         router.push("/ClientAdmin/dashboard");
//         break;
//       default:
//         router.push("/");
//     }
//   }, 1000);
// }
//         } else {
//           setError(response.message || "Invalid OTP");
//           toast({
//             variant: "destructive",
//             title: "Error",
//             description: response.message || "Invalid OTP",
//           });
//           setOtp(["", "", "", ""]);
//           inputRefs.current[0]?.focus();
//         }
//       }
//     } catch (error: any) {
//       setError(error.message || "Verification failed");
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Verification failed",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResend = async () => {
//     if (!userId || !selectedMethod || timer > 0) return;

//     setIsLoading(true);

//     try {
//       if (isForgotPasswordFlow) {
//         // Resend OTP for forgot password
//         let response;
//         if (selectedMethod === "sms") {
//           response = await authApi.sendSmsOtp(userEmail, "91");
//         } else if (selectedMethod === "whatsapp") {
//           response = await authApi.sendWhatsappOtp(userEmail, "91");
//         }

//         if (response?.status) {
//           toast({
//             variant: "success",
//             title: "Success",
//             description: response.message || "OTP resent successfully!",
//           });
//           setTimer(60);
//           setError("");
//           setOtp(["", "", "", ""]);
//           inputRefs.current[0]?.focus();
//         }
//       } else {
//         // Resend OTP for login
//         const response = await authApi.sendOtp(
//           userId,
//           selectedMethod,
//           userEmail,
//         );

//         if (response.status) {
//           toast({
//             variant: "success",
//             title: "Success",
//             description: response.message || "OTP resent successfully!",
//           });
//           setTimer(60);
//           setError("");
//           setOtp(["", "", "", ""]);
//           inputRefs.current[0]?.focus();
//         }
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Failed to resend OTP",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getMethodText = () => {
//     if (!selectedMethod) return "";
//     switch (selectedMethod) {
//       case "email":
//         return "email";
//       case "sms":
//         return "phone number";
//       case "whatsapp":
//         return "WhatsApp";
//       default:
//         return "selected method";
//     }
//   };

//   const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
//     e.preventDefault();

//     const pastedData = e.clipboardData.getData("text").trim();

//     // Sirf 4 digit numeric OTP allow
//     if (!/^\d{4}$/.test(pastedData)) return;

//     const digits = pastedData.split("");

//     setOtp(digits);

//     // Last input pe focus
//     requestAnimationFrame(() => {
//       inputRefs.current[3]?.focus();
//     });
//   };

//   if (!userId || !selectedMethod) {
//     return (
//       <div className="min-h-screen flex items-center justify-center p-4">
//         <div className="absolute top-6 right-6">
//           <ThemeToggle />
//         </div>
//         <GlassCard className="p-6 w-full max-w-md">
//           <div className="text-center py-8">
//             <div className="w-8 h-8 border-2 border-[var(--theme-gradient-from)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//             <p className="text-[var(--text-muted)]">
//               Loading verification data...
//             </p>
//           </div>
//         </GlassCard>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4">
//       <div className="absolute top-6 right-6">
//         <ThemeToggle />
//       </div>

//       <div className="w-full max-w-md">
//         <div className="text-center mb-8">
//           <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
//             {isForgotPasswordFlow ? "Reset Password" : "Two-Step Verification"}
//           </h1>
//           <p className="text-[var(--text-muted)]">
//             We've sent a 4-digit OTP to your {getMethodText()}
//           </p>
//           <p className="text-[var(--text-tertiary)] text-sm mt-1">
//             {selectedMethod === "email" ? userEmail : userEmail}
//           </p>
//         </div>

//         <GlassCard className="p-6">
//           {/* OTP Input */}
//           <div className="flex gap-3 justify-center mb-6">
//             {otp.map((digit, index) => (
//               <input
//                 key={index}
//                 ref={(el) => { inputRefs.current[index] = el; }}
//                 type="text"
//                 inputMode="numeric"
//                 maxLength={1}
//                 value={digit}
//                 onChange={(e) => handleOtpChange(index, e.target.value)}
//                 onKeyDown={(e) => handleKeyDown(index, e)}
//                 onPaste={handleOtpPaste}
//                 className="w-14 h-14 text-center text-xl font-bold rounded-xl glass-input border-[rgba(255,255,255,var(--glass-border-opacity))] text-[var(--text-primary)] focus:border-[var(--theme-gradient-from)] focus:outline-none"
//                 disabled={isLoading}
//               />
//             ))}
//           </div>

//           {error && (
//             <div className="text-red-400 text-sm text-center mb-4">{error}</div>
//           )}

//           {/* Action Buttons */}
//           <div className="flex gap-3 mb-4">
//             <GlassButton
//               onClick={() => router.back()}
//               variant="secondary"
//               className="flex-1"
//               disabled={isLoading}
//             >
//               <ArrowLeft className="w-4 h-4 mr-2" />
//               Back
//             </GlassButton>
//             <GlassButton
//               onClick={handleVerify}
//               variant="primary"
//               className="flex-1"
//               disabled={isLoading || otp.join("").length !== 4}
//             >
//               {isLoading ? (
//                 <div className="flex items-center gap-2">
//                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   Verifying...
//                 </div>
//               ) : (
//                 "Verify OTP"
//               )}
//             </GlassButton>
//           </div>

//           {/* Resend OTP */}
//           <div className="text-center">
//             {timer > 0 ? (
//               <p className="text-[var(--text-muted)] text-sm">
//                 Resend OTP in {timer}s
//               </p>
//             ) : (
//               <button
//                 onClick={handleResend}
//                 disabled={isLoading}
//                 className="text-theme text-sm hover:underline flex items-center gap-1 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <RefreshCw className="w-4 h-4" />
//                 Resend OTP
//               </button>
//             )}
//           </div>
//         </GlassCard>
//       </div>
//     </div>
//   );
// }








// app/auth/verify-otp/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { authApi } from "@/components/shared/api";

// Define User type (or import it from where it's defined)
interface User {
  id: number;
  name: string;
  email: string;
  profile: string;
  login_type: number;
  role: 'SuperAdmin' | 'UserAdmin' | 'ClientAdmin';
  whatsapp_status: number;
  email_status: number;
  sms_status: number;
  subadmin_id?: number;
}

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<
    "email" | "sms" | "whatsapp" | null
  >(null);
  const [userEmail, setUserEmail] = useState("");
  const [isForgotPasswordFlow, setIsForgotPasswordFlow] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { setAuthData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if this is forgot password flow
    const forgotFlow = localStorage.getItem("forgot_password_flow");
    setIsForgotPasswordFlow(forgotFlow === "true");

    if (forgotFlow === "true") {
      // Get data for forgot password flow
      const userIdStr = localStorage.getItem("forgot_user_id");
      const method = localStorage.getItem("forgot_method") as
        | "email"
        | "sms"
        | "whatsapp"
        | null;
      const contact = localStorage.getItem("reset_contact");

      if (userIdStr) setUserId(parseInt(userIdStr));
      if (method) setSelectedMethod(method);
      if (contact) setUserEmail(contact);
    } else {
      // Get data for login flow
      const userIdStr = localStorage.getItem("otp_user_id");
      const method = localStorage.getItem("otp_method") as
        | "email"
        | "sms"
        | "whatsapp"
        | null;
      const email = localStorage.getItem("user_email");

      if (userIdStr) setUserId(parseInt(userIdStr));
      if (method) setSelectedMethod(method);
      if (email) setUserEmail(email);
    }

    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 4) {
      setError("Please enter complete 4-digit OTP");
      return;
    }

    if (!/^\d{4}$/.test(otpCode)) {
      setError("OTP must be 4 digits");
      return;
    }

    if (!userId || !selectedMethod) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Session expired. Please try again.",
      });
      router.push("/auth/login");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (isForgotPasswordFlow) {
        // Forgot password flow - verify OTP for forgot password
        const response = await authApi.verifyOtpForForget(
          otpCode,
          selectedMethod === "sms" ? "phone" : selectedMethod,
          userId,
        );

        if (response.status && response.changepasswordurl) {
          toast({
            variant: "destructive",
            title: "Success",
            description: response.message || "OTP verified successfully!",
          });

          // Extract token from URL
          const token = response.changepasswordurl.split("/").pop();
          if (token) {
            localStorage.setItem("reset_token", token);
            localStorage.setItem("forgot_user_id", userId.toString());

            // Clear temp data
            localStorage.removeItem("forgot_method");
            localStorage.removeItem("reset_contact");

            // Redirect to change password page
            setTimeout(() => {
              router.push(`/auth/change-password?token=${token}`);
            }, 1000);
          }
        } else {
          setError(response.message || "Invalid OTP");
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Invalid OTP",
          });
          setOtp(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      } else {
        // Login flow - verify OTP for login
        const response = await authApi.verifyOtp(
          otpCode,
          selectedMethod,
          userId,
        );

        if (response.status && response.route_access_token) {
          toast({
            variant: "destructive",
            title: "Success",
            description: response.message || "OTP verified successfully!",
          });

          if (response.Data) {
            const apiUser = response.Data;

            // Transform API data to match User interface
            const userData: User = {
              id: apiUser.id,
              name: apiUser.name,
              email: apiUser.email,
              profile: apiUser.profile || "",
              login_type: apiUser.login_type,
              role: apiUser.login_type === 1
                ? 'SuperAdmin'
                : apiUser.login_type === 2
                  ? 'UserAdmin'
                  : 'ClientAdmin',
              whatsapp_status: 1,
              email_status: 1,
              sms_status: 1,
              subadmin_id: apiUser.subadmin_id ?? undefined,
            };

            // Use setAuthData from context - this will properly set user AND localStorage
            setAuthData(userData, response.route_access_token);

            // Clear temp data
            localStorage.removeItem("temp_user_data");
            localStorage.removeItem("otp_user_id");
            localStorage.removeItem("otp_method");
            localStorage.removeItem("user_email");

            // Redirect based on login type
            setTimeout(() => {
              switch (apiUser.login_type) {
                case 1:
                  router.push("/SuperAdmin/dashboard");
                  break;
                case 2:
                  router.push("/UserAdmin/dashboard");
                  break;
                case 3:
                  router.push("/client/dashboard");
                  break;
                default:
                  router.push("/");
              }
            }, 1000);
          }
        } else {
          setError(response.message || "Invalid OTP");
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Invalid OTP",
          });
          setOtp(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      }
    } catch (error: any) {
      setError(error.message || "Verification failed");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Verification failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId || !selectedMethod || timer > 0) return;

    setIsLoading(true);

    try {
      if (isForgotPasswordFlow) {
        // Resend OTP for forgot password
        let response;
        if (selectedMethod === "sms") {
          response = await authApi.sendSmsOtp(userEmail, "91");
        } else if (selectedMethod === "whatsapp") {
          response = await authApi.sendWhatsappOtp(userEmail, "91");
        }

        if (response?.status) {
          toast({
            variant: "destructive",
            title: "Success",
            description: response.message || "OTP resent successfully!",
          });
          setTimer(60);
          setError("");
          setOtp(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      } else {
        // Resend OTP for login
        const response = await authApi.sendOtp(
          userId,
          selectedMethod,
          userEmail,
        );

        if (response.status) {
          toast({
            variant: "destructive",
            title: "Success",
            description: response.message || "OTP resent successfully!",
          });
          setTimer(60);
          setError("");
          setOtp(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to resend OTP",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodText = () => {
    if (!selectedMethod) return "";
    switch (selectedMethod) {
      case "email":
        return "email";
      case "sms":
        return "phone number";
      case "whatsapp":
        return "WhatsApp";
      default:
        return "selected method";
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pastedData = e.clipboardData.getData("text").trim();

    // Sirf 4 digit numeric OTP allow
    if (!/^\d{4}$/.test(pastedData)) return;

    const digits = pastedData.split("");

    setOtp(digits);

    // Last input pe focus
    requestAnimationFrame(() => {
      inputRefs.current[3]?.focus();
    });
  };

  if (!userId || !selectedMethod) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <GlassCard className="p-6 w-full max-w-md">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-[var(--theme-gradient-from)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">
              Loading verification data...
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {isForgotPasswordFlow ? "Reset Password" : "Two-Step Verification"}
          </h1>
          <p className="text-[var(--text-muted)]">
            We've sent a 4-digit OTP to your {getMethodText()}
          </p>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            {selectedMethod === "email" ? userEmail : userEmail}
          </p>
        </div>

        <GlassCard className="p-6">
          {/* OTP Input */}
          <div className="flex gap-3 justify-center mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handleOtpPaste}
                className="w-14 h-14 text-center text-xl font-bold rounded-xl glass-input border-[rgba(255,255,255,var(--glass-border-opacity))] text-[var(--text-primary)] focus:border-[var(--theme-gradient-from)] focus:outline-none"
                disabled={isLoading}
              />
            ))}
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center mb-4">{error}</div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            <GlassButton
              onClick={() => router.back()}
              variant="secondary"
              className="flex-1"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </GlassButton>
            <GlassButton
              onClick={handleVerify}
              variant="primary"
              className="flex-1"
              disabled={isLoading || otp.join("").length !== 4}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                "Verify OTP"
              )}
            </GlassButton>
          </div>

          {/* Resend OTP */}
          <div className="text-center">
            {timer > 0 ? (
              <p className="text-[var(--text-muted)] text-sm">
                Resend OTP in {timer}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="text-theme text-sm hover:underline flex items-center gap-1 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                Resend OTP
              </button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}