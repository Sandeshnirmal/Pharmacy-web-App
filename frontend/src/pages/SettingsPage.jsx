// 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft as ArrowLeftIcon,
  User as UserIcon,
  Bell as BellIcon,
  Shield as ShieldIcon,
  Users as UsersIcon,
  Plug as PlugIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  Key as KeyIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  CreditCard as CreditCardIcon,
  Briefcase as BriefcaseIcon,
  Globe as GlobeIcon,
  Clock as ClockIcon,
  Sun as SunIcon,
  Moon as MoonIcon
} from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();

  // State for various settings (example placeholders)
  const [generalSettings, setGeneralSettings] = useState({
    pharmacyName: 'MediCo Pharmacy',
    address: '123 Health Lane, Wellness City, 12345',
    contactEmail: 'support@medico.com',
    contactPhone: '+1 (555) 123-4567',
    timezone: 'America/New_York',
    currency: 'USD',
    theme: 'light', // 'light' or 'dark'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    newOrderAlerts: true,
    prescriptionApprovalAlerts: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    passwordExpiration: true,
    sessionTimeout: 60, // minutes
  });

  // Handlers for input changes
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationToggle = (name) => {
    setNotificationSettings(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    console.log('Saving General Settings:', generalSettings);
    console.log('Saving Notification Settings:', notificationSettings);
    console.log('Saving Security Settings:', securitySettings);
    // In a real application, you would send this data to your backend API
    console.log('Settings saved successfully!');
    // Optionally, show a success message to the user
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page in history
  };

  // Helper for rendering toggle switches
  const ToggleSwitch = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-700 text-sm font-medium">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" value="" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Settings</h1>
        <button
          onClick={handleGoBack}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>
      </div>

      <form onSubmit={handleSaveChanges} className="space-y-8">
        {/* General Settings Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <InfoIcon className="w-6 h-6 mr-3 text-blue-600" /> General Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="pharmacyName" className="block text-gray-700 text-sm font-semibold mb-2">Pharmacy Name</label>
              <input
                type="text"
                id="pharmacyName"
                name="pharmacyName"
                value={generalSettings.pharmacyName}
                onChange={handleGeneralChange}
                className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-gray-700 text-sm font-semibold mb-2">Address</label>
              <textarea
                id="address"
                name="address"
                rows="2"
                value={generalSettings.address}
                onChange={handleGeneralChange}
                className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              ></textarea>
            </div>
            <div>
              <label htmlFor="contactEmail" className="block text-gray-700 text-sm font-semibold mb-2">Contact Email</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={generalSettings.contactEmail}
                onChange={handleGeneralChange}
                className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="contactPhone" className="block text-gray-700 text-sm font-semibold mb-2">Contact Phone</label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={generalSettings.contactPhone}
                onChange={handleGeneralChange}
                className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="timezone" className="block text-gray-700 text-sm font-semibold mb-2">Timezone</label>
              <select
                id="timezone"
                name="timezone"
                value={generalSettings.timezone}
                onChange={handleGeneralChange}
                className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="America/New_York">America/New York</option>
                <option value="America/Los_Angeles">America/Los Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
              </select>
            </div>
            <div>
              <label htmlFor="currency" className="block text-gray-700 text-sm font-semibold mb-2">Currency</label>
              <select
                id="currency"
                name="currency"
                value={generalSettings.currency}
                onChange={handleGeneralChange}
                className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD - United States Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
            <div>
              <label htmlFor="theme" className="block text-gray-700 text-sm font-semibold mb-2">Theme</label>
              <div className="flex items-center space-x-4 mt-2">
                <button
                  type="button"
                  onClick={() => setGeneralSettings(prev => ({ ...prev, theme: 'light' }))}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${generalSettings.theme === 'light' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <SunIcon className="w-5 h-5 mr-2" /> Light
                </button>
                <button
                  type="button"
                  onClick={() => setGeneralSettings(prev => ({ ...prev, theme: 'dark' }))}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${generalSettings.theme === 'dark' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <MoonIcon className="w-5 h-5 mr-2" /> Dark
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <BellIcon className="w-6 h-6 mr-3 text-blue-600" /> Notification Settings
          </h2>
          <div className="space-y-4">
            <ToggleSwitch
              label="Email Notifications"
              checked={notificationSettings.emailNotifications}
              onChange={() => handleNotificationToggle('emailNotifications')}
            />
            <ToggleSwitch
              label="SMS Notifications"
              checked={notificationSettings.smsNotifications}
              onChange={() => handleNotificationToggle('smsNotifications')}
            />
            <ToggleSwitch
              label="Low Stock Alerts"
              checked={notificationSettings.lowStockAlerts}
              onChange={() => handleNotificationToggle('lowStockAlerts')}
            />
            <ToggleSwitch
              label="New Order Alerts"
              checked={notificationSettings.newOrderAlerts}
              onChange={() => handleNotificationToggle('newOrderAlerts')}
            />
            <ToggleSwitch
              label="Prescription Approval Alerts"
              checked={notificationSettings.prescriptionApprovalAlerts}
              onChange={() => handleNotificationToggle('prescriptionApprovalAlerts')}
            />
          </div>
        </div>

        {/* Security Settings Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <ShieldIcon className="w-6 h-6 mr-3 text-blue-600" /> Security Settings
          </h2>
          <div className="space-y-4">
            <ToggleSwitch
              label="Two-Factor Authentication (2FA)"
              checked={securitySettings.twoFactorAuth}
              onChange={() => handleSecurityChange({ target: { name: 'twoFactorAuth', type: 'checkbox', checked: !securitySettings.twoFactorAuth } })}
            />
            <ToggleSwitch
              label="Enforce Password Expiration"
              checked={securitySettings.passwordExpiration}
              onChange={() => handleSecurityChange({ target: { name: 'passwordExpiration', type: 'checkbox', checked: !securitySettings.passwordExpiration } })}
            />
            <div>
              <label htmlFor="sessionTimeout" className="block text-gray-700 text-sm font-semibold mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                id="sessionTimeout"
                name="sessionTimeout"
                value={securitySettings.sessionTimeout}
                onChange={handleSecurityChange}
                min="5"
                max="120"
                className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              className="flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200"
            >
              <KeyIcon className="w-5 h-5 mr-2" />
              Change Password
            </button>
          </div>
        </div>

        {/* User Management (Conceptual - would link to a separate page) */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <UsersIcon className="w-6 h-6 mr-3 text-blue-600" /> User Management
          </h2>
          <p className="text-gray-700 mb-4">
            Manage user accounts, roles, and permissions within the application.
          </p>
          <button
            type="button"
            onClick={() => console.log('Navigate to User Management')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
          >
            Go to User Management
          </button>
        </div>

        {/* Integrations (Conceptual) */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <PlugIcon className="w-6 h-6 mr-3 text-blue-600" /> Integrations
          </h2>
          <p className="text-gray-700 mb-4">
            Connect your pharmacy application with third-party services.
          </p>
          <button
            type="button"
            onClick={() => console.log('Manage Integrations')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
          >
            Manage Integrations
          </button>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end pt-4 pb-8">
          <button
            type="submit"
            className="flex items-center px-8 py-4 bg-green-600 text-white font-semibold text-lg rounded-lg shadow-xl hover:bg-green-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <SaveIcon className="w-6 h-6 mr-3" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
