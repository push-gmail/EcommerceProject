import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import backendApi from "../../../api/backendApi";

type UserLoginPopupProps = {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => Promise<void> | void;
};

type Step = "identifier" | "otp" | "verified";

export default function UserLoginPopup({
  open,
  onClose,
  onLoginSuccess,
}: UserLoginPopupProps) {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");

  const [checking, setChecking] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [exists, setExists] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const cleanIdentifier = identifier.trim().toLowerCase();

  const isValidIdentifier =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier) ||
    /^[0-9]{10}$/.test(cleanIdentifier);

  const resetPopup = () => {
    setStep("identifier");
    setIdentifier("");
    setOtp("");
    setChecking(false);
    setRequestingOtp(false);
    setVerifying(false);
    setExists(null);
    setMessage("");
    setError("");
  };

  useEffect(() => {
    if (!open) resetPopup();
  }, [open]);

  useEffect(() => {
    setExists(null);
    setMessage("");
    setError("");
    setOtp("");
    setStep("identifier");

    if (!cleanIdentifier || !isValidIdentifier) return;

    const timer = window.setTimeout(async () => {
      try {
        setChecking(true);

        const res = await backendApi.post("/user/check-login-identifier", {
          identifier: cleanIdentifier,
        });

        const found = Boolean(res.data?.exists);

        setExists(found);
        setMessage(res.data?.message || (found ? "Account found" : "Account not found"));
      } catch (err: any) {
        setExists(false);
        setError(err.response?.data?.message || "Account check failed");
      } finally {
        setChecking(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [cleanIdentifier, isValidIdentifier]);

  const handleRequestOtp = async (event: FormEvent) => {
    event.preventDefault();

    if (!exists || !isValidIdentifier) return;

    try {
      setRequestingOtp(true);
      setError("");
      setMessage("");

      const res = await backendApi.post("/user/request-login-otp", {
        identifier: cleanIdentifier,
      });

      setMessage(res.data?.message || "OTP sent successfully");
      setStep("otp");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();

    if (!otp.trim()) {
      setError("Please enter OTP");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      setMessage("");

      const res = await backendApi.post("/user/verify-login-otp", {
        identifier: cleanIdentifier,
        otp: otp.trim(),
      });

      setStep("verified");
      setMessage(res.data?.message || "Verified successfully");

      await onLoginSuccess();

      window.setTimeout(() => {
        onClose();
        navigate("/user/my-account", { replace: true });
      }, 700);
    } catch (err: any) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setVerifying(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/35 px-4 pt-[92px]">
      <div className="relative grid w-full max-w-[840px] grid-cols-1 overflow-hidden rounded-sm bg-white shadow-[0_8px_32px_rgba(0,0,0,0.28)] md:grid-cols-[335px_1fr]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#212121] shadow"
        >
          <X size={18} />
        </button>

        <div className="min-h-[528px] bg-[#2874f0] px-8 py-10 text-white">
          <h2 className="text-[30px] font-semibold">
            {step === "otp" ? "Verify OTP" : "Login"}
          </h2>

          <p className="mt-5 text-[18px] leading-8 text-white/90">
            Get access to your Orders, Wishlist and Recommendations
          </p>

          <div className="mt-32 flex justify-center">
            <div className="grid h-[130px] w-[180px] place-items-center rounded-xl bg-white/10 text-center text-sm">
              <div>
                <div className="text-5xl">🛒</div>
                <p className="mt-3 font-semibold">Grocery Account</p>
              </div>
            </div>
          </div>
        </div>

        {step === "identifier" && (
          <form onSubmit={handleRequestOtp} className="px-9 py-12">
            <label className="block text-[13px] text-[#878787]">
              Enter Email/Mobile number
            </label>

            <input
              autoFocus
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="mt-2 h-[42px] w-full border-b border-[#2874f0] text-[16px] text-[#212121] outline-none"
            />

            <div className="mt-3 min-h-[48px] text-[13px]">
              {checking && <span className="text-[#878787]">Checking account...</span>}

              {!checking && cleanIdentifier && !isValidIdentifier && (
                <span className="text-[#ff6161]">
                  Enter valid email or 10 digit phone number
                </span>
              )}

              {!checking && exists === true && (
                <span className="font-semibold text-[#26a541]">
                  Account found. You can request OTP.
                </span>
              )}

              {!checking && exists === false && (
                <div>
                  <p className="font-semibold text-[#ff6161]">
                    Account not found
                  </p>

                  <Link
                    to="/user/signup"
                    onClick={onClose}
                    className="mt-2 inline-block animate-pulse text-[14px] font-semibold text-[#2874f0]"
                  >
                    Create new account
                  </Link>
                </div>
              )}

              {error && <p className="font-semibold text-[#ff6161]">{error}</p>}
            </div>

            <p className="mt-5 text-[12px] leading-5 text-[#878787]">
              By continuing, you agree to Grocery&apos;s{" "}
              <span className="text-[#2874f0]">Terms of Use</span> and{" "}
              <span className="text-[#2874f0]">Privacy Policy</span>.
            </p>

            <button
              type="submit"
              disabled={!exists || !isValidIdentifier || checking || requestingOtp}
              className="mt-5 h-[48px] w-full bg-[#fb641b] text-[15px] font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#cfcfcf] disabled:text-[#878787]"
            >
              {requestingOtp ? "Sending OTP..." : "Request OTP"}
            </button>

            <div className="mt-40 text-center">
              <Link
                to="/user/signup"
                onClick={onClose}
                className="text-[14px] font-semibold text-[#2874f0]"
              >
                New to Grocery? Create an account
              </Link>
            </div>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="px-9 py-12">
            <p className="text-[14px] text-[#212121]">
              OTP sent to{" "}
              <span className="font-semibold text-[#2874f0]">
                {cleanIdentifier}
              </span>
            </p>

            <label className="mt-8 block text-[13px] text-[#878787]">
              Enter OTP
            </label>

            <input
              autoFocus
              value={otp}
              maxLength={6}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, ""))
              }
              className="mt-2 h-[42px] w-full border-b border-[#2874f0] text-[24px] tracking-[0.4em] text-[#212121] outline-none"
            />

            {message && (
              <p className="mt-4 text-[13px] font-semibold text-[#26a541]">
                {message}
              </p>
            )}

            {error && (
              <p className="mt-4 text-[13px] font-semibold text-[#ff6161]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={otp.length !== 6 || verifying}
              className="mt-7 h-[48px] w-full bg-[#fb641b] text-[15px] font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#cfcfcf] disabled:text-[#878787]"
            >
              {verifying ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={requestingOtp}
              className="mt-4 w-full text-center text-[14px] font-semibold text-[#2874f0]"
            >
              {requestingOtp ? "Resending..." : "Resend OTP"}
            </button>
          </form>
        )}

        {step === "verified" && (
          <div className="flex min-h-[528px] flex-col items-center justify-center px-9 py-12 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-[#26a541] text-4xl text-white">
              ✓
            </div>

            <h3 className="mt-5 text-[24px] font-semibold text-[#212121]">
              Verified successfully
            </h3>

            <p className="mt-2 text-[14px] text-[#878787]">
              Redirecting to My Account...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}