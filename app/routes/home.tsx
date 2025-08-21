import type { Route } from "./+types/home";
import Navbar from "~/components/navbar";
import {resumes} from "../../constants";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {useLocation, useNavigate} from "react-router";
import {useEffect} from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RESUMIND" },
    { name: "description", content: "smartfeedback for your dream job!" },
  ];
}

export default function Home() {

    const {isLoading,auth} = usePuterStore();
    const location =useLocation();

    const navigate=useNavigate();
    // @ts-ignore
    useEffect(() => {
        if (isLoading) return;
        if (!auth.isAuthenticated) {
            navigate(`/auth?next=${encodeURIComponent(location.pathname)}`); ///SOME CHANGEE
        }

    },[auth.isAuthenticated,isLoading,navigate,location.pathname]); //SOME CHANGE

    return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
   <Navbar/>


    <section className="main-section">
      <div className="page-heading">
        <h1>Track your Application and Resume Ratings</h1>
        <h2> Review your submission and check AI-powerd feedback.</h2>
      </div>


      {resumes.length>0 && (
        <div className="resumes-section">
          {resumes.map((resume) => (
               <ResumeCard key={resume.id} resume={resume}/>
    ))}
        </div>
        )}
    </section>
  </main>
}
