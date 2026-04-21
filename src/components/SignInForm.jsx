import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./screens.css";
import { API_BASE } from "../utils/api";

function SignInForm() {
const navigate = useNavigate();

const [formData, setformData] = useState({
  username: "",
  email: "",
  password: "",
})


const [error, setError] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
const [isGoogleLoading, setIsGoogleLoading] = useState(false);


const googleHandler = async () =>{
 try{
   setError("");
   setIsGoogleLoading(true);
   window.location.href = `${API_BASE}/users/google`;
  
 }catch(err){
 setError(err.response?.data?.message);
 setIsGoogleLoading(false);
 }
}

const Submited = async (e) =>{
  e.preventDefault();
  try{
setError("");
setIsSubmitting(true);

if (isSignup) {
   await axios.post(`${API_BASE}/users/register`,
       formData,
       { withCredentials: true })
  setformData({
  username: "",
  email: "",
  password: ""
})
navigate("/coding")
} else {
  await axios.post(`${API_BASE}/users/login`, formData, {
    withCredentials: true,
  });
  navigate("/coding")
}

  }
  catch(err){
    
    setError(err.response?.data?.message);
  } finally {
    setIsSubmitting(false);
  }
}

  const handleChange = (e) =>{
    setformData({
      ...formData,
      [e.target.name] : e.target.value,
      
    })
  }

  const [isSignup, setIsSignup] = useState(false);

  return (
    <section className="screen-shell signin-screen">
      <div className="signin-panel">
        
        <div className="signin-heading">
          <h2>AI Code Reviewer</h2>
          <p>{isSignup ? "Create your account" : "Sign in to your workspace"}</p>
        </div>

        {/* GOOGLE BUTTON */}
        {!isSignup && (
          <>
<button
  className="signin-social"
  type="button"
  onClick={googleHandler}
  disabled={isGoogleLoading || isSubmitting}
>
  <span className="signin-google-icon" aria-hidden="true">
    <svg viewBox="0 0 48 48" role="img">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.244 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691 12.88 19.51C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.347 4.337-17.694 10.691Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.168 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.144 35.091 26.715 36 24 36c-5.223 0-9.618-3.317-11.283-7.946l-6.525 5.025C9.5 39.556 16.227 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.084 5.57h.003l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z"
      />
    </svg>
  </span>
  {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
</button>

            <div className="signin-divider">Or continue with</div>
          </>
        )}

        {/* FORM */}
        <form className="signin-form" onSubmit={Submited}>
          
          {isSignup && (
            <div className="signin-field">
              <label>Username</label>
              <input className="signin-input" name="username" type="text" placeholder="Enter username" 
              value={formData.username}
              onChange={handleChange}
              />
            </div>
          )}

          <div className="signin-field">
            <label>Email</label>
            <input className="signin-input" name="email" type="email" placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
             />
          </div>

          <div className="signin-field">
            <label>Password</label>
            <input className="signin-input" name="password" type="password" placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
             />
          </div>
          {error && <p className="signin-error">{error}</p>}
          <button
            className="signin-submit"
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
          >
            {isSubmitting
              ? isSignup
                ? "Signing Up..."
                : "Signing In..."
              : isSignup
                ? "Sign Up"
                : "Sign In"}
          </button>
        </form>

        {/* TOGGLE */}
        <p className="signin-footer">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <button
            type="button"
            className="signin-link-btn"
            disabled={isSubmitting || isGoogleLoading}
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? " Sign In" : " Sign Up"}
          </button>
        </p>

      </div>
    </section>
  );
}

export default SignInForm;
