import React from 'react';
import { Heart, ShieldCheck, Clock, Lock } from 'lucide-react';
import logo from "../assets/antibiotics.webp"; // Ensure you have a relevant image in this path

// --- Reusable Component: Value Card ---
// A card to highlight a core value (e.g., Compassion, Expertise)
const ValueCard = ({ icon, title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-green-100 transform transition-transform hover:scale-105">
    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
      {icon}
    </div>
    <h3 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{children}</p>
  </div>
);

// --- Reusable Component: Team Member Card ---
// A card to feature a member of your pharmacy team
const TeamMemberCard = ({ name, title, bio, imageUrl }) => (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden text-center transition-shadow hover:shadow-xl">
    <img
      src={imageUrl}
      alt={name}
      className="w-full h-64 object-cover object-center"
      onError={(e) => { e.target.src = 'https://placehold.co/400x400/a7f3d0/14532d?text=Photo'; }}
    />
    <div className="p-6">
      <h4 className="text-xl font-bold text-green-800">{name}</h4>
      <p className="text-green-600 font-medium mb-3">{title}</p>
      <p className="text-gray-600 text-sm">{bio}</p>
    </div>
  </div>
);

// --- Main Page Component: AboutUsPage ---
const AboutUsPage = () => {
  return (
    <div className="bg-white text-gray-800 font-sans">
      {/* 1. Hero Section */}
      <section className="bg-green-50 text-center py-16 px-6">
        <h1 className="text-5xl font-extrabold text-green-800 mb-4">
          Your Digital Pharmacy
        </h1>
        <p className="text-xl text-green-700 max-w-3xl mx-auto leading-relaxed">
          Expert care, wellness products, and prescriptions delivered securely
          to your door.
        </p>
      </section>

      {/* 2. Our Mission Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-green-700 mb-6">
              Our Mission & Story
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Welcome to <b>InfxMart</b>, the future of pharmaceutical care.
              We founded our e-commerce pharmacy to bridge the gap between
              traditional, expert care and modern, digital convenience.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Our mission is to make health and wellness accessible to everyone,
              everywhere. We leverage technology to provide a seamless, secure,
              and supportive online experience—from easy prescription refills
              and auto-ship to a vast selection of health products, all reviewed
              by licensed professionals.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              We believe you shouldn't have to choose between the expertise of a
              trusted pharmacist and the convenience of online shopping. With
              us, you get both.
            </p>
          </div>
          <div className="flex justify-center">
            <img
              src={logo}
              alt="Our Pharmacy Storefront"
              className="rounded-lg shadow-2xl object-cover w-full max-w-lg"
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/600x400/a7f3d0/14532d?text=Our+Pharmacy";
              }}
            />
          </div>
        </div>
      </section>

      {/* 3. Our Values Section */}
      <section className="bg-green-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-green-700 text-center mb-12">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ValueCard
              icon={<ShieldCheck className="h-8 w-8 text-green-600" />}
              title="Expertise"
            >
              Our licensed pharmacists review every order and are available for
              secure online consultations.
            </ValueCard>
            <ValueCard
              icon={<Clock className="h-8 w-8 text-green-600" />}
              title="Convenience"
            >
              Order prescriptions, auto-refills, and wellness products 24/7 from
              the comfort of your home.
            </ValueCard>
            <ValueCard
              icon={<Lock className="h-8 w-8 text-green-600" />}
              title="Security"
            >
              Your personal health data and payments are protected with
              state-of-the-art, HIPAA-compliant encryption.
            </ValueCard>
            <ValueCard
              icon={<Heart className="h-8 w-8 text-green-600" />}
              title="Wellness"
            >
              We are dedicated to your entire health journey, providing curated
              products and resources for your well-being.
            </ValueCard>
          </div>
        </div>
      </section>

      {/* 4. Meet the Team Section (REMOVED) */}

      {/* 5. Call to Action Section */}
      <section className="bg-green-600 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Experience the Future of Pharmacy
          </h2>
          <p className="text-xl text-green-100 mb-8 leading-relaxed">
            Browse our online wellness shop or chat with a pharmacist today.
            We're here to help you on your health journey.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/shop" // Change to your shop link
              className="bg-white text-green-700 font-bold py-3 px-8 rounded-lg text-lg shadow-md hover:bg-gray-100 transition-colors"
            >
              Shop Our Store
            </a>
            {/* <a
              href="#contact" // Change to your contact/chat link
              className="bg-green-700 text-white border-2 border-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-green-800 transition-colors"
            >
              Chat with a Pharmacist
            </a> */}
          </div>
        </div>
      </section>
    </div>
  );
};


// --- Main App Component ---
// This is the default export that renders your page
export default function App() {
  return (
    <main>
      <AboutUsPage />
    </main>
  );
}

