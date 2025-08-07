import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const Settings = () => {
  return (
    <div className="min-h-screen bg-[#000814] text-gray-100">
      <Header />
      <main className="container mx-auto px-6 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Settings</h1>
        <p className="text-lg text-gray-400 max-w-2xl">
          Manage your profile, preferences, and account settings here.
        </p>
        {/* Add your settings forms and options here */}
      </main>
      <Footer />
    </div>
  );
};

export default Settings; 